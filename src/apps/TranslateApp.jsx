import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Languages, Volume2, Copy, Trash2, Mic, Loader2 } from 'lucide-react';
import { playClick } from '../audio';

export default function TranslateApp() {
  const [fromLang, setFromLang] = useState('tr');
  const [toLang, setToLang] = useState('en');
  
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const swapLanguages = () => {
    playClick();
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText.trim().length > 0) {
        handleTranslate(inputText);
      } else {
        setTranslatedText('');
      }
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [inputText, fromLang, toLang]);

  const handleTranslate = async (text) => {
    setIsTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setTranslatedText(data.responseData.translatedText);
      }
    } catch (e) {
      setTranslatedText('Çeviri hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsTranslating(false);
    }
  };

  const speak = (text, lang) => {
    if (!text || !window.speechSynthesis) return;
    playClick();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'tr' ? 'tr-TR' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const copy = (text) => {
    if (!text) return;
    playClick();
    navigator.clipboard.writeText(text);
    if(window.showDynamicAlert) window.showDynamicAlert('Kopyalandı');
  };

  const langName = (code) => code === 'tr' ? 'TÜRKÇE' : 'İNGİLİZCE';

  return (
    <div style={{ width: '100%', height: '100%', background: '#F2F2F7', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', paddingTop: 40 }}>
      
      {/* Top Floating Language Pill */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ background: 'white', borderRadius: 30, display: 'flex', alignItems: 'center', padding: '5px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#007AFF', width: 100, textAlign: 'center', letterSpacing: 0.5 }}>{langName(fromLang)}</span>
          <motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={swapLanguages}
            style={{ width: 40, height: 40, borderRadius: '50%', background: '#F2F2F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 5px' }}
          >
            <ArrowRightLeft size={18} color="#007AFF" />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#007AFF', width: 100, textAlign: 'center', letterSpacing: 0.5 }}>{langName(toLang)}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Source Text Box */}
        <div style={{ background: 'white', borderRadius: 24, padding: '25px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', minHeight: 220, position: 'relative' }}>
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Metin girin"
            style={{ width: '100%', flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: 28, fontWeight: 600, color: '#1C1C1E', background: 'transparent', letterSpacing: -0.5 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <button onClick={() => speak(inputText, fromLang)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#007AFF', padding: 0 }}>
                <Volume2 size={26} strokeWidth={2.5} />
              </button>
              <AnimatePresence>
                {inputText && (
                  <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} onClick={() => { playClick(); setInputText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FF3B30', padding: 0 }}>
                    <Trash2 size={26} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            {/* Visual Mic Button */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => { playClick(); if(window.showDynamicAlert) window.showDynamicAlert('Mikrofon erişimi yok'); }}
              style={{ width: 50, height: 50, borderRadius: 25, background: '#007AFF', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}
            >
              <Mic size={24} />
            </motion.button>
          </div>
        </div>

        {/* Translation Result Box */}
        <AnimatePresence>
          {(translatedText || isTranslating) && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ background: '#007AFF', borderRadius: 24, padding: '25px 20px', boxShadow: '0 15px 40px rgba(0,122,255,0.35)', display: 'flex', flexDirection: 'column', minHeight: 220, color: 'white' }}
            >
              <div style={{ flex: 1, position: 'relative' }}>
                {isTranslating && !translatedText ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Loader2 size={34} color="white" strokeWidth={2.5} />
                    </motion.div>
                  </div>
                ) : (
                  <div style={{ fontSize: 28, fontWeight: 600, wordBreak: 'break-word', letterSpacing: -0.5 }}>
                    {translatedText}
                  </div>
                )}
              </div>
              
              {!isTranslating && translatedText && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 20, marginTop: 15 }}>
                  <button onClick={() => speak(translatedText, toLang)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'white', padding: 0 }}>
                    <Volume2 size={26} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => copy(translatedText)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'white', padding: 0 }}>
                    <Copy size={26} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
