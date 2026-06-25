import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Mail, Image as ImageIcon, FileText, Send } from 'lucide-react';

export default function ShareSheet({ data, onClose, onShareToApp }) {
  if (!data) return null;

  const isDark = localStorage.getItem('phoneDarkMode') === '1';
  const themeColors = {
    bg: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
    text: isDark ? 'white' : 'black',
    sub: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    card: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  };

  const targets = [
    { id: 'social', label: 'Sosyal', icon: <MessageCircle size={24} color="white" />, bg: '#0A84FF' },
    { id: 'mail', label: 'Mail', icon: <Mail size={24} color="white" />, bg: '#FF3B30' },
    { id: 'messages', label: 'Mesajlar', icon: <Send size={24} color="white" />, bg: '#34C759' },
    { id: 'files', label: 'Dosyalar', icon: <FileText size={24} color="white" />, bg: '#FF9500' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: themeColors.bg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', paddingBottom: '40px', color: themeColors.text, boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}
        >
          <div style={{ width: '40px', height: '5px', background: themeColors.sub, borderRadius: '10px', margin: '0 auto 20px', opacity: 0.5 }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Paylaş</h2>
            <div onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '15px', background: themeColors.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} color={themeColors.sub} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', padding: '12px', background: themeColors.card, borderRadius: '16px' }}>
            {data.type === 'image' && (
              <img src={data.data} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
            )}
            {data.type === 'text' && (
              <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} color={themeColors.sub} />
              </div>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {data.title || (data.type === 'image' ? 'Fotoğraf' : 'Belge')}
              </div>
              <div style={{ fontSize: '12px', color: themeColors.sub, marginTop: '4px' }}>
                {data.type === 'image' ? 'JPEG Görseli' : 'Metin Dosyası'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
            {targets.map(t => (
              <div key={t.id} onClick={() => { onShareToApp(t.id, data); onClose(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '64px' }}>
                <motion.div whileTap={{ scale: 0.9 }} style={{ width: '60px', height: '60px', borderRadius: '16px', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {t.icon}
                </motion.div>
                <span style={{ fontSize: '11px', fontWeight: '500', color: themeColors.text }}>{t.label}</span>
              </div>
            ))}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
