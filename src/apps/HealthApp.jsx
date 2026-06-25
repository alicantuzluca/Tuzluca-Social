import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Flame, Moon, Footprints, Activity, Apple, ChevronRight, TrendingUp } from 'lucide-react';
import { playClick } from '../audio';

export default function HealthApp() {
  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000000' : '#f2f2f7';
  const card = isDark ? '#1c1c1e' : '#ffffff';
  const textDark = isDark ? '#ffffff' : '#000000';
  const textSub = '#8e8e93';

  const ringsSvg = (
    <svg width="64" height="64" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke={isDark ? "#333" : "#e5e5ea"} strokeWidth="11" fill="none" />
      <circle cx="50" cy="50" r="40" stroke="#FF2D55" strokeWidth="11" fill="none" strokeDasharray="251" strokeDashoffset="50" strokeLinecap="round" />
      
      <circle cx="50" cy="50" r="27" stroke={isDark ? "#333" : "#e5e5ea"} strokeWidth="11" fill="none" />
      <circle cx="50" cy="50" r="27" stroke="#34C759" strokeWidth="11" fill="none" strokeDasharray="169" strokeDashoffset="40" strokeLinecap="round" />
      
      <circle cx="50" cy="50" r="14" stroke={isDark ? "#333" : "#e5e5ea"} strokeWidth="11" fill="none" />
      <circle cx="50" cy="50" r="14" stroke="#007AFF" strokeWidth="11" fill="none" strokeDasharray="87" strokeDashoffset="20" strokeLinecap="round" />
    </svg>
  );

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: textDark, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      
      {/* Header */}
      <div style={{ padding: '60px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: bg, position: 'sticky', top: 0, zIndex: 10, borderBottom: `0.5px solid ${isDark ? '#333' : '#c6c6c8'}`, backdropFilter: 'blur(20px)' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Özet</h1>
        <motion.div whileTap={{ scale: 0.9 }} onClick={playClick} style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, #007AFF, #5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
          AB
        </motion.div>
      </div>
      
      {/* Scrollable Content */}
      <div style={{ flex: 1, padding: '16px 20px 80px', overflowY: 'auto' }}>
        
        {/* Activity Rings */}
        <motion.div whileTap={{ scale: 0.98 }} onClick={playClick} style={{ background: card, borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: textDark, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              Aktivite <ChevronRight size={16} color={textSub} />
            </div>
            <div style={{ fontSize: 15, color: '#FF2D55', fontWeight: 600 }}>Hareket <span style={{ fontWeight: 400, color: textSub }}>340/500 kcal</span></div>
            <div style={{ fontSize: 15, color: '#34C759', fontWeight: 600 }}>Egzersiz <span style={{ fontWeight: 400, color: textSub }}>24/30 dk</span></div>
            <div style={{ fontSize: 15, color: '#007AFF', fontWeight: 600 }}>Duruş <span style={{ fontWeight: 400, color: textSub }}>8/12 sa</span></div>
          </div>
          {ringsSvg}
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Favoriler</h2>
          <span style={{ color: '#007AFF', fontSize: 17, cursor: 'pointer' }}>Düzenle</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Adımlar */}
          <motion.div whileTap={{ scale: 0.96 }} onClick={playClick} style={{ background: card, borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF9500', marginBottom: 16 }}>
              <Footprints size={20} fill="#FF9500" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Adımlar</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>6.243</div>
            <div style={{ fontSize: 15, color: textSub, marginTop: 2, fontWeight: 500 }}>adım</div>
          </motion.div>

          {/* Kalp Atış Hızı */}
          <motion.div whileTap={{ scale: 0.96 }} onClick={playClick} style={{ background: card, borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF3B30', marginBottom: 16 }}>
              <Heart size={20} fill="#FF3B30" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Kalp Atış Hızı</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>72</div>
            <div style={{ fontSize: 15, color: textSub, marginTop: 2, fontWeight: 500 }}>BPM</div>
          </motion.div>

          {/* Uyku */}
          <motion.div whileTap={{ scale: 0.96 }} onClick={playClick} style={{ background: card, borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5856D6', marginBottom: 16 }}>
              <Moon size={20} fill="#5856D6" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Uyku</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>7 sa 15 dk</div>
            <div style={{ fontSize: 15, color: textSub, marginTop: 2, fontWeight: 500 }}>Dün gece</div>
          </motion.div>

          {/* Enerji */}
          <motion.div whileTap={{ scale: 0.96 }} onClick={playClick} style={{ background: card, borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF2D55', marginBottom: 16 }}>
              <Flame size={20} fill="#FF2D55" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Hareket</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>340</div>
            <div style={{ fontSize: 15, color: textSub, marginTop: 2, fontWeight: 500 }}>kcal</div>
          </motion.div>
        </div>

        {/* Highlights */}
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '24px 0 12px', letterSpacing: '-0.5px' }}>Öne Çıkanlar</h2>
        <motion.div whileTap={{ scale: 0.98 }} onClick={playClick} style={{ background: card, borderRadius: 16, padding: 20, cursor: 'pointer', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={18} color="#FF9500" />
            <div style={{ fontSize: 13, color: textSub, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Eğilimler</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: textDark, marginBottom: 6 }}>Adımlar: Gelişme Var</div>
          <p style={{ fontSize: 15, color: textSub, margin: 0, lineHeight: 1.4 }}>Son 7 günde, önceki haftaya göre günlük ortalama 1.200 adım daha fazla attınız.</p>
        </motion.div>

      </div>

      {/* Bottom Nav Placeholder (optional for Health) */}
      <div style={{ display: 'flex', height: 83, background: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderTop: `0.5px solid ${isDark ? '#333' : '#c6c6c8'}`, paddingBottom: 20, position: 'absolute', bottom: 0, width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
          <Activity size={24} />
          <span style={{ fontSize: 10, fontWeight: 500, marginTop: 4 }}>Özet</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: textSub }}>
          <Apple size={24} />
          <span style={{ fontSize: 10, fontWeight: 500, marginTop: 4 }}>Göz At</span>
        </div>
      </div>

    </div>
  );
}
