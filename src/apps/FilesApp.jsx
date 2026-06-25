import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File, FileText, Image as ImageIcon, Folder, Share } from 'lucide-react';
import { idbStorage } from '../storage';
import { playClick } from '../audio';

export default function FilesApp({ onShare }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isDark = localStorage.getItem('phoneDarkMode') === '1';
  const colors = {
    bg: isDark ? '#000000' : '#F2F2F7',
    text: isDark ? 'white' : 'black',
    sub: isDark ? '#EBEBF599' : '#3C3C4399',
    card: isDark ? '#1C1C1E' : 'white',
    blue: '#0A84FF'
  };

  useEffect(() => {
    async function loadFiles() {
      const photos = await idbStorage.getItem('cameraPhotos') || [];
      const notes = await idbStorage.getItem('notesData') || [];
      
      const combined = [
        ...photos.map((p, i) => ({ id: `photo_${i}`, type: 'image', data: p, title: `Fotoğraf ${i+1}`, date: Date.now() - i*10000 })),
        ...notes.map(n => ({ id: n.id, type: 'text', data: n.content, title: n.content.substring(0, 20) || 'Yeni Not', date: n.date }))
      ].sort((a, b) => b.date - a.date);
      
      setFiles(combined);
      setLoading(false);
    }
    loadFiles();
  }, []);

  return (
    <motion.div
      initial={{ scale:0.93, opacity:0, y:50, borderRadius:'40px' }}
      animate={{ scale:1, opacity:1, y:0, borderRadius:'0px' }}
      exit={{ scale:0.93, opacity:0, y:50, borderRadius:'40px' }}
      transition={{ type:'spring', stiffness:380, damping:32 }}
      style={{ position: 'absolute', inset: 0, zIndex: 100, background: colors.bg, display: 'flex', flexDirection: 'column', color: colors.text, overflow: 'hidden' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '50px 20px 20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '20px' }}>Dosyalar</h1>
        
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: colors.sub }}>Yükleniyor...</div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: colors.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Folder size={48} opacity={0.5} />
            <p>Hiç dosya bulunamadı.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {files.map(f => (
              <div key={f.id} style={{ background: colors.card, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.type === 'image' ? '#000' : 'rgba(0,0,0,0.02)' }}>
                  {f.type === 'image' ? (
                    <img src={f.data} alt="img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FileText size={40} color={colors.sub} />
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{f.title}</div>
                  <div style={{ fontSize: '11px', color: colors.sub, marginTop: '4px' }}>{new Date(f.date).toLocaleDateString()}</div>
                </div>
                <div 
                  onClick={() => { playClick(); onShare(f); }}
                  style={{ position: 'absolute', bottom: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '15px', background: 'rgba(10,132,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Share size={14} color={colors.blue} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
