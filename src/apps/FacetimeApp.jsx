import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, PhoneOff, Mic, MicOff, VideoOff, Users, Phone } from 'lucide-react';

export default function FacetimeApp({ 
  onlineUsers, 
  myId, 
  onCallUser, 
  activeCall, 
  localStream, 
  remoteStream, 
  onEndCall 
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks.forEach(track => track.enabled = newState);
        setIsMicMuted(!newState);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks.forEach(track => track.enabled = newState);
        setIsVideoMuted(!newState);
      }
    }
  };

  const handleCall = (peerId) => {
    onCallUser(peerId);
  };

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000' : '#f2f2f7';
  const text = isDark ? '#fff' : '#000';

  // If there is an active call, show the video UI
  if (activeCall) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Remote Video (Full Screen) */}
        {remoteStream ? (
          <video 
            autoPlay 
            playsInline 
            ref={node => {
              if (node && remoteStream && node.srcObject !== remoteStream) {
                node.srcObject = remoteStream;
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 'bold' }}>Bağlanıyor...</span>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Local Video (Floating Top Right) */}
        <motion.div 
          drag
          dragConstraints={{ left: 10, right: 300, top: 40, bottom: 600 }}
          style={{ position: 'absolute', top: 50, right: 15, width: 100, height: 150, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10, cursor: 'grab' }}
        >
          {localStream ? (
            <video 
              autoPlay 
              playsInline 
              muted 
              ref={node => {
                if (node && localStream && node.srcObject !== localStream) {
                  node.srcObject = localStream;
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#333' }} />
          )}
        </motion.div>

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20, zIndex: 10 }}>
          <button 
            onClick={toggleMic}
            style={{ width: 60, height: 60, borderRadius: '50%', border: 'none', background: isMicMuted ? '#fff' : 'rgba(255,255,255,0.2)', color: isMicMuted ? '#000' : '#fff', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {isMicMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          
          <button 
            onClick={onEndCall}
            style={{ width: 60, height: 60, borderRadius: '50%', border: 'none', background: '#FF3B30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,59,48,0.4)' }}
          >
            <PhoneOff size={28} />
          </button>

          <button 
            onClick={toggleVideo}
            style={{ width: 60, height: 60, borderRadius: '50%', border: 'none', background: isVideoMuted ? '#fff' : 'rgba(255,255,255,0.2)', color: isVideoMuted ? '#000' : '#fff', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {isVideoMuted ? <VideoOff size={28} /> : <Video size={28} />}
          </button>
        </div>

        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Directory UI
  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', color: text, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' }}>
      
      <div style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10, borderBottom: `1px solid ${isDark ? '#333' : '#e5e5ea'}`, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 20 }}>
        <Video size={32} color="#32D74B" />
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>FaceTime</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 8, color: isDark ? '#8e8e93' : '#8e8e93' }}>
          <Users size={18} /> Çevrimiçi Kişiler ({onlineUsers.filter(u => u.id !== myId).length})
        </h2>

        {onlineUsers.filter(u => u.id !== myId).length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8e8e93', marginTop: 40, fontSize: 16 }}>
            Şu an sistemde başka kimse görünmüyor.<br/><br/>
            (FaceTime araması alabilmek için kişilerin bu uygulamayı kapatmamış olması gerekmez, sitede olmaları yeterlidir.)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {onlineUsers.filter(u => u.id !== myId).map(user => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#1c1c1e' : '#fff', padding: '15px 20px', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #32D74B, #28A745)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                    {user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{user.nickname || 'Gizli Kullanıcı'}</span>
                </div>
                
                <button 
                  onClick={() => handleCall(user.peerId)}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#32D74B', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(50,215,75,0.3)' }}
                >
                  <Video size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
