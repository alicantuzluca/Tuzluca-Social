import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Share, BookOpen, Copy, Search, ShieldCheck, Lock, Book, MessageCircle, Video, Hash, Code, RefreshCw } from 'lucide-react';
import { playClick } from '../audio';

const QUICK_LINKS = [
  { name: 'Google', url: 'https://www.google.com/webhp?igu=1', color: '#4285F4', emoji: <Search size={26} color="white" /> },
  { name: 'Wikipedia', url: 'https://tr.m.wikipedia.org', color: '#000000', emoji: <Book size={26} color="white" /> },
  { name: 'YouTube', url: 'https://m.youtube.com', color: '#FF0000', emoji: <Video size={26} color="white" /> },
  { name: 'Twitter', url: 'https://mobile.twitter.com', color: '#1DA1F2', emoji: <Hash size={26} color="white" /> },
  { name: 'Reddit', url: 'https://i.reddit.com', color: '#FF4500', emoji: <MessageCircle size={26} color="white" /> },
  { name: 'GitHub', url: 'https://github.com', color: '#333', emoji: <Code size={26} color="white" /> },
];

export default function SafariApp() {
  const [url, setUrl] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const iframeRef = useRef(null);
  const inputRef = useRef(null);

  const navigate = (raw) => {
    playClick();
    let target = raw.trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = 'https://www.google.com/search?q=' + encodeURIComponent(target) + '&igu=1';
      }
    }

    // Bilgisayar tarayıcısında çalıştığımız için bazı siteler inatla PC sürümünü açar.
    // Bunu engellemek için popüler sitelerin zorunlu mobil (m.) adreslerine yönlendiriyoruz.
    try {
      const urlObj = new URL(target);
      const host = urlObj.hostname.replace('www.', '');
      if (host === 'wikipedia.org' || host === 'tr.wikipedia.org') {
        urlObj.hostname = host === 'tr.wikipedia.org' ? 'tr.m.wikipedia.org' : 'm.wikipedia.org';
      } else if (host === 'youtube.com') {
        urlObj.hostname = 'm.youtube.com';
      } else if (host === 'facebook.com') {
        urlObj.hostname = 'm.facebook.com';
      } else if (host === 'twitter.com' || host === 'x.com') {
        urlObj.hostname = 'mobile.twitter.com';
      } else if (host === 'reddit.com') {
        urlObj.hostname = 'i.reddit.com';
      } else if (host === 'twitch.tv') {
        urlObj.hostname = 'm.twitch.tv';
      } else if (host === 'imdb.com') {
        urlObj.hostname = 'm.imdb.com';
      }
      target = urlObj.toString();
    } catch(e) {
      // Geçersiz URL ise normal devam et
    }

    setUrl(target);
    setInputVal(target);
    setLoading(true);
    setShowSearch(false);
    
    const newHistory = [...history.slice(0, historyIdx + 1), target];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      playClick();
      const prev = history[historyIdx - 1];
      setHistoryIdx(i => i - 1);
      setUrl(prev);
      setInputVal(prev);
      setLoading(true);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      playClick();
      const next = history[historyIdx + 1];
      setHistoryIdx(i => i + 1);
      setUrl(next);
      setInputVal(next);
      setLoading(true);
    }
  };

  const reload = () => {
    playClick();
    if (url && iframeRef.current) {
      setLoading(true);
      iframeRef.current.src = url;
    }
  };

  const displayUrl = url
    ? url.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 40)
    : 'Arama yapın veya adres girin';

  const openSearch = () => {
    setShowSearch(true);
    setInputVal(url);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f2f2f7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', position: 'relative' }}>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: 'white', overflow: 'hidden' }}>
        {!url && !showSearch && (
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '60px 20px 100px', background: '#f2f2f7' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'black', marginBottom: '24px', textAlign: 'center' }}>Başlangıç Sayfası</h1>
            <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'black', marginBottom: '20px' }}>Hızlı Bağlantılar</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 8px' }}>
                {QUICK_LINKS.map((l, i) => (
                  <motion.div key={i} whileTap={{ scale: 0.9 }} onClick={() => navigate(l.url)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l.emoji}</div>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#8e8e93', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{l.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <ShieldCheck size={36} color="#34C759" />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'black' }}>Gizlilik Raporu</div>
                <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>Safari sitelerin sizi izlemesini engeller.</div>
              </div>
            </div>
          </div>
        )}

        {url && (
          <>
            {loading && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#007AFF', zIndex: 10, animation: 'safariProgress 1.5s ease-out forwards' }} />
            )}
            <iframe
              ref={iframeRef}
              key={url}
              src={url}
              title="Safari"
              onLoad={() => setLoading(false)}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block', pointerEvents: showSearch ? 'none' : 'auto', opacity: showSearch ? 0.3 : 1, transition: 'opacity 0.2s' }}
              allow="accelerometer; camera; microphone; geolocation"
            />
          </>
        )}
      </div>

      {/* Safari Bottom UI (iOS 15+) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        
        {/* Floating Address Bar */}
        {!showSearch && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ padding: '0 16px 16px' }}>
            <div onClick={openSearch} style={{ height: '50px', background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(20px)', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.1)' }}>
              {loading ? <RefreshCw size={14} color="#8e8e93" className="spin-anim" /> : <span style={{ fontSize: '16px' }}>AA</span>}
              <Lock size={12} color="#8e8e93" />
              <span style={{ fontSize: '17px', color: 'black', fontWeight: '400' }}>{displayUrl}</span>
              {loading ? <button onClick={(e) => { e.stopPropagation(); reload(); }} style={{ background: 'none', border: 'none', padding: 5, cursor: 'pointer' }}><RefreshCw size={16} color="#8e8e93" /></button> : <RefreshCw size={16} color="transparent" />}
            </div>
          </motion.div>
        )}

        {/* Bottom Toolbar */}
        {!showSearch && (
          <div style={{ height: '56px', backgroundColor: 'rgba(249,249,249,0.9)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '10px' }}>
            <motion.button whileTap={{ scale: 0.8 }} onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
              <ChevronLeft size={28} color={historyIdx > 0 ? '#007AFF' : '#c6c6c8'} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={goForward} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
              <ChevronRight size={28} color={historyIdx < history.length - 1 ? '#007AFF' : '#c6c6c8'} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
              <Share size={24} color="#007AFF" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
              <BookOpen size={24} color="#007AFF" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
              <Copy size={24} color="#007AFF" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Search Overlay State */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#f2f2f7', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
            {/* Top Search Bar */}
            <div style={{ paddingTop: '50px', paddingBottom: '10px', backgroundColor: 'rgba(250,250,250,0.95)', borderBottom: '0.5px solid #c6c6c8', display: 'flex', alignItems: 'center', paddingLeft: '16px', paddingRight: '16px', gap: '12px' }}>
              <div style={{ flex: 1, height: '40px', background: '#e3e3e8', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
                <Search size={18} color="#8e8e93" />
                <input
                  ref={inputRef}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') navigate(inputVal); }}
                  placeholder="Arama yapın veya adres girin"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '17px', fontFamily: 'inherit' }}
                />
                {inputVal && (
                  <button onClick={() => { setInputVal(''); inputRef.current?.focus(); }} style={{ background: '#c6c6c8', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>×</button>
                )}
              </div>
              <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '17px', fontWeight: '400', cursor: 'pointer' }}>İptal</button>
            </div>

            {/* Quick Suggestions */}
            <div style={{ flex: 1, padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', marginBottom: '10px' }}>Yer İmleri</h3>
              <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
                {QUICK_LINKS.slice(0, 4).map((l, i) => (
                  <div key={i} onClick={() => navigate(l.url)} style={{ padding: '14px 16px', borderBottom: i !== 3 ? '0.5px solid #e5e5ea' : 'none', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(l.emoji, { size: 16 })}</div>
                    <span style={{ fontSize: '17px', color: 'black' }}>{l.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes safariProgress {
          0% { width: 0%; opacity: 1; }
          70% { width: 80%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
