import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { ChevronLeft, ArrowUp, PenBox, Search, MessageCircle } from 'lucide-react';
import { playClick } from '../audio';

export default function MessagesApp({ myProfile }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // profile object
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [newConvSearch, setNewConvSearch] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const bottomRef = useRef(null);
  const msgSubRef = useRef(null);
  const convSubRef = useRef(null);

  useEffect(() => {
    if (!myProfile) return;
    loadConversations();
    loadAllProfiles();
    setupConvListener();
    return () => {
      if (msgSubRef.current) supabase.removeChannel(msgSubRef.current);
      if (convSubRef.current) supabase.removeChannel(convSubRef.current);
    };
  }, [myProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAllProfiles = async () => {
    if (!myProfile) return;
    const { data } = await supabase.from('profiles').select('*').neq('id', myProfile.id);
    if (data) setAllProfiles(data);
  };

  const loadConversations = async () => {
    if (!myProfile) return;
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
      .or(`sender_id.eq.${myProfile.id},receiver_id.eq.${myProfile.id}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    // Build unique conversations map
    const convMap = {};
    data.forEach(msg => {
      const other = msg.sender_id === myProfile.id ? msg.receiver : msg.sender;
      if (!other) return;
      if (!convMap[other.id]) {
        convMap[other.id] = { profile: other, lastMsg: msg, unread: 0 };
      }
      if (msg.receiver_id === myProfile.id && !msg.is_read) {
        convMap[other.id].unread++;
      }
    });
    setConversations(Object.values(convMap));
  };

  const setupConvListener = () => {
    if (!myProfile) return;
    convSubRef.current = supabase.channel(`conv-listener-${myProfile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${myProfile.id}`
      }, () => { loadConversations(); if (activeConv) loadMessages(activeConv); })
      .subscribe();
  };

  const openConversation = async (profile) => {
    playClick();
    setActiveConv(profile);
    setShowNewConv(false);
    await loadMessages(profile);
    // Mark as read
    await supabase.from('messages').update({ is_read: true })
      .eq('receiver_id', myProfile.id)
      .eq('sender_id', profile.id);
    // Subscribe to new messages in this conversation
    msgSubRef.current?.unsubscribe();
    msgSubRef.current = supabase.channel(`msgs-${myProfile.id}-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === myProfile.id && msg.receiver_id === profile.id) ||
            (msg.sender_id === profile.id && msg.receiver_id === myProfile.id)) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Eğer şu an sohbetin içindeyken bize bir mesaj gelirse, onu da anında okundu yap.
          if (msg.receiver_id === myProfile.id && !msg.is_read) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
          }
        }
      })
      .subscribe();
  };

  const loadMessages = async (profile) => {
    if (!myProfile || !profile) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myProfile.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${myProfile.id})`)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConv || !myProfile) return;
    
    const text = inputText.trim();
    setInputText(''); // Inputu anında boşalt

    // ── İyimser (Optimistic) Güncelleme ──
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender_id: myProfile.id,
      receiver_id: activeConv.id,
      content: text,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    
    // En alta kaydır
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 10);

    // Arka planda sunucuya gönder
    const { data, error } = await supabase.from('messages').insert([{
      sender_id: myProfile.id,
      receiver_id: activeConv.id,
      content: text,
    }]).select().single();

    if (error) {
      // Hata olursa iyimser mesajı geri al ve inputa yazıyı geri koy
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
      // alert('Gönderilemedi: ' + error.message);
    } else {
      // Başarılı olursa geçici ID'yi gerçek UUID ile değiştir
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      loadConversations();
    }
  };

  const colors = {
    bg: '#000', convBg: '#1c1c1e', headerBg: '#1c1c1e',
    text: 'white', sub: '#8e8e93', border: 'rgba(255,255,255,0.1)',
    myBubble: '#0B84FF', theirBubble: '#2C2C2E',
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  // ── Chat view ─────────────────────────────────────────────────────────
  if (activeConv) return (
    <div style={{ width: '100%', height: '100%', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '55px 16px 12px', backgroundColor: colors.headerBg, display: 'flex', alignItems: 'flex-end', gap: '12px', borderBottom: `0.5px solid ${colors.border}` }}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => { playClick(); setActiveConv(null); msgSubRef.current?.unsubscribe(); loadConversations(); }}
          style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 0', flexShrink: 0 }}>
          <ChevronLeft size={20} /> Geri
        </motion.button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingBottom: '4px', gap: '6px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: activeConv.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white', fontWeight: '700' }}>
            {(activeConv.display_name || activeConv.username).charAt(0).toUpperCase()}
          </div>
          <span style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>{activeConv.display_name}</span>
        </div>
        <div style={{ width: '60px' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.sub, padding: '40px 0', fontSize: '15px' }}>
            Henüz mesaj yok. İlk mesajı siz gönderin!
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === myProfile?.id;
          const showTime = i === 0 || (new Date(msg.created_at) - new Date(messages[i-1]?.created_at)) > 300000;
          return (
            <React.Fragment key={msg.id}>
              {showTime && (
                <div style={{ textAlign: 'center', color: colors.sub, fontSize: '12px', margin: '10px 0 2px' }}>{formatTime(msg.created_at)}</div>
              )}
              <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <motion.div 
                  whileTap={{ scale: 0.95, opacity: 0.8 }}
                  onPointerDown={() => {
                    window.msgPressTimer = setTimeout(() => {
                      const textToCopy = msg.content || '';
                      if (window.electronAPI?.copyToClipboard) {
                        window.electronAPI.copyToClipboard(textToCopy);
                        if (window.showDynamicAlert) window.showDynamicAlert('Metin Kopyalandı');
                        playClick();
                      } else {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                          if (window.showDynamicAlert) window.showDynamicAlert('Metin Kopyalandı');
                          playClick();
                        }).catch(err => {
                          const ta = document.createElement('textarea');
                          ta.value = textToCopy;
                          document.body.appendChild(ta);
                          ta.select();
                          try {
                            document.execCommand('copy');
                            if (window.showDynamicAlert) window.showDynamicAlert('Metin Kopyalandı');
                            playClick();
                          } catch (e) {}
                          document.body.removeChild(ta);
                        });
                      }
                    }, 500);
                  }}
                  onPointerUp={() => clearTimeout(window.msgPressTimer)}
                  onPointerLeave={() => clearTimeout(window.msgPressTimer)}
                  style={{ cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', maxWidth: '75%', padding: '10px 14px', borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: isMine ? colors.myBubble : colors.theirBubble, color: 'white', fontSize: '16px', lineHeight: '1.4', wordBreak: 'break-word' }}
                >
                  {msg.content}
                </motion.div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px 30px', backgroundColor: colors.headerBg, borderTop: `0.5px solid ${colors.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="iMessage"
          style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '22px', color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }}
        />
        <motion.button whileTap={{ scale: 0.85 }} onClick={sendMessage} disabled={!inputText.trim() || sending}
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: inputText.trim() ? '#007AFF' : 'rgba(255,255,255,0.15)', border: 'none', cursor: inputText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowUp size={20} color="white" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );

  // ── Conversations list ────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      <div style={{ padding: '55px 20px 12px', backgroundColor: colors.headerBg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: '700', color: colors.text, margin: 0 }}>Mesajlar</h1>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => { playClick(); setShowNewConv(s => !s); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
            <PenBox size={18} />
          </motion.button>
        </div>

        {/* New conversation search */}
        <AnimatePresence>
          {showNewConv && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '10px 14px', marginBottom: '8px' }}>
                <span style={{ color: colors.sub, display: 'flex', alignItems:'center' }}><Search size={18} /></span>
                <input value={newConvSearch} onChange={e => setNewConvSearch(e.target.value)} placeholder="İsim veya kullanıcı adı ara"
                  style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              {allProfiles.filter(p => p.display_name?.toLowerCase().includes(newConvSearch.toLowerCase()) || p.username?.toLowerCase().includes(newConvSearch.toLowerCase())).slice(0, 5).map(p => (
                <motion.div key={p.id} whileTap={{ scale: 0.97 }} onClick={() => openConversation(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: p.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', fontWeight: '700' }}>
                    {(p.display_name || p.username).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: 'white', fontSize: '16px' }}>{p.display_name} <span style={{ color: colors.sub }}>@{p.username}</span></span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.sub, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ marginBottom: '16px' }}><MessageCircle size={64} strokeWidth={1} /></div>
            <p style={{ fontSize: '17px' }}>Henüz mesaj yok</p>
            <p style={{ fontSize: '14px', display:'flex', alignItems:'center', gap:'4px' }}><PenBox size={14}/> ikonuna tıklayarak yeni sohbet başlatın</p>
          </div>
        ) : conversations.map(({ profile: p, lastMsg, unread }) => (
          <motion.div key={p.id} whileTap={{ backgroundColor: 'rgba(255,255,255,0.05)' }} onClick={() => openConversation(p)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: `0.5px solid ${colors.border}`, cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: p.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white', fontWeight: '700' }}>
                {(p.display_name || p.username).charAt(0).toUpperCase()}
              </div>
              {unread > 0 && <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: '700' }}>{unread}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ color: colors.text, fontSize: '17px', fontWeight: unread > 0 ? '600' : '500' }}>{p.display_name}</span>
                <span style={{ color: colors.sub, fontSize: '13px' }}>{formatTime(lastMsg.created_at)}</span>
              </div>
              <p style={{ fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread > 0 ? '600' : '400', color: unread > 0 ? 'rgba(255,255,255,0.7)' : colors.sub }}>
                {lastMsg.sender_id === myProfile?.id ? 'Sen: ' : ''}{lastMsg.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
