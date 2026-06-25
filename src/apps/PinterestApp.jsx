import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, MessageCircle, User, ChevronLeft, Heart, Share, MoreHorizontal, Loader2 } from 'lucide-react';
import { playClick } from '../audio';

const CATEGORIES = ['Dekorasyon', 'Doğa', 'Teknoloji', 'Sanat', 'Moda', 'Mimari', 'Tarifler', 'Arabalar'];
const ALL_CATEGORIES = ['Tümü', ...CATEGORIES];

const UNSPLASH_IDS = [
  '1517841905240-472988babdf9', '1494438639946-1ebd1d20bf85', '1506744626753-1fa28f6e511e',
  '1523206489230-c012c64b2b48', '1497215848122-8cb1da0b0b8c', '1497366216548-37526070297c',
  '1502672260266-1c1de24244b4', '1522708323590-d24dbb6b0267', '1513694203232-719a280e022f',
  '1481437156560-3205f6a55735', '1493663284031-b7e3aefcae8e', '1524758631624-e2822e304c36',
  '1486406146926-c627a92ad1ab', '1518780664697-55e3ad937233', '1501183638710-841dd1904471',
  '1515238152791-38141ea8682b', '1480074568708-e7b720bb3f09', '1470225620780-dba8ba36b745',
  '1507608616769-834f3b7db2eb', '1519710164239-da123dc03ef4', '1491553895911-0055eca6402d'
];

const generateImages = (count) => {
  return Array.from({ length: count }).map((_, i) => {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const unsplashId = UNSPLASH_IDS[Math.floor(Math.random() * UNSPLASH_IDS.length)];
    const displayHeight = Math.floor(Math.random() * (400 - 200 + 1)) + 200; // Rastgele yükseklik
    return {
      id: Date.now() + i,
      url: `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=400&q=80`,
      displayHeight,
      title: `${cat} Fikri ${i + 1}`,
      author: `Tasarımcı ${Math.floor(Math.random() * 100)}`,
      category: cat
    };
  });
};

export default function PinterestApp() {
  const [images, setImages] = useState(() => generateImages(50));
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [selectedPin, setSelectedPin] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const scrollContainerRef = useRef(null);
  const startY = useRef(0);

  const filteredImages = activeCategory === 'Tümü' ? images : images.filter(img => img.category === activeCategory);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const triggerLike = () => {
    playClick();
    setShowBigHeart(true);
    showToast("Kaydedilenler panosuna eklendi!");
    setTimeout(() => setShowBigHeart(false), 1000);
  };

  const handlePinTap = (pin) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(tapTimer.current);
      triggerLike();
    } else {
      tapTimer.current = setTimeout(() => {
        playClick();
        setSelectedPin(pin);
      }, 300);
    }
    lastTap.current = now;
  };

  const handleDetailTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      triggerLike();
    }
    lastTap.current = now;
  };

  const handleTouchStart = (e) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current > 0 && !isRefreshing) {
      const y = e.touches[0].clientY;
      if (y - startY.current > 120) {
        setIsRefreshing(true);
        startY.current = 0;
        playClick();
        setTimeout(() => {
          setImages(generateImages(50));
          setActiveCategory('Tümü');
          setIsRefreshing(false);
          showToast("Yeni fikirler yüklendi!");
        }, 1500);
      }
    }
  };

  const handleTouchEnd = () => {
    startY.current = 0;
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', color: '#111', overflow: 'hidden', position: 'relative' }}>
      
      {/* Big Heart Overlay Animation */}
      <AnimatePresence>
        {showBigHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ position: 'absolute', top: '40%', left: '50%', marginLeft: '-70px', marginTop: '-70px', zIndex: 100, pointerEvents: 'none' }}
          >
            <Heart size={140} fill="#E60023" color="#E60023" />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #eaeaea', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '45px 15px 10px 15px', gap: '10px' }}>
          <div style={{ flex: 1, background: '#e9e9e9', borderRadius: '30px', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#767676" />
            <input 
              type="text" 
              placeholder="Fikirler arayın..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px', fontWeight: '500' }}
            />
          </div>
        </div>

        {/* Categories / Chips Menu */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', gap: '10px', padding: '0 15px 15px 15px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {ALL_CATEGORIES.map(cat => (
              <motion.div
                key={cat}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playClick(); setActiveCategory(cat); }}
                style={{
                  flexShrink: 0,
                  padding: '8px 18px',
                  background: activeCategory === cat ? '#111' : '#f2f2f7',
                  color: activeCategory === cat ? '#fff' : '#111',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'home' ? (
        <div 
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 80px 10px', position: 'relative' }}
        >
          {isRefreshing && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', color: '#E60023' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}>
                <Loader2 size={30} />
              </motion.div>
            </div>
          )}

          <div style={{ columnCount: 2, columnGap: '10px' }}>
            <AnimatePresence>
              {filteredImages.map((pin) => (
                <motion.div 
                  key={pin.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handlePinTap(pin)}
                  style={{ marginBottom: '10px', breakInside: 'avoid', borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer', background: '#f2f2f7' }}
                >
                  <img src={pin.url} alt={pin.title} style={{ width: '100%', height: pin.displayHeight + 'px', objectFit: 'cover', display: 'block', borderRadius: '16px' }} loading="lazy" />
                  <div style={{ padding: '8px 4px 12px 4px' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333' }}>
                      {pin.title}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 80px 10px' }}>
          {/* Profil Sekmesi */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #556270)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
              <User size={50} color="white" />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '5px' }}>Tuzluca Kullanıcısı</h2>
            <span style={{ color: '#767676', fontSize: '15px', marginBottom: '25px', fontWeight: '500' }}>@tuzlucasocial</span>
            
            <div style={{ display: 'flex', gap: '40px', marginBottom: '35px' }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: '800', fontSize: '20px' }}>12.4K</div><div style={{ fontSize: '13px', color: '#767676', fontWeight: '500' }}>Takipçi</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: '800', fontSize: '20px' }}>142</div><div style={{ fontSize: '13px', color: '#767676', fontWeight: '500' }}>Takip</div></div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <motion.div whileTap={{ scale: 0.95 }} style={{ background: '#e9e9e9', color: '#111', padding: '12px 24px', borderRadius: '30px', fontWeight: '700', cursor: 'pointer' }}>Profili Düzenle</motion.div>
              <motion.div whileTap={{ scale: 0.95 }} style={{ background: '#e9e9e9', color: '#111', padding: '12px 24px', borderRadius: '30px', fontWeight: '700', cursor: 'pointer' }}>Paylaş</motion.div>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', textAlign: 'center' }}>Kaydedilen Panolar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {images.slice(0, 4).map((img, i) => (
                <div key={i} style={{ borderRadius: '20px', overflow: 'hidden', height: '180px', position: 'relative', cursor: 'pointer' }}>
                  <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '15px', background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)', color: 'white', fontWeight: 'bold' }}>{CATEGORIES[i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alt Navigasyon */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #eee', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 3 }}>
        <motion.div whileTap={{ scale: 0.8 }} onClick={() => { playClick(); setActiveTab('home'); }} style={{ color: activeTab === 'home' ? '#111' : '#767676', cursor: 'pointer' }}><Search size={26} strokeWidth={2.5} /></motion.div>
        <motion.div whileTap={{ scale: 0.8 }} onClick={() => { playClick(); showToast("Bildiriminiz yok."); }} style={{ color: '#767676', cursor: 'pointer' }}><Bell size={26} strokeWidth={2} /></motion.div>
        <motion.div whileTap={{ scale: 0.8 }} onClick={() => { playClick(); showToast("Mesaj kutunuz boş."); }} style={{ color: '#767676', cursor: 'pointer' }}><MessageCircle size={26} strokeWidth={2} /></motion.div>
        <motion.div whileTap={{ scale: 0.8 }} onClick={() => { playClick(); setActiveTab('profile'); }} style={{ color: activeTab === 'profile' ? '#111' : '#767676', cursor: 'pointer' }}><User size={26} strokeWidth={2} /></motion.div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            style={{ position: 'absolute', bottom: '90px', left: '50%', background: '#333', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#fff', zIndex: 10, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ position: 'absolute', top: 0, width: '100%', padding: '45px 15px 20px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 11, background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
              <div onClick={() => { playClick(); setSelectedPin(null); }} style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
                <ChevronLeft size={24} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
                <MoreHorizontal size={24} />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div onClick={handleDetailTap} style={{ position: 'relative', cursor: 'pointer' }}>
                <img src={selectedPin.url} alt={selectedPin.title} style={{ width: '100%', minHeight: '300px', objectFit: 'cover', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', display: 'block' }} />
              </div>
              
              <div style={{ padding: '25px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <motion.div whileTap={{ scale: 0.9 }} onClick={() => triggerLike()} style={{ background: '#f2f2f7', padding: '14px', borderRadius: '50%', cursor: 'pointer' }}><Heart size={24} color="#111" /></motion.div>
                    <motion.div whileTap={{ scale: 0.9 }} onClick={() => { playClick(); showToast("Bağlantı kopyalandı!"); }} style={{ background: '#f2f2f7', padding: '14px', borderRadius: '50%', cursor: 'pointer' }}><Share size={24} color="#111" /></motion.div>
                  </div>
                  <motion.div whileTap={{ scale: 0.9 }} onClick={() => triggerLike()} style={{ background: '#E60023', color: 'white', padding: '14px 28px', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                    Kaydet
                  </motion.div>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '15px', color: '#111' }}>{selectedPin.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} color="white" />
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{selectedPin.author}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
