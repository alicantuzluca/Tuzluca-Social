import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, QrCode } from 'lucide-react';
import { playClick } from '../audio';

const CARDS = [
  { id: 1, type: 'card', name: 'Apple Card', num: '•••• •••• •••• 1234', bg: 'linear-gradient(135deg, #ffffff 0%, #f0f0f5 100%)', text: '#000', logo: ' Card' },
  { id: 2, type: 'card', name: 'Apple Cash', num: '₺1.250,00', bg: 'linear-gradient(135deg, #000000 0%, #1c1c1e 100%)', text: '#fff', logo: ' Cash' },
  { id: 3, type: 'card', name: 'Garanti Bonus', num: '•••• 4281', bg: 'linear-gradient(135deg, #34C759 0%, #28a745 100%)', text: '#fff', logo: 'GARANTİ' },
  { id: 4, type: 'pass', name: 'Biniş Kartı', bg: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)', text: '#fff', logo: '✈️ THY' },
];

export default function WalletApp() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleCard = (id) => {
    playClick();
    setExpandedId(expandedId === id ? null : id);
  };

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000000' : '#000000'; // Wallet is usually dark background in iOS anyway, but let's keep it black to make cards pop.
  const textDark = '#ffffff';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: textDark, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', overflow: 'hidden' }}>
      
      <div style={{ padding: '60px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Cüzdan</h1>
        <motion.div whileTap={{ scale: 0.9 }} onClick={playClick} style={{ background: '#2c2c2e', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Plus size={20} color="white" strokeWidth={3} />
        </motion.div>
      </div>

      <div style={{ flex: 1, position: 'relative', padding: '10px 20px' }}>
        {CARDS.map((card, i) => {
          const isExpanded = expandedId === card.id;
          const isOtherExpanded = expandedId !== null && expandedId !== card.id;
          
          return (
            <motion.div
              key={card.id}
              onClick={() => toggleCard(card.id)}
              initial={false}
              animate={{
                y: isExpanded ? 20 : isOtherExpanded ? 700 : i * 55,
                scale: isExpanded ? 1 : isOtherExpanded ? 0.9 : 1,
                zIndex: isExpanded ? 50 : i,
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              style={{
                position: 'absolute',
                top: 0, left: 20, right: 20,
                height: 220,
                borderRadius: 16,
                background: card.bg,
                color: card.text,
                padding: 20,
                boxShadow: isExpanded ? '0 20px 40px rgba(0,0,0,0.5)' : '0 -2px 10px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                border: '0.5px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{card.logo}</div>
                {card.type === 'card' ? <CreditCard size={28} color={card.text} opacity={0.8} /> : <QrCode size={28} color={card.text} opacity={0.8} />}
              </div>
              
              {card.type === 'card' ? (
                <div>
                  <div style={{ fontSize: 20, letterSpacing: card.id === 2 ? 0 : 2, fontFamily: card.id === 2 ? 'inherit' : 'monospace', fontWeight: 600 }}>{card.num}</div>
                  {card.id !== 2 && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8, fontWeight: 600, letterSpacing: 1 }}>ALICAN BAYRAM</div>}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 500 }}>IST → ESB</div>
                  <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>14:30</div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Transactions overlay when card is expanded */}
        <AnimatePresence>
          {expandedId && CARDS.find(c => c.id === expandedId).type === 'card' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 30 }}
              style={{ position: 'absolute', top: 260, left: 0, right: 0, bottom: 0, background: '#1c1c1e', borderRadius: '24px 24px 0 0', padding: '30px 20px 0', zIndex: 40 }}
            >
              <div style={{ width: 40, height: 5, background: '#333', borderRadius: 3, margin: '-15px auto 20px' }} />
              
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.5px' }}>Son İşlemler</div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>☕</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>Starbucks</div>
                    <div style={{ fontSize: 14, color: '#8e8e93', marginTop: 2 }}>Yeme İçme</div>
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 500 }}>-₺120,00</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛒</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>Migros</div>
                    <div style={{ fontSize: 14, color: '#8e8e93', marginTop: 2 }}>Market</div>
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 500 }}>-₺850,50</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📱</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>Apple</div>
                    <div style={{ fontSize: 14, color: '#8e8e93', marginTop: 2 }}>Elektronik</div>
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 500 }}>-₺34.999,00</div>
              </div>

            </motion.div>
          )}

          {expandedId && CARDS.find(c => c.id === expandedId).type === 'pass' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 30 }}
              style={{ position: 'absolute', top: 260, left: 0, right: 0, bottom: 0, background: '#ffffff', color: '#000', borderRadius: '24px 24px 0 0', padding: '30px 20px 0', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{ width: 40, height: 5, background: '#e5e5ea', borderRadius: 3, margin: '-15px auto 20px' }} />
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 30, letterSpacing: '-0.5px' }}>Biniş Kartı Detayı</div>
              <QrCode size={180} color="#000" />
              <div style={{ fontSize: 15, color: '#8e8e93', marginTop: 10, letterSpacing: 2 }}>TK2154 - 14:30</div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
