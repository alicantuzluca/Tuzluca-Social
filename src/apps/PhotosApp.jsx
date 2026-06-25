import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, ChevronLeft, ChevronRight, Image as ImageIcon, Library, Search, Trash2, Camera } from 'lucide-react';
import { idbStorage } from '../storage';
import { playClick } from '../audio';

export default function PhotosApp({ onShare }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('library');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const loadPhotos = async () => {
      let loadedPhotos = [];
      if (window.electronAPI?.readPhotos) {
        loadedPhotos = await window.electronAPI.readPhotos();
      }
      if (loadedPhotos.length === 0) {
        const local = await idbStorage.getItem('cameraPhotos') || [];
        loadedPhotos = local.map(url => ({ path: null, url, isLocal: true }));
      }
      setPhotos(loadedPhotos);
    };
    loadPhotos();
  }, []);

  const handleDelete = async () => {
    if (selected === null) return;
    const photo = photos[selected];
    if (window.confirm("Bu fotoğrafı sonsuza dek silmek istediğinize emin misiniz?")) {
      playClick();
      if (photo.path && window.electronAPI?.deletePhoto) {
        await window.electronAPI.deletePhoto(photo.path);
      } else if (photo.isLocal) {
        const local = await idbStorage.getItem('cameraPhotos') || [];
        const newLocal = local.filter(u => u !== photo.url);
        await idbStorage.setItem('cameraPhotos', newLocal);
      }
      setPhotos(prev => prev.filter((_, i) => i !== selected));
      setSelected(null);
    }
  };

  const sharePhoto = () => {
    playClick();
    if (onShare) {
      onShare({ type: 'image', data: photos[selected]?.url || photos[selected], title: `Fotoğraf ${selected + 1}` });
    }
  };

  const bg = 'linear-gradient(to bottom, #111113, #000000)';

  return (
    <div style={{
      width: '100%', height: '100%', background: bg, color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
    }}>
      
      {/* Lightbox / Full-screen Photo Viewer */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 100,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Top Bar Floating */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '50px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)', zIndex: 10 }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { playClick(); setSelected(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <X size={24} />
              </motion.button>
              
              <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {selected + 1} / {photos.length}
              </span>

              <motion.button whileTap={{ scale: 0.9 }} onClick={handleDelete} style={{ background: 'rgba(255,59,48,0.2)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <Trash2 size={20} />
              </motion.button>
            </div>

            {/* The Photo itself */}
            <AnimatePresence mode="wait">
              <motion.img
                key={selected}
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                src={photos[selected].url || photos[selected]}
                alt="viewer"
                style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 5 }}
              />
            </AnimatePresence>

            {/* Bottom Controls Floating */}
            <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'center', zIndex: 10 }}>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => { playClick(); setSelected(i => Math.max(0, i - 1)); }} 
                disabled={selected === 0}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: selected === 0 ? 'default' : 'pointer', opacity: selected === 0 ? 0.3 : 1, width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
              >
                <ChevronLeft size={32} strokeWidth={2.5} style={{ marginRight: 2 }} />
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={sharePhoto}
                style={{ background: 'linear-gradient(135deg, #0A84FF, #005bb5)', color: 'white', border: 'none', borderRadius: '30px', padding: '16px 36px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 25px rgba(10,132,255,0.4)' }}
              >
                <Share size={22} /> Paylaş
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => { playClick(); setSelected(i => Math.min(photos.length - 1, i + 1)); }} 
                disabled={selected === photos.length - 1}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: selected === photos.length - 1 ? 'default' : 'pointer', opacity: selected === photos.length - 1 ? 0.3 : 1, width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
              >
                <ChevronRight size={32} strokeWidth={2.5} style={{ marginLeft: 2 }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
        
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '55px 20px 15px', background: 'rgba(17,17,19,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0, background: 'linear-gradient(90deg, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Galeri
            </h1>
            <div style={{ fontSize: '14px', color: '#8e8e93', marginTop: '4px', fontWeight: '500' }}>
              {photos.length} Fotoğraf
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#0A84FF', fontSize: '15px', fontWeight: '600', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
            Seç
          </button>
        </div>

        {/* Empty State */}
        {photos.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', opacity: 0.5 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '50%', marginBottom: '20px' }}>
              <Camera size={48} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Henüz Fotoğraf Yok</h2>
            <p style={{ marginTop: '10px', fontSize: '15px', textAlign: 'center', maxWidth: '70%' }}>
              Kamera uygulamasını kullanarak anılarınızı biriktirmeye başlayın.
            </p>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div style={{ padding: '15px 0' }}>
            <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>Son Çekilenler</span>
              <span style={{ color: '#0A84FF', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Tümü</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
              {photos.map((src, i) => (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.93, borderRadius: '15px' }}
                  onClick={() => { playClick(); setSelected(i); }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', background: '#222' }}
                >
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    src={src.url || src}
                    alt={`photo-${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar (Glassmorphic Bottom Navigation) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '90px',
        background: 'rgba(20,20,22,0.85)',
        backdropFilter: 'blur(25px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: '15px'
      }}>
        {[
          { id: 'library', icon: <ImageIcon size={26} strokeWidth={tab==='library'?2.5:2} />, label: 'Arşiv' },
          { id: 'albums', icon: <Library size={26} strokeWidth={tab==='albums'?2.5:2} />, label: 'Albümler' },
          { id: 'search', icon: <Search size={26} strokeWidth={tab==='search'?2.5:2} />, label: 'Ara' },
        ].map(t => (
          <motion.div 
            key={t.id} 
            whileTap={{ scale: 0.9 }}
            onClick={() => { playClick(); setTab(t.id); }} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <span style={{ color: tab === t.id ? '#0A84FF' : '#636366', transition: 'color 0.3s' }}>
              {t.icon}
            </span>
            <span style={{ fontSize: '11px', color: tab === t.id ? '#0A84FF' : '#636366', fontWeight: tab === t.id ? '700' : '500', transition: 'color 0.3s' }}>
              {t.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
