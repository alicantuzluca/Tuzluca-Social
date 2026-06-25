import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Bluetooth, Phone, Plane, Music, Play, Forward, Rewind, Moon, Lock, Maximize, Sun, Volume2, Flashlight, Clock, Calculator, Camera } from 'lucide-react';
import { playClick } from '../audio';
const RoundBtn = ({ icon, active, activeBg, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={() => playClick()}
      style={{ 
        width: 52, height: 52, borderRadius: '50%', border: 'none', 
        background: active ? activeBg : 'rgba(0,0,0,0.2)', 
        color: active ? 'white' : 'white', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      {icon}
    </motion.button>
  </div>
);

const SquareModule = ({ children, gridArea, bg }) => (
  <motion.div 
    whileTap={{ scale: 0.96 }}
    style={{
      background: bg || 'rgba(0,0,0,0.35)',
      borderRadius: 22,
      gridArea,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
    }}
  >
    {children}
  </motion.div>
);

export default function ControlCenter({ isOpen, onClose }) {
  const handleDragEnd = (e, info) => {
    if (info.offset.y < -50 || info.velocity.y < -300) {
      onClose();
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          style={{ 
            position: 'absolute', inset: 0, zIndex: 9997, 
            background: 'rgba(0,0,0,0.2)', 
            backdropFilter: 'blur(45px) saturate(200%) brightness(0.8)', 
            WebkitBackdropFilter: 'blur(45px) saturate(200%) brightness(0.8)',
            display: 'flex', flexDirection: 'column',
            padding: '70px 24px 24px', boxSizing: 'border-box'
          }}
        >
          {/* iOS Control Center Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gridTemplateRows: 'repeat(4, 76px) repeat(2, 76px)', 
            gap: 16,
            gridTemplateAreas: `
              "conn conn play play"
              "conn conn play play"
              "lock mirror bright vol"
              "focus focus bright vol"
              "flash timer calc cam"
            `
          }}>
            
            {/* Connections Module */}
            <div style={{ 
              gridArea: 'conn', background: 'rgba(0,0,0,0.35)', borderRadius: 24, 
              padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
              <RoundBtn icon={<Plane size={24} />} active={false} activeBg="#FF9500" />
              <RoundBtn icon={<Wifi size={24} />} active={true} activeBg="#007AFF" />
              <RoundBtn icon={<Bluetooth size={24} />} active={true} activeBg="#007AFF" />
              <RoundBtn icon={<Phone size={24} />} active={true} activeBg="#34C759" />
            </div>

            {/* Now Playing Module */}
            <div style={{ 
              gridArea: 'play', background: 'rgba(0,0,0,0.35)', borderRadius: 24, 
              padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #FF2D55, #8A2BE2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 600, opacity: 0.5 }}>Müzik</div>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 400 }}>Çalmıyor</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
                <Rewind size={22} color="rgba(255,255,255,0.5)" />
                <Play size={28} color="white" fill="white" />
                <Forward size={22} color="rgba(255,255,255,0.5)" />
              </div>
            </div>

            {/* Orientation Lock */}
            <SquareModule gridArea="lock">
              <Lock size={26} color="white" />
            </SquareModule>

            {/* Screen Mirroring */}
            <SquareModule gridArea="mirror">
              <Maximize size={26} color="white" />
            </SquareModule>

            {/* Focus */}
            <SquareModule gridArea="focus">
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 20px', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={20} color="white" fill="white" />
                </div>
                <span style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>Odak</span>
              </div>
            </SquareModule>

            {/* Brightness Slider */}
            <div style={{ 
              gridArea: 'bright', background: 'rgba(0,0,0,0.35)', borderRadius: 24, 
              position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', 
              justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'white' }} />
              <Sun size={26} color="#8e8e93" style={{ position: 'relative', zIndex: 1 }} />
            </div>

            {/* Volume Slider */}
            <div style={{ 
              gridArea: 'vol', background: 'rgba(0,0,0,0.35)', borderRadius: 24, 
              position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', 
              justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'white' }} />
              <Volume2 size={26} color="#8e8e93" style={{ position: 'relative', zIndex: 1 }} />
            </div>

            {/* Bottom row utilities */}
            <SquareModule gridArea="flash">
              <Flashlight size={26} color="white" />
            </SquareModule>
            
            <SquareModule gridArea="timer">
              <Clock size={26} color="white" />
            </SquareModule>
            
            <SquareModule gridArea="calc">
              <Calculator size={26} color="white" />
            </SquareModule>
            
            <SquareModule gridArea="cam">
              <Camera size={26} color="white" />
            </SquareModule>

          </div>

          {/* Home indicator to close */}
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 140, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: 3 }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
