import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Palette, Send, User, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { playClick, playTada, playTick } from '../audio';

const normalizeText = (str) => {
  if (!str) return '';
  return str.toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .trim();
};

const WORDS = Array.from(new Set([
  "ELMA", "ARABA", "KEDİ", "KÖPEK", "BİLGİSAYAR", "TELEFON", "KALEM", "EV", "AĞAÇ", "GÜNEŞ",
  "AY", "UÇAK", "GEMİ", "GÖZLÜK", "SAAT", "KİTAP", "MASA", "KAPI", "PENCERE", "AYAKKABI",
  "ŞAPKA", "BULUT", "YAĞMUR", "DENİZ", "BALIK", "KUŞ", "YILAN", "ASLAN", "FİL", "BİSİKLET",
  "TREN", "OTOBÜS", "HELİKOPTER", "KAMYON", "MOTOSİKLET", "FARE", "KLAVYE", "MONİTÖR", "KULAKLIK",
  "MİKROFON", "KAMERA", "TELEVİZYON", "KOLTUK", "YATAK", "DOLAP", "HALI", "PERDE", "TABLO",
  "VAZO", "ÇİÇEK", "BÖCEK", "ÖRÜMCEK", "KARINCA", "KELEBEK", "ARI", "SİNEK", "TAVŞAN", "KAPLUMBAĞA",
  "KURBAĞA", "YARASA", "MAYMUN", "ZEBRA", "ZÜRAFA", "DEVE", "PENGUEN", "KUTUP AYISI", "YUNUS", "BALİNA",
  "KÖPEK BALIĞI", "AHTAPOT", "DENİZANASI", "YENGEÇ", "İSTİRİDYE", "KABUK", "KUM", "GÜNEŞLİK",
  "HAVLU", "MAYO", "GÖMLEK", "PANTOLON", "ETEK", "ELBİSE", "CEKET", "MONT", "KAZAK", "ATKI",
  "ELDİVEN", "ÇORAP", "TERLİK", "ÇİZME", "KEMER", "CÜZDAN", "ÇANTA", "BAVUL",
  "PASAPORT", "BİLET", "PARA", "ANAHTAR", "KİLİT", "ZİL", "DUVAR", "ÇATI", "BACA", "BAHÇE", "ÇİT", 
  "KALDIRIM", "YOL", "KÖPRÜ", "TÜNEL", "DAĞ", "TEPE", "VADİ", "ORMAN", "ÇÖL",
  "GÖL", "NEHİR", "ŞELALE", "YILDIZ", "GEZEGEN", "ASTRONOT", "ROKET", "UZAYLI",
  "ROBOT", "MİKROSKOP", "TELESKOP", "BÜYÜTEÇ", "DÜRBÜN", "PUSULA",
  "HARİTA", "KÜRE", "BAYRAK", "ÇADIR", "KAMP ATEŞİ", "FENER",
  "KİBRİT", "ÇAKMAK", "MUM", "LAMBA", "AMPUL", "PİL", "PRİZ", "KABLO", "FİŞ", 
  "EKRAN", "HOPARLÖR", "RADYO", "KASET", "CD", "PLAK", "GİTAR", "PİYANO", "KEMAN", "BATERİ", "FLÜT", "SAKSAFON",
  "ŞEMSİYE", "YAĞMURLUK", "KAR", "BUZ", "KARDAN ADAM", "KIZAK", "KAYAK", "HEDİYE", "PAKET", "KURDELE", "PASTA",
  "BALON", "KONFETİ", "PARTİ", "MÜZİK", "DANS", "OYUN", "OYUNCAK", "BEBEK", "TOP", "KAYKAY", "PATEN", "UÇURTMA"
]));

export default function GarticApp() {
  const [nickname, setNickname] = useState(() => localStorage.getItem('gartic_nickname') || '');
  const [hasJoined, setHasJoined] = useState(false);
  const [channel, setChannel] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [now, setNow] = useState(Date.now()); // For timer re-rendering
  
  const [gameState, setGameState] = useState({
    drawer: null,
    word: '',
    endTime: 0
  });
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  
  const lastPos = useRef({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null); // To measure canvas true size
  const channelRef = useRef(null);
  
  const isDrawer = gameState.drawer === nickname;

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!hasJoined || !nickname) return;

    const newChannel = supabase.channel('gartic_global', {
      config: {
        presence: {
          key: nickname,
        },
      },
    });
    
    channelRef.current = newChannel;

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .on('broadcast', { event: 'draw' }, ({ payload }) => {
        drawLine(payload.x0, payload.y0, payload.x1, payload.y1, payload.color, payload.size, false);
      })
      .on('broadcast', { event: 'clear' }, () => {
        clearCanvas(false);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setMessages(prev => [...prev.slice(-49), payload]);
      })
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        setGameState(payload);
        // Clear canvas on new game
        if (payload.endTime > Date.now()) {
          clearCanvas(false);
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        // Current drawer sends the state to the newcomer
        if (isDrawer) {
          newChannel.send({
            type: 'broadcast',
            event: 'state',
            payload: gameState
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await newChannel.track({ user: nickname, online_at: new Date().toISOString() });
          
          newChannel.send({
            type: 'broadcast',
            event: 'chat',
            payload: { user: 'Sistem', text: `${nickname} katıldı.`, isSystem: true }
          });
          newChannel.send({ type: 'broadcast', event: 'request_state' });
        }
      });

    setChannel(newChannel);

    return () => {
      newChannel.unsubscribe();
    };
  }, [hasJoined]);

  // Setup Canvas
  useEffect(() => {
    if (hasJoined && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Fixed aspect ratio canvas logically, scale to display
      canvas.width = rect.width;
      canvas.height = rect.width * 0.8; // 4:5 aspect roughly
      
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
    }
  }, [hasJoined]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support touch or mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (!isDrawer) return;
    const { x, y } = getCoordinates(e);
    isDrawing.current = true;
    lastPos.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawing.current || !isDrawer) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    const { x, y } = getCoordinates(e);
    const x0 = lastPos.current.x;
    const y0 = lastPos.current.y;
    
    drawLine(x0, y0, x, y, color, lineWidth, true);
    lastPos.current = { x, y };
  };

  const endDrawing = () => {
    isDrawing.current = false;
  };

  const drawLine = (x0, y0, x1, y1, strokeColor, strokeWidth, emit) => {
    if (!contextRef.current) return;
    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
    ctx.closePath();

    if (!emit || !channelRef.current) return;

    // Throttle or send direct? Supabase can handle a lot, but ideally we throttle.
    // For simplicity, we just send.
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: { x0, y0, x1, y1, color: strokeColor, size: strokeWidth }
    });
  };

  const clearCanvas = (emit = true) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (emit && channelRef.current && isDrawer) {
      channelRef.current.send({ type: 'broadcast', event: 'clear' });
    }
  };

  const becomeDrawer = () => {
    playClick();
    
    // Kelime Seçim Algoritması: Daha önce çıkan kelimeleri filtrele
    let usedWords = [];
    try {
      usedWords = JSON.parse(localStorage.getItem('gartic_used_words')) || [];
    } catch (e) {}

    let availableWords = WORDS.filter(w => !usedWords.includes(w));
    
    // Eğer tüm kelimeler bitmişse (ki 170 civarı var, zor biter), baştan başla
    if (availableWords.length === 0) {
      availableWords = WORDS;
      usedWords = [];
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    usedWords.push(randomWord);
    localStorage.setItem('gartic_used_words', JSON.stringify(usedWords));

    const newState = {
      drawer: nickname,
      word: randomWord,
      endTime: Date.now() + 90000 // 90 seconds
    };
    setGameState(newState);
    clearCanvas(false);
    
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'state', payload: newState });
      channelRef.current.send({ type: 'broadcast', event: 'clear' });
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'chat', 
        payload: { user: 'Sistem', text: `${nickname} çiziyor! Kelime ${randomWord.length} harfli.`, isSystem: true } 
      });
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    playClick();

    const normalizedInput = normalizeText(chatInput);
    const normalizedWord = normalizeText(gameState.word);
    
    setChatInput('');

    if (isDrawer) {
      // Drawer cannot type the word
      if (normalizedInput === normalizedWord) {
        if(window.showDynamicAlert) window.showDynamicAlert('Cevabı yazamazsın!');
        return;
      }
    } else {
      // Check if correct
      if (gameState.word && normalizedInput === normalizedWord && gameState.endTime > Date.now()) {
        playTada();
        const winMsg = { user: 'Sistem', text: `${nickname} doğru kelimeyi buldu: ${gameState.word}! 🎉`, isSystem: true, isCorrect: true };
        setMessages(prev => [...prev.slice(-49), winMsg]);
        if(channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'chat', payload: winMsg });
        
        // Kazanan kişi otomatik olarak yeni çizen olur (Sıra ona geçer)
        setTimeout(() => {
          becomeDrawer();
        }, 500);
        
        return;
      }
    }

    const msg = { user: nickname, text: chatInput.trim(), isSystem: false };
    setMessages(prev => [...prev.slice(-49), msg]);
    if(channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
  };

  const renderWordMask = () => {
    if (!gameState.word) return 'Bekleniyor...';
    if (isDrawer) return gameState.word;
    return gameState.word.replace(/[A-ZĞÜŞİÖÇ]/g, '_ ').trim();
  };

  const timeRemaining = Math.max(0, Math.floor((gameState.endTime - now) / 1000));
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / 90) * 100)); // 90 saniye üzerinden hesaplanıyor
  
  useEffect(() => {
    if (gameState.endTime > 0) {
      const interval = setInterval(() => {
        setNow(Date.now()); // Ekranın saniyede bir güncellenmesi için state'i tetikliyoruz
        const remaining = Math.floor((gameState.endTime - Date.now()) / 1000);
        
        if (remaining > 0 && remaining <= 10) {
          playTick();
        }

        if (Date.now() > gameState.endTime && isDrawer) {
          // Time up
          const endState = { drawer: null, word: '', endTime: 0 };
          setGameState(endState);
          if(channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event: 'state', payload: endState });
            channelRef.current.send({ type: 'broadcast', event: 'chat', payload: { user: 'Sistem', text: `Süre bitti! Kelime: ${gameState.word}`, isSystem: true } });
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.endTime, isDrawer]);

  // LOGIN SCREEN
  if (!hasJoined) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85%' }}>
          <Palette size={60} color="#FF6B6B" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 10px', color: '#333' }}>Gartic</h1>
          <p style={{ color: '#888', marginBottom: '30px', textAlign: 'center', fontSize: '15px' }}>Çiz ve Tahmin Et! Oynamak için bir takma ad girin.</p>
          
          <input 
            type="text" 
            placeholder="Kullanıcı Adı" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid #eee', fontSize: '16px', outline: 'none', marginBottom: '20px', textAlign: 'center', fontWeight: '600' }}
          />
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (nickname.trim()) {
                playClick();
                localStorage.setItem('gartic_nickname', nickname.trim());
                setHasJoined(true);
              }
            }}
            style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: '#FF6B6B', color: 'white', fontSize: '18px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            Oyuna Katıl
          </motion.button>
        </div>
      </div>
    );
  }

  // MAIN APP SCREEN
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FA', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', paddingTop: '40px' }}>
      
      {/* Top Header */}
      <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {gameState.drawer ? `${gameState.drawer} ÇİZİYOR` : 'BEKLENİYOR'}
          </span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#333', letterSpacing: isDrawer ? '1px' : '4px' }}>
            {renderWordMask()}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '5px' }}>
            <span style={{ fontSize: '10px', color: '#888', fontWeight: '600', textTransform: 'uppercase' }}>Çevrimiçi</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: onlineCount >= 2 ? '#34C759' : '#FF9500', fontWeight: '700', fontSize: '14px' }}>
              <User size={14} /> {onlineCount}
            </div>
          </div>
          {gameState.endTime > 0 && (
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: `3px solid ${timeRemaining < 10 ? '#FF3B30' : '#34C759'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: timeRemaining < 10 ? '#FF3B30' : '#333' }}>
              {timeRemaining}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (Visual Timer) */}
      {gameState.endTime > 0 && (
        <div style={{ width: '100%', height: '4px', background: '#e5e5ea' }}>
          <motion.div 
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{ height: '100%', background: timeRemaining < 10 ? '#FF3B30' : (timeRemaining < 30 ? '#FFCC00' : '#34C759') }} 
          />
        </div>
      )}

      {/* Canvas Area */}
      <div ref={containerRef} style={{ width: '100%', background: '#fff', borderBottom: '1px solid #eee', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          style={{ width: '100%', display: 'block', touchAction: 'none', cursor: isDrawer ? 'crosshair' : 'default' }}
        />
        
        {!gameState.drawer && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(3px)' }}>
            <motion.button 
              whileTap={onlineCount >= 2 ? { scale: 0.9 } : {}}
              onClick={() => onlineCount >= 2 && becomeDrawer()}
              style={{ 
                padding: '15px 30px', 
                borderRadius: '25px', 
                background: onlineCount >= 2 ? '#007AFF' : '#A2A2A2', 
                color: 'white', 
                border: 'none', 
                fontSize: '18px', 
                fontWeight: '700', 
                boxShadow: onlineCount >= 2 ? '0 10px 20px rgba(0,122,255,0.3)' : 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: onlineCount >= 2 ? 'pointer' : 'not-allowed',
                opacity: onlineCount >= 2 ? 1 : 0.9
              }}
            >
              <Pencil size={20} /> {onlineCount >= 2 ? 'Çizmeye Başla' : 'Arkadaş Bekleniyor...'}
            </motion.button>
            {onlineCount < 2 && (
              <span style={{ marginTop: 15, color: '#333', fontWeight: '600', fontSize: 14, background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '12px' }}>
                Oynamak için en az 2 kişi çevrimiçi olmalı. (Şu an: {onlineCount})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Toolbar for Drawer */}
      {isDrawer && (
        <div style={{ display: 'flex', padding: '10px 15px', background: 'white', borderBottom: '1px solid #eee', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            {['#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6'].map(c => (
              <div 
                key={c} 
                onClick={() => setColor(c)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: color === c ? '3px solid #ddd' : 'none', cursor: 'pointer', transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s' }}
              />
            ))}
            <div 
              onClick={() => setColor('#FFFFFF')}
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: '2px dashed #ccc', cursor: 'pointer', transform: color === '#FFFFFF' ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ width: '12px', height: '4px', background: '#ccc', transform: 'rotate(-45deg)' }} />
            </div>
          </div>
          <button onClick={() => clearCanvas(true)} style={{ background: 'none', border: 'none', color: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}>
            <Trash2 size={24} />
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            padding: '8px 12px', 
            borderRadius: '12px', 
            background: msg.isSystem ? (msg.isCorrect ? '#E8F5E9' : '#F2F2F7') : 'white', 
            color: msg.isSystem ? (msg.isCorrect ? '#2E7D32' : '#8E8E93') : '#333',
            alignSelf: msg.isSystem ? 'center' : 'flex-start',
            fontSize: msg.isSystem ? '13px' : '15px',
            fontWeight: msg.isSystem ? '600' : '500',
            boxShadow: msg.isSystem ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            maxWidth: '90%'
          }}>
            {!msg.isSystem && <span style={{ fontWeight: '700', color: '#007AFF', marginRight: '6px' }}>{msg.user}:</span>}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '15px', background: 'white', borderTop: '1px solid #eee' }}>
        <form onSubmit={sendChat} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isDrawer ? "Çizim yapıyorsunuz..." : "Tahmininizi yazın..."}
            disabled={isDrawer}
            style={{ flex: 1, padding: '12px 15px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', background: isDrawer ? '#f9f9f9' : 'white' }}
          />
          <button 
            type="submit" 
            disabled={isDrawer || !chatInput.trim()}
            style={{ width: '46px', height: '46px', borderRadius: '50%', background: isDrawer || !chatInput.trim() ? '#E5E5EA' : '#007AFF', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Send size={20} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>

    </div>
  );
}
