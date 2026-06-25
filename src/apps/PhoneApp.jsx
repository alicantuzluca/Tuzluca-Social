import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer } from 'peerjs';
import { supabase } from '../supabaseClient';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneOff, PhoneMissed, Mic, MicOff, Volume2, VolumeX, Grid3x3, Clock, Users, Check, Headphones } from 'lucide-react';
import { playClick, playRingtone, playDialTone } from '../audio';

// ─────────────────────────────────────────────────────────────────────────
export default function PhoneApp({ myProfile, isActiveApp }) {
  const [tab, setTab] = useState('keypad'); // keypad | recents | contacts
  const [dialInput, setDialInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [recents, setRecents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Call state
  const [callState, setCallState] = useState('idle'); // idle | outgoing | incoming | active
  const [activeCall, setActiveCall] = useState(null);  // { callId, remote (profile), direction }
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showCallKeypad, setShowCallKeypad] = useState(false);
  const [callDtmfInput, setCallDtmfInput] = useState('');
  const [devices, setDevices] = useState({ inputs: [], outputs: [] });
  const [selectedInput, setSelectedInput] = useState(localStorage.getItem('preferredAudioInput') || 'default');
  const [selectedOutput, setSelectedOutput] = useState(localStorage.getItem('preferredAudioOutput') || 'default');

  const durationTimer = useRef(null);
  const subscriptionRef = useRef(null);
  const dialToneInterval = useRef(null);
  
  // PeerJS refs
  const peerRef = useRef(null);
  const peerCallRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingAnswerRef = useRef(false);

  // Use refs to avoid stale closures in event listeners
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const activeCallRef = useRef(activeCall);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  // ── Initialize PeerJS & Load Data ──────────────────────────────────────
  useEffect(() => {
    if (!myProfile) return;

    // React Strict Mode workaround: Cache Peer instance globally so it isn't repeatedly destroyed/recreated quickly
    let peer;
    if (window.globalPhonePeer && window.globalPhonePeer.id === myProfile.id && !window.globalPhonePeer.destroyed) {
      peer = window.globalPhonePeer;
    } else {
      if (window.globalPhonePeer) window.globalPhonePeer.destroy();
      peer = new Peer(myProfile.id, { 
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });
      window.globalPhonePeer = peer;
    }
    peerRef.current = peer;

    const handleCall = (call) => {
      peerCallRef.current = call;
      if (pendingAnswerRef.current && localStreamRef.current) {
        pendingAnswerRef.current = false;
        call.answer(localStreamRef.current);
        call.on('stream', (remoteStream) => {
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
        });
        call.on('close', () => endCallLocally());
      }
    };

    const handleDisconnected = () => {
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.reconnect();
      }
    };

    const handleError = (err) => {
      console.error('PeerJS Error:', err);
      // Ignore unavailable-id to prevent crash loops
      if (err.type === 'unavailable-id') return;
      
      if (err.type === 'peer-unavailable' || err.type === 'network' || err.type === 'server-error') {
        if (callStateRef.current === 'outgoing') {
          if (window.showDynamicAlert) window.showDynamicAlert('Aradığınız kişiye şu anda ulaşılamıyor');
          hangUp();
        }
      }
    };

    peer.on('call', handleCall);
    peer.on('disconnected', handleDisconnected);
    peer.on('error', handleError);

    loadContacts();
    loadRecents();
    setupCallListener();

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      if (peerRef.current) {
        peerRef.current.off('call', handleCall);
        peerRef.current.off('disconnected', handleDisconnected);
        peerRef.current.off('error', handleError);
        // NOT calling peerRef.current.destroy() here to prevent ID conflicts
      }
      stopMediaTracks();
      playRingtone(null, true);
    };
  }, [myProfile]);

  const loadContacts = async () => {
    if (!myProfile) return;
    const { data } = await supabase.from('profiles').select('*').neq('id', myProfile.id).order('display_name');
    if (data) setContacts(data);
  };

  const loadRecents = async () => {
    if (!myProfile) return;
    const { data } = await supabase
      .from('calls')
      .select('*, caller:profiles!calls_caller_id_fkey(*), callee:profiles!calls_callee_id_fkey(*)')
      .or(`caller_id.eq.${myProfile.id},callee_id.eq.${myProfile.id}`)
      .order('started_at', { ascending: false })
      .limit(20);
    if (data) setRecents(data);
  };

  // ── Subscribe to incoming calls via Supabase ──────────────────────────
  const setupCallListener = () => {
    if (!myProfile) return;
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    subscriptionRef.current = supabase.channel(`calls-${myProfile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'calls',
        filter: `callee_id=eq.${myProfile.id}`
      }, async (payload) => {
        const call = payload.new;
        if (callStateRef.current !== 'idle') return; // Zaten aramadıysa

        const { data: callerProfile } = await supabase.from('profiles').select('*').eq('id', call.caller_id).single();
        
        const isMutedNow = !!localStorage.getItem('phoneIsMuted');
        const rt = localStorage.getItem('phoneRingtone') || 'marimba';
        if (!isMutedNow) playRingtone(rt);
        
        setCallState('incoming');
        setActiveCall({ callId: call.id, remote: callerProfile, direction: 'incoming' });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'calls',
        filter: `caller_id=eq.${myProfile.id}`
      }, (payload) => {
        const updated = payload.new;
        if (activeCallRef.current && activeCallRef.current.callId === updated.id) {
          if (updated.status === 'rejected' || updated.status === 'missed' || updated.status === 'ended') {
            endCallLocally();
          } else if (updated.status === 'active' && callStateRef.current === 'outgoing') {
            // Karşı taraf açtı
            if (dialToneInterval.current) { clearInterval(dialToneInterval.current); dialToneInterval.current = null; }
            setCallState('active');
            startDurationTimer();
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'calls',
        filter: `callee_id=eq.${myProfile.id}`
      }, (payload) => {
        const updated = payload.new;
        // Eğer aranan bizsek ve arama karşı tarafça kapatıldıysa
        if (activeCallRef.current && activeCallRef.current.callId === updated.id) {
          if (updated.status === 'ended' || updated.status === 'missed') {
            endCallLocally();
          }
        }
      })
      .subscribe();
  };

  // ── Make outgoing call ────────────────────────────────────────────────
  const handleKeypadCall = async () => {
    if (!dialInput) return;
    if (dialInput.length < 10) {
      if (window.showDynamicAlert) window.showDynamicAlert('Aradığınız numara kullanıma kapalı');
      return;
    }
    
    // Numarayı profillerde ara
    const { data } = await supabase.from('profiles').select('*').eq('phone_number', dialInput).single();
    if (data) {
      makeCall(data);
    } else {
      if (window.showDynamicAlert) window.showDynamicAlert('Aradığınız kişiye şu anda ulaşılamıyor');
    }
  };

  const makeCall = async (targetProfile) => {
    if (!myProfile || callState !== 'idle') return;
    playClick();
    
    // 1. Get local mic stream first
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, noiseSuppression: true, autoGainControl: true,
          deviceId: selectedInput !== 'default' ? { exact: selectedInput } : undefined
        }, 
        video: false 
      });
    } catch (e) {
      alert('Mikrofon erişimi reddedildi veya bulunamadı!');
      return;
    }

    // 2. Insert ringing record to Supabase
    // Veritabanı şemasında channel_name NOT NULL olduğu için sahte bir değer gönderiyoruz.
    const { data: callData, error } = await supabase.from('calls').insert([{
      caller_id: myProfile.id,
      callee_id: targetProfile.id,
      channel_name: 'peerjs_call',
      status: 'ringing',
    }]).select().single();

    if (error || !callData) { alert('Arama başlatılamadı: ' + error?.message); return; }

    setCallState('outgoing');
    setActiveCall({ callId: callData.id, remote: targetProfile, direction: 'outgoing' });
    setCallDuration(0);

    // Start Dial Tone
    playDialTone();
    dialToneInterval.current = setInterval(() => {
      if (callStateRef.current === 'outgoing') playDialTone();
    }, 4000);

    // 3. Initiate PeerJS Call
    const call = peerRef.current.call(targetProfile.id, localStreamRef.current);
    peerCallRef.current = call;

    call.on('stream', (remoteStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(e => console.error('Audio autoPlay blocked:', e));
      }
    });

    call.on('close', () => endCallLocally());

    // Auto-miss after 30s
    setTimeout(async () => {
      if (callStateRef.current === 'outgoing') {
        await supabase.from('calls').update({ status: 'missed', ended_at: new Date() }).eq('id', callData.id);
        endCallLocally();
      }
    }, 30000);
  };

  // ── Answer incoming call ──────────────────────────────────────────────
  const answerCall = async () => {
    playRingtone(null, true);
    if (!activeCall) return;
    
    // 1. Get local mic stream
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, noiseSuppression: true, autoGainControl: true,
          deviceId: selectedInput !== 'default' ? { exact: selectedInput } : undefined
        }, 
        video: false 
      });
    } catch (e) {
      alert('Mikrofon erişimi reddedildi!');
      return;
    }

    // 2. Answer the PeerJS call
    if (peerCallRef.current) {
      peerCallRef.current.answer(localStreamRef.current);
      peerCallRef.current.on('stream', (remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(e => console.error('Audio autoPlay blocked:', e));
        }
      });
      peerCallRef.current.on('close', () => endCallLocally());
    } else {
      pendingAnswerRef.current = true;
    }

    // 3. Update Supabase
    await supabase.from('calls').update({ status: 'active' }).eq('id', activeCall.callId);
    
    setCallState('active');
    startDurationTimer();
  };

  // ── Reject incoming call ──────────────────────────────────────────────
  const rejectCall = async () => {
    playRingtone(null, true);
    if (activeCall) await supabase.from('calls').update({ status: 'rejected', ended_at: new Date() }).eq('id', activeCall.callId);
    endCallLocally();
  };

  // ── End active call ───────────────────────────────────────────────────
  const hangUp = async () => {
    if (activeCallRef.current) await supabase.from('calls').update({ status: 'ended', ended_at: new Date() }).eq('id', activeCallRef.current.callId);
    endCallLocally();
    loadRecents();
  };

  const endCallLocally = () => {
    playRingtone(null, true);
    stopDurationTimer();
    stopMediaTracks();
    if (dialToneInterval.current) { clearInterval(dialToneInterval.current); dialToneInterval.current = null; }
    
    if (peerCallRef.current) {
      peerCallRef.current.close();
      peerCallRef.current = null;
    }
    
    setCallState('idle');
    setActiveCall(null);
    setCallDuration(0);
    setIsMicMuted(false);
    setShowDeviceMenu(false);
    setShowCallKeypad(false);
    setCallDtmfInput('');
  };

  const stopMediaTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  const toggleMic = () => {
    setIsMicMuted(m => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = m; // If m is true, it WAS muted, so we enable it.
        });
      }
      return !m;
    });
  };

  const fetchDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices({ 
        inputs: devs.filter(d => d.kind === 'audioinput'), 
        outputs: devs.filter(d => d.kind === 'audiooutput') 
      });
    } catch (e) { console.error('Device enum error', e); }
  };

  const handleSelectDevice = async (type, deviceId) => {
    if (type === 'input') {
      setSelectedInput(deviceId);
      localStorage.setItem('preferredAudioInput', deviceId);
      if (activeCall && localStreamRef.current) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
          const newTrack = newStream.getAudioTracks()[0];
          const sender = peerCallRef.current?.peerConnection?.getSenders().find(s => s.track?.kind === 'audio');
          if (sender) sender.replaceTrack(newTrack);
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = newStream;
        } catch (e) { console.error('Failed to switch mic', e); }
      }
    } else {
      setSelectedOutput(deviceId);
      localStorage.setItem('preferredAudioOutput', deviceId);
      if (remoteAudioRef.current && typeof remoteAudioRef.current.setSinkId === 'function') {
        remoteAudioRef.current.setSinkId(deviceId).catch(e => console.error('Failed to set sink', e));
      }
    }
  };

  const toggleDeviceMenu = () => {
    if (!showDeviceMenu) {
      fetchDevices();
      setShowCallKeypad(false);
    }
    setShowDeviceMenu(s => !s);
  };

  const toggleCallKeypad = () => {
    if (!showCallKeypad) setShowDeviceMenu(false);
    setShowCallKeypad(s => !s);
  };

  const handleDtmfInput = (digit) => {
    playClick();
    setCallDtmfInput(prev => prev + digit);
  };

  // ── Duration timer ────────────────────────────────────────────────────
  const startDurationTimer = () => {
    durationTimer.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  };
  const stopDurationTimer = () => {
    if (durationTimer.current) clearInterval(durationTimer.current);
  };
  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Search users ──────────────────────────────────────────────────────
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async (q) => {
    setIsSearching(true);
    const { data } = await supabase.from('profiles').select('*')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,phone_number.ilike.%${q}%`)
      .neq('id', myProfile?.id).limit(10);
    if (data) setSearchResults(data);
    setIsSearching(false);
  };

  const colors = { bg: '#1c1c1e', card: '#2c2c2e', text: 'white', sub: '#8e8e93', border: 'rgba(255,255,255,0.1)' };

  // ─────────────────────────────────────────────────────────────────────
  // CALL UI (fullscreen overlay)
  // ─────────────────────────────────────────────────────────────────────
  const CallScreen = () => {
    const isIncoming = callState === 'incoming';
    const isOutgoing = callState === 'outgoing';
    const isActive   = callState === 'active';

    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '80px 30px 60px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        {/* Avatar & Name */}
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
            style={{ width: '100px', height: '100px', borderRadius: '50%', background: activeCall?.remote?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', color: 'white', fontWeight: '700', margin: '0 auto 20px', boxShadow: `0 0 60px ${activeCall?.remote?.avatar_color || '#667eea'}60` }}>
            {(activeCall?.remote?.display_name || activeCall?.remote?.username || '?').charAt(0).toUpperCase()}
          </motion.div>
          <h2 style={{ color: 'white', fontSize: '30px', fontWeight: '700', margin: '0 0 8px' }}>
            {activeCall?.remote?.display_name || activeCall?.remote?.username}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', margin: 0 }}>
            {isIncoming ? <span style={{display:'flex', alignItems:'center', justifyContent:'center'}}><PhoneIncoming size={18} style={{marginRight:6}}/> Gelen Arama</span> : isOutgoing ? <span style={{display:'flex', alignItems:'center', justifyContent:'center'}}><PhoneOutgoing size={18} style={{marginRight:6}}/> Çağrılıyor...</span> : formatDuration(callDuration)}
          </p>
        </div>

        {/* Pulse rings for incoming/outgoing */}
        {!isActive && (
          <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)' }}>
            {[1, 2, 3].map(i => (
              <motion.div key={i} animate={{ scale: [1, 2.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', border: `2px solid ${activeCall?.remote?.avatar_color || '#667eea'}`, top: 0, left: 0 }} />
            ))}
          </div>
        )}

        {/* Active call controls */}
        {isActive && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%', position: 'relative' }}>
              {[
                { icon: isMicMuted ? <MicOff size={26} /> : <Mic size={26} />, label: isMicMuted ? 'Sesi Aç' : 'Sessiz', action: toggleMic, active: isMicMuted },
                { icon: <Volume2 size={26} />, label: 'Ses Cihazı', action: toggleDeviceMenu, active: showDeviceMenu },
                { icon: <Grid3x3 size={26} />, label: 'Tuş Takımı', action: toggleCallKeypad, active: showCallKeypad },
              ].map((btn, i) => (
                <div key={i} onClick={btn.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: btn.active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: btn.active ? 'black' : 'white' }}>{btn.icon}</div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{btn.label}</span>
                </div>
              ))}
            </div>

            {showDeviceMenu && (
              <>
                <div onClick={() => setShowDeviceMenu(false)} style={{ position: 'absolute', inset: -1000, zIndex: 999 }} />
                <motion.div 
                  initial={{ opacity: 0, x: "-50%" }}
                  animate={{ opacity: 1, x: "-50%" }}
                  exit={{ opacity: 0, x: "-50%" }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', bottom: '160px', left: '50%', background: 'rgba(30,30,30,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '24px', padding: '16px', width: '280px', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                >
                {/* Mikrofon (Giriş) */}
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 10px 8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Mikrofon</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {devices.inputs.map(d => {
                    const isSelected = selectedInput === d.deviceId;
                    return (
                      <div key={d.deviceId} onClick={(e) => { e.stopPropagation(); playClick(); handleSelectDevice('input', d.deviceId); }} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isSelected ? 'white' : 'rgba(255,255,255,0.8)', fontSize: '15px', padding: '12px 16px', cursor: 'pointer', background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '14px', fontWeight: isSelected ? '600' : '500', transition: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <Mic size={18} color={isSelected ? '#32D74B' : 'rgba(255,255,255,0.6)'} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label || 'Varsayılan Mikrofon'}</span>
                        </div>
                        {isSelected && <Check size={18} color="#32D74B" />}
                      </div>
                    );
                  })}
                  {devices.inputs.length === 0 && <div style={{color:'rgba(255,255,255,0.4)', fontSize:'13px', padding:'8px', textAlign: 'center'}}>Cihaz bulunamadı</div>}
                </div>
                
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', margin: '16px 0' }} />

                {/* Hoparlör (Çıkış) */}
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 10px 8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Hoparlör</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {devices.outputs.map(d => {
                    const isSelected = selectedOutput === d.deviceId;
                    const isHeadphones = d.label.toLowerCase().includes('head') || d.label.toLowerCase().includes('kulak');
                    return (
                      <div key={d.deviceId} onClick={(e) => { e.stopPropagation(); playClick(); handleSelectDevice('output', d.deviceId); }} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isSelected ? 'white' : 'rgba(255,255,255,0.8)', fontSize: '15px', padding: '12px 16px', cursor: 'pointer', background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '14px', fontWeight: isSelected ? '600' : '500', transition: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          {isHeadphones ? <Headphones size={18} color={isSelected ? '#0A84FF' : 'rgba(255,255,255,0.6)'} /> : <Volume2 size={18} color={isSelected ? '#0A84FF' : 'rgba(255,255,255,0.6)'} />}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label || 'Varsayılan Hoparlör'}</span>
                        </div>
                        {isSelected && <Check size={18} color="#0A84FF" />}
                      </div>
                    );
                  })}
                  {devices.outputs.length === 0 && <div style={{color:'rgba(255,255,255,0.4)', fontSize:'13px', padding:'8px', textAlign: 'center'}}>Cihaz bulunamadı</div>}
                </div>
              </motion.div>
              </>
            )}

            {showCallKeypad && (
              <>
                <div onClick={() => setShowCallKeypad(false)} style={{ position: 'absolute', inset: -1000, zIndex: 999 }} />
                <motion.div 
                  initial={{ opacity: 0, x: "-50%" }}
                  animate={{ opacity: 1, x: "-50%" }}
                  exit={{ opacity: 0, x: "-50%" }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', bottom: '160px', left: '50%', background: 'rgba(30,30,30,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px 20px', width: '280px', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ height: '30px', fontSize: '24px', color: 'white', letterSpacing: '2px', marginBottom: '20px', fontWeight: '300', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%' }}>
                    {callDtmfInput || ' '}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px 20px', width: '100%', placeItems: 'center' }}>
                    {['1','2','3','4','5','6','7','8','9','*','0','#'].map((btn, i) => (
                      <motion.div key={i} whileTap={{ scale: 0.9 }} onClick={() => handleDtmfInput(btn)}
                        style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white', fontWeight: '400', cursor: 'pointer' }}>
                        {btn}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </>
        )}

        {/* Bottom Actions */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '40px' }}>
          {isIncoming && (
            <motion.div whileTap={{ scale: 0.9 }} onClick={answerCall}
              style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(52,199,89,0.4)' }}>
              <Phone size={32} color="white" fill="white" />
            </motion.div>
          )}
          <motion.div whileTap={{ scale: 0.9 }} onClick={isIncoming ? rejectCall : hangUp}
            style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,59,48,0.4)' }}>
            <PhoneOff size={32} color="white" fill="white" />
          </motion.div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <audio ref={remoteAudioRef} autoPlay />

      <AnimatePresence>
        {callState !== 'idle' && <CallScreen key="call" />}
      </AnimatePresence>

      <AnimatePresence>
        {isActiveApp && (
          <motion.div
            key="phone-main"
            initial={{ scale:0.93, opacity:0, y:50, borderRadius:'40px' }}
            animate={{ scale:1, opacity:1, y:0, borderRadius:'0px' }}
            exit={{ scale:0.93, opacity:0, y:50, borderRadius:'40px' }}
            transition={{ type:'spring', stiffness:380, damping:32 }}
            style={{ position: 'absolute', inset: 0, zIndex: 100, background: colors.bg, display: 'flex', flexDirection: 'column', color: colors.text, overflow: 'hidden' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '50px 20px 20px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '20px' }}>Telefon</h1>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', background: colors.card, borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
          {[ { id: 'keypad', label: 'Tuş' }, { id: 'recents', label: 'Son' }, { id: 'contacts', label: 'Kişiler' } ].map(t => (
            <div key={t.id} onClick={() => { playClick(); setTab(t.id); }}
              style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: '13px', fontWeight: '600', borderRadius: '6px', background: tab === t.id ? '#636366' : 'transparent', color: tab === t.id ? 'white' : colors.sub, cursor: 'pointer', transition: '0.2s' }}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                {t.id === 'keypad' && <Grid3x3 size={16} style={{marginRight:6}} />}
                {t.id === 'recents' && <Clock size={16} style={{marginRight:6}} />}
                {t.id === 'contacts' && <Users size={16} style={{marginRight:6}} />}
                {t.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Keypad Tab ── */}
        {tab === 'keypad' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', letterSpacing: '2px', fontWeight: '300' }}>
              {dialInput || ' '}
            </div>
            {dialInput && (
              <div onClick={() => setDialInput(d => d.slice(0, -1))} style={{ color: colors.sub, cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}>Sil</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px 25px', width: '260px' }}>
              {['1','2','3','4','5','6','7','8','9','*','0','#'].map((btn, i) => (
                <motion.div key={i} whileTap={{ scale: 0.9 }} onClick={() => { playClick(); setDialInput(d => d + btn); }}
                  style={{ width: '70px', height: '70px', borderRadius: '50%', background: colors.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '400', cursor: 'pointer' }}>
                  {btn}
                </motion.div>
              ))}
            </div>
            <motion.div whileTap={{ scale: 0.9 }} onClick={handleKeypadCall}
              style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginTop: '25px', cursor: 'pointer' }}>
              <Phone size={28} color="white" fill="white" />
            </motion.div>
          </div>
        )}

        {/* ── Recents Tab ── */}
        {tab === 'recents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recents.map(r => {
              const isMeCaller = r.caller_id === myProfile?.id;
              const other = isMeCaller ? r.callee : r.caller;
              if (!other) return null;
              
              let icon = <Phone size={14} />;
              let statusColor = colors.sub;
              
              if (r.status === 'missed') {
                icon = isMeCaller ? <PhoneOutgoing size={14} /> : <PhoneMissed size={14} color="#FF3B30" />;
                statusColor = isMeCaller ? colors.sub : '#FF3B30';
              } else if (r.status === 'rejected') {
                icon = <PhoneOff size={14} color="#FF3B30" />;
                statusColor = '#FF3B30';
              } else if (r.status === 'ended') {
                icon = isMeCaller ? <PhoneOutgoing size={14} /> : <PhoneIncoming size={14} />;
              }

              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: other.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
                    {(other.display_name || other.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: r.status === 'missed' && !isMeCaller ? '#FF3B30' : colors.text }}>
                      {other.display_name || other.username}
                    </div>
                    <div style={{ fontSize: '12px', color: statusColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {icon} {r.status === 'ended' ? 'Tamamlandı' : r.status === 'missed' ? 'Cevapsız' : 'Reddedildi'} · {new Date(r.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <motion.div whileTap={{ scale: 0.9 }} onClick={() => makeCall(other)} style={{ color: '#34C759', cursor: 'pointer', padding: '10px' }}>
                    <Phone size={22} fill="#34C759" />
                  </motion.div>
                </div>
              );
            })}
            {recents.length === 0 && <div style={{ textAlign: 'center', color: colors.sub, marginTop: '40px' }}>Arama geçmişi boş.</div>}
          </div>
        )}

        {/* ── Contacts Tab ── */}
        {tab === 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Kişilerde Ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: 'none', background: colors.card, color: 'white', outline: 'none', marginBottom: '10px' }} />
            
            {isSearching && <div style={{ textAlign: 'center', color: colors.sub, fontSize: '13px' }}>Aranıyor...</div>}
            
            {(searchQuery ? searchResults : contacts).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
                  {(c.display_name || c.username || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{c.display_name || c.username}</div>
                  <div style={{ fontSize: '13px', color: colors.sub }}>{c.phone_number}</div>
                </div>
                <motion.div whileTap={{ scale: 0.9 }} onClick={() => makeCall(c)} style={{ background: '#34C759', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Phone size={16} fill="white" />
                </motion.div>
              </div>
            ))}
            {!searchQuery && contacts.length === 0 && <div style={{ textAlign: 'center', color: colors.sub, marginTop: '40px' }}>Kişi bulunamadı.</div>}
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
