import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Search, PenSquare, Trash2, Check, ChevronLeft, Send, ShieldAlert, Mail as MailIcon, MailOpen, Reply, Info, X } from 'lucide-react';
import { playClick } from '../audio';
import { enqueueOfflineAction } from '../storage';

export default function MailApp({ myProfile }) {
  const [emails, setEmails] = useState([]);
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [toastMessage, setToastMessage] = useState(null);
  
  const subRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  useEffect(() => {
    if (!myProfile) return;

    const fetchEmails = async () => {
      const { data } = await supabase
        .from('emails')
        .select('*')
        .eq('receiver_username', myProfile.username)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (data) setEmails(data);
    };

    fetchEmails();

    subRef.current = supabase.channel(`emails-${myProfile.username}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'emails',
        filter: `receiver_username=eq.${myProfile.username}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playClick();
          setEmails(prev => [payload.new, ...prev].filter(e => !e.is_deleted));
        } else if (payload.eventType === 'UPDATE') {
          setEmails(prev => prev.map(e => e.id === payload.new.id ? payload.new : e).filter(e => !e.is_deleted));
        } else if (payload.eventType === 'DELETE') {
          setEmails(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      if (subRef.current) supabase.removeChannel(subRef.current);
    };
  }, [myProfile]);

  const handleMarkRead = async (id, isRead) => {
    playClick();
    if (isRead) return; // Zaten okunduysa işlem yapma
    // Optimistic UI update
    setEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
    await supabase.from('emails').update({ is_read: true }).eq('id', id);
  };

  const handleDelete = async (id) => {
    playClick();
    // Optimistic UI update
    setEmails(prev => prev.filter(e => e.id !== id));
    await supabase.from('emails').update({ is_deleted: true }).eq('id', id);
    showToast("E-posta silindi.");
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      showToast("Lütfen tüm alanları doldurun.");
      return;
    }

    const receiverUsername = composeData.to.split('@')[0].trim().toLowerCase();
    playClick();

    if (myProfile.username.toLowerCase() === 'alican' && (receiverUsername === 'herkes' || receiverUsername === 'all')) {
      // Tüm kullanıcılara gönder (Broadcast)
      showToast("Toplu mail hazırlanıyor...");
      const { data: allProfiles, error: profileErr } = await supabase.from('profiles').select('username');
      
      if (profileErr) {
        showToast("Kullanıcılar alınırken hata oluştu.");
        return;
      }

      const emailsToInsert = allProfiles
        .filter(p => p.username.toLowerCase() !== 'alican') // Kendine atma
        .map(p => ({
          sender_username: myProfile.username,
          receiver_username: p.username,
          subject: composeData.subject,
          body: composeData.body,
        }));

      const { error: insertErr } = await supabase.from('emails').insert(emailsToInsert);
      
      if (insertErr) {
        showToast("Hata: " + insertErr.message);
        console.error("Toplu mail hatası:", insertErr);
      } else {
        showToast(`Başarılı! ${emailsToInsert.length} kişiye gönderildi.`);
        setIsComposing(false);
        setComposeData({ to: '', subject: '', body: '' });
      }
      return;
    }

    // Tekil Gönderim
    const mailPayload = {
      sender_username: myProfile.username,
      receiver_username: receiverUsername,
      subject: composeData.subject,
      body: composeData.body,
    };

    if (!navigator.onLine) {
      await enqueueOfflineAction({ type: 'MAIL_SEND', payload: mailPayload });
      showToast('İnternet bağlantınız yok. Mail kuyruğa eklendi.');
      setIsComposing(false);
      setComposeData({ to: '', subject: '', body: '' });
      return;
    }

    const { error } = await supabase.from('emails').insert([mailPayload]);

    if (error) {
      showToast("Hata: " + error.message);
      console.error("Tekil mail hatası:", error);
    } else {
      showToast("E-posta başarıyla gönderildi!");
      setIsComposing(false);
      setComposeData({ to: '', subject: '', body: '' });
    }
  };

  const toggleExpand = (email) => {
    playClick();
    if (expandedEmailId === email.id) {
      setExpandedEmailId(null);
    } else {
      setExpandedEmailId(email.id);
      if (!email.is_read) handleMarkRead(email.id, false);
    }
  };

  // Zamanı formatla (örn: "14:30" veya "Dün")
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)', display: 'flex', flexDirection: 'column', color: '#111', position: 'relative', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '55px 20px 20px 20px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #0A84FF, #5AC8FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>E-Posta</h1>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginTop: '2px', letterSpacing: '-0.3px' }}>
            {myProfile?.username}@tuzluca.pe
          </div>
        </div>
        <motion.div 
          whileTap={{ scale: 0.9 }} 
          onClick={() => { playClick(); setIsComposing(true); }}
          style={{ background: 'linear-gradient(135deg, #0A84FF, #0055B3)', color: 'white', padding: '14px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 8px 16px rgba(10,132,255,0.3)' }}
        >
          <PenSquare size={24} />
        </motion.div>
      </div>

      {/* Arama Çubuğu */}
      <div style={{ padding: '15px 20px', background: 'transparent', zIndex: 9 }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <Search size={20} color="#8e8e93" />
          <input 
            type="text" 
            placeholder="Gelen kutusunda ara..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px', color: '#333' }}
          />
        </div>
      </div>

      {/* Mail Listesi */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 80px 20px' }}>
        <AnimatePresence>
          {emails.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: '#8e8e93', marginTop: '50px' }}>
              <MailIcon size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
              <p style={{ marginTop: '15px', fontSize: '16px', fontWeight: '500' }}>Gelen kutunuz boş.</p>
            </motion.div>
          )}

          {emails.map(email => {
            const isAdmin = email.sender_username.toLowerCase() === 'alican';
            const isExpanded = expandedEmailId === email.id;
            
            // Avatar için baş harf
            const initial = email.sender_username.charAt(0).toUpperCase();
            const avatarColor = isAdmin ? 'linear-gradient(135deg, #FF3B30, #FF2D55)' : 'linear-gradient(135deg, #0A84FF, #5AC8FA)';

            return (
              <motion.div 
                key={email.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                style={{ position: 'relative', marginBottom: '10px', borderRadius: '16px', overflow: 'hidden', background: '#f8f9fa' }}
              >
                {/* Alt Katman (Swipe Efektleri) */}
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', background: '#34C759', display: 'flex', alignItems: 'center', paddingLeft: '25px', color: 'white' }}>
                  <Check size={24} strokeWidth={3} />
                </div>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '25px', color: 'white' }}>
                  <Trash2 size={24} strokeWidth={2.5} />
                </div>

                {/* Üst Katman (Premium Mail Kartı) */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 100) {
                      handleMarkRead(email.id, email.is_read);
                    } else if (info.offset.x < -100) {
                      handleDelete(email.id);
                    }
                  }}
                  onClick={() => toggleExpand(email)}
                  style={{ 
                    background: email.is_read ? '#ffffff' : '#ffffff', 
                    padding: '16px 18px', 
                    borderRadius: '16px', 
                    position: 'relative', 
                    zIndex: 2,
                    boxShadow: email.is_read ? '0 1px 4px rgba(0,0,0,0.02)' : '0 4px 16px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '14px',
                    border: email.is_read ? '1px solid rgba(0,0,0,0.03)' : '1px solid rgba(10,132,255,0.1)'
                  }}
                >
                  {/* Okunmadı Noktası */}
                  {!email.is_read && (
                    <div style={{ position: 'absolute', top: '24px', left: '6px', width: '8px', height: '8px', background: '#0A84FF', borderRadius: '50%' }} />
                  )}

                  {/* Avatar */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: avatarColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {initial}
                  </div>

                  {/* İçerik */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ fontWeight: email.is_read ? '500' : '700', fontSize: '16px', color: email.is_read ? '#555' : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {email.sender_username}
                        </span>
                        {isAdmin && (
                          <div style={{ background: '#FFE5E5', color: '#FF3B30', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldAlert size={10} strokeWidth={3} /> SAHİP
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: email.is_read ? '#A1A1A6' : '#0A84FF', fontWeight: email.is_read ? '500' : '600', flexShrink: 0, marginLeft: '10px' }}>
                        {formatTime(email.created_at)}
                      </span>
                    </div>

                    <div style={{ fontWeight: email.is_read ? '400' : '600', fontSize: '15px', color: email.is_read ? '#666' : '#222', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', marginTop: '10px' }}
                        >
                          <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: '1.5', whiteSpace: 'pre-wrap', background: '#F9FAFB', padding: '12px', borderRadius: '12px', border: '1px solid #F1F2F4' }}>
                            {email.body}
                          </p>
                        </motion.div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#8E8E93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
                          {email.body}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Yeni E-Posta Modal */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#f8f9fa', zIndex: 50, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '55px 15px 15px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)', zIndex: 2 }}>
              <div onClick={() => setIsComposing(false)} style={{ color: '#0A84FF', fontWeight: '500', fontSize: '16px', cursor: 'pointer' }}>
                Vazgeç
              </div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: '#111' }}>Yeni İleti</div>
              <motion.div whileTap={{ scale: 0.9 }} onClick={handleSendEmail} style={{ background: '#0A84FF', color: 'white', padding: '8px 18px', borderRadius: '20px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(10,132,255,0.3)' }}>
                Gönder <Send size={16} />
              </motion.div>
            </div>

            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '0 15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eaeaea' }}>
                <span style={{ color: '#8e8e93', width: '50px', fontWeight: '500' }}>Kime:</span>
                <input 
                  type="text" 
                  value={composeData.to}
                  onChange={e => setComposeData({...composeData, to: e.target.value})}
                  placeholder={myProfile?.username?.toLowerCase() === 'alican' ? "kullanici@ veya 'herkes'" : "kullanici@tuzluca.pe"} 
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eaeaea' }}>
                <span style={{ color: '#8e8e93', width: '50px', fontWeight: '500' }}>Konu:</span>
                <input 
                  type="text" 
                  value={composeData.subject}
                  onChange={e => setComposeData({...composeData, subject: e.target.value})}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                />
              </div>
            </div>
            <textarea 
              placeholder="E-postanızı buraya yazın..."
              value={composeData.body}
              onChange={e => setComposeData({...composeData, body: e.target.value})}
              style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,0,0,0.04)', outline: 'none', fontSize: '16px', marginTop: '15px', resize: 'none', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', color: '#333' }}
            />
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            style={{ position: 'absolute', bottom: '30px', left: '50%', background: '#333', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
