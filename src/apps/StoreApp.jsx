import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Download, Check, Bot, TrendingUp, Languages, Loader2, Palette, Video, ScanFace } from 'lucide-react';
import { playClick } from '../audio';

export default function StoreApp({ installedApps, onInstall, onOpenApp }) {
  const [downloading, setDownloading] = useState(null);
  const [faceIdActive, setFaceIdActive] = useState(false);

  const availableApps = [
    { id: 'ai', name: 'Tuzluca AI', desc: 'Sizin için her şeyi düşünen zeki asistan.', icon: <Bot size={40} color="white" />, bg: 'linear-gradient(180deg,#af52de,#5e5ce6)' },
    { id: 'borsa', name: 'Borsa', desc: 'Canlı piyasalar ve kripto para takibi.', icon: <TrendingUp size={40} color="white" />, bg: 'linear-gradient(180deg,#1c1c1e,#2c2c2e)' },
    { id: 'translate', name: 'Çeviri', desc: '100+ dilde anında metin ve ses çevirisi.', icon: <Languages size={40} color="white" />, bg: 'linear-gradient(180deg,#5AC8FA,#007AFF)' },
    { id: 'gartic', name: 'Gartic', desc: 'Canlı Çiz ve Tahmin Et oyunu! Arkadaşlarınla yarış.', icon: <Palette size={40} color="white" />, bg: 'linear-gradient(180deg,#FF6B6B,#FF8E8B)' },
    { id: 'facetime', name: 'FaceTime', desc: 'Arkadaşlarınızla güvenli, P2P görüntülü görüşme.', icon: <Video size={40} color="white" />, bg: 'linear-gradient(135deg, #32D74B, #28A745)' },
    { id: 'amiral', name: 'Amiral Battı', desc: 'Gerçek zamanlı çok oyunculu Amiral Battı oyunu.', icon: <span style={{fontSize: 32}}>⚓</span>, bg: 'linear-gradient(180deg,#0A84FF,#0055B3)' },
    { id: 'news', name: 'Haberler', desc: 'Dünyadan güncel gelişmeler cebinizde.', icon: <span style={{fontSize: 32}}>🗞️</span>, bg: 'linear-gradient(135deg, #FF2D55, #E94057)' },
    { id: 'pinterest', name: 'Pinterest', desc: 'İlham verici fikirler ve görsel keşif panosu.', icon: <span style={{fontSize: 32, color: 'white', fontWeight: 'bold'}}>P</span>, bg: '#E60023' }
  ];

  const handleDownload = (id) => {
    if (installedApps.includes(id) || downloading === id || faceIdActive) return;
    playClick();
    setFaceIdActive(true);
    
    // Simulate Face ID scan
    setTimeout(() => {
      setFaceIdActive(false);
      setDownloading(id);
      setTimeout(() => {
        onInstall(id);
        setDownloading(null);
      }, 2500); // 2.5s download simulation
    }, 1500); // 1.5s Face ID
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff', color: 'black', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 20px 20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '34px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>App Store</h1>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={20} color="#007AFF" />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>Sizin İçin Önerilenler</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {availableApps.map(app => {
            const isInstalled = installedApps.includes(app.id);
            const isDownloading = downloading === app.id;

            return (
              <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '16px', background: app.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  {app.icon}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>{app.name}</span>
                  <span style={{ fontSize: '13px', color: '#8e8e93', marginTop: '2px', lineHeight: 1.3 }}>{app.desc}</span>
                </div>
                <div>
                  {isInstalled ? (
                    <div onClick={() => onOpenApp(app.id)} style={{ background: '#f2f2f7', color: '#007AFF', padding: '6px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                      AÇ
                    </div>
                  ) : isDownloading ? (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #f2f2f7', borderTopColor: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 1s linear infinite' }}>
                      <Loader2 size={16} color="#007AFF" className="spinner" />
                    </div>
                  ) : (
                    <div onClick={() => handleDownload(app.id)} style={{ background: '#f2f2f7', color: '#007AFF', padding: '6px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                      İNDİR
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {faceIdActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              animate={{ 
                boxShadow: ["0px 0px 0px rgba(0, 122, 255, 0)", "0px 0px 40px rgba(0, 122, 255, 0.8)", "0px 0px 0px rgba(0, 122, 255, 0)"]
              }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
              style={{ width: 90, height: 90, borderRadius: 25, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
            >
              <ScanFace size={50} color="white" />
            </motion.div>
            <div style={{ marginTop: 20, fontSize: 18, fontWeight: 600, color: '#333' }}>Face ID Doğrulanıyor...</div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
