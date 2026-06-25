import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Bell, Heart, MessageCircle, UserPlus, PhoneMissed, X, Loader2 } from 'lucide-react';
import { playClick } from '../audio';

export default function NotificationCenter({ isOpen, onClose, myProfile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // 1. Unread messages
      const { data: messages } = await supabase.from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('receiver_id', myProfile.id).eq('is_read', false);
        
      // 2. Missed calls
      const { data: calls } = await supabase.from('calls')
        .select('*, caller:profiles!calls_caller_id_fkey(*)')
        .eq('callee_id', myProfile.id).eq('status', 'missed');
        
      // 3. Social notifications
      const { data: notifs } = await supabase.from('notifications')
        .select('*, sender:profiles!notifications_sender_id_fkey(*)')
        .eq('recipient_id', myProfile.id)
        .order('created_at', { ascending: false }).limit(30);

      const merged = [];
      if (messages) {
        messages.forEach(m => merged.push({
          id: 'msg_'+m.id, db_id: m.id, type: 'message', date: new Date(m.created_at),
          sender: m.sender, content: m.text, is_read: m.is_read
        }));
      }
      if (calls) {
        calls.forEach(c => merged.push({
          id: 'call_'+c.id, db_id: c.id, type: 'missed_call', date: new Date(c.created_at),
          sender: c.caller, content: 'Cevapsız Çağrı', is_read: false
        }));
      }
      if (notifs) {
        notifs.forEach(n => merged.push({
          id: 'notif_'+n.id, db_id: n.id, type: n.type, date: new Date(n.created_at),
          sender: n.sender, payload: n.payload, is_read: n.is_read
        }));
      }
      
      merged.sort((a,b) => b.date - a.date);
      setItems(merged);
      setLoading(false);
    };

    if (isOpen && myProfile) loadData();
  }, [isOpen, myProfile]);

  const getText = (item) => {
    switch(item.type) {
      case 'like': return 'fotoğrafını beğendi.';
      case 'comment': return `yorum yaptı: "${item.payload?.text || ''}"`;
      case 'follow': return 'seni takip etmeye başladı.';
      case 'message': return item.content;
      case 'missed_call': return 'Sizi aradı.';
      default: return 'yeni bir bildirim var.';
    }
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.y < -50 || info.velocity.y < -300) {
      onClose();
    }
  };

  const dismissItem = async (item) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    if (item.type === 'message') {
      await supabase.from('messages').update({ is_read: true }).eq('id', item.db_id);
    } else if (item.type !== 'missed_call') {
      await supabase.from('notifications').update({ is_read: true }).eq('id', item.db_id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ 
            position: 'absolute', inset: 0, zIndex: 9995, 
            background: 'rgba(0,0,0,0.4)', 
            backdropFilter: 'blur(35px) saturate(180%)', 
            WebkitBackdropFilter: 'blur(35px) saturate(180%)',
            display: 'flex', flexDirection: 'column',
            color: 'white', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'
          }}
        >
          {/* Header (iOS Lockscreen style Clock) */}
          <div onPointerDown={(e) => dragControls.start(e)} style={{ touchAction: 'none', paddingTop: 60, paddingBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ fontSize: 82, fontWeight: 200, lineHeight: 1, letterSpacing: '-4px', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
              {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, marginTop: 5, opacity: 0.85 }}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            
            <div style={{ position: 'absolute', top: 62, right: 20 }}>
              <button onClick={() => { playClick(); onClose(); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                <X size={16} color="white" />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" color="white" /></div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>Eski bildirim yok</div>
            ) : (
              items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => { if (info.offset.x > 80 || info.offset.x < -80 || info.velocity.x > 300) dismissItem(item); }}
                  style={{ 
                    background: 'rgba(255,255,255,0.25)', 
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 24, padding: 16, 
                    display: 'flex', gap: 14, alignItems: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.4)',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: item.sender?.avatar_color || 'linear-gradient(135deg, #8E8E93, #4a4a4a)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                    {item.sender?.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>{item.sender?.display_name || 'Bilinmeyen'}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                        {item.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3 }}>
                      {getText(item)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Bottom Pull Bar Removed - Managed by App.jsx Home Indicator */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
