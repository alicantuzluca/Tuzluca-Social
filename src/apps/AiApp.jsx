import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send } from 'lucide-react';
import { playClick } from '../audio';

export default function AiApp({ isDark, setIsDark, volume, setVolume, isMuted, setIsMuted, osApi, onOpenApp }) {
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('Size nasıl yardımcı olabilirim? Yazarak sorabilirsiniz.');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const synthRef = useRef(window.speechSynthesis);
  const isAiSpeakingRef = useRef(false);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const speak = (text) => {
    isAiSpeakingRef.current = true;
    setIsSpeaking(true);
    if (synthRef.current.speaking) synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
    const voices = synthRef.current.getVoices();
    const trVoice = voices.find(v => v.lang.includes('tr') && v.name.toLowerCase().includes('female')) || voices.find(v => v.lang.includes('tr'));
    if (trVoice) utterance.voice = trVoice;

    utterance.onend = () => {
      isAiSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    
    setResponse(text);
    synthRef.current.speak(utterance);
  };

  const processCommand = async (cmd) => {
    setIsProcessing(true);
    setResponse('Düşünüyorum...');

    const tools = [
      {
        type: "function",
        function: {
          name: "setDarkMode",
          description: "Karanlık modu (dark mode) veya aydınlık modu açar/kapatır. Ekran temasını değiştirir.",
          parameters: { type: "object", properties: { enable: { type: "boolean", description: "Karanlık mod için true, aydınlık mod için false" } }, required: ["enable"] }
        }
      },
      {
        type: "function",
        function: {
          name: "setVolume",
          description: "Sistemin ses seviyesini ayarlar.",
          parameters: { type: "object", properties: { level: { type: "integer", description: "0 (sessiz) ile 100 (en yüksek) arası ses seviyesi" } }, required: ["level"] }
        }
      },
      {
        type: "function",
        function: {
          name: "setBrightness",
          description: "Ekran parlaklığını ayarlar.",
          parameters: { type: "object", properties: { level: { type: "integer", description: "20 (karanlık) ile 100 (aydınlık) arası parlaklık seviyesi" } }, required: ["level"] }
        }
      },
      {
        type: "function",
        function: {
          name: "openApp",
          description: "Belirtilen uygulamayı açar/başlatır.",
          parameters: { 
            type: "object", 
            properties: { 
              appId: { 
                type: "string", 
                enum: ["settings", "messages", "photos", "camera", "social", "games", "weather", "maps", "calendar", "notes", "wallet", "health", "clock", "calculator", "safari", "music", "recorder", "borsa", "translate", "store"],
              } 
            }, required: ["appId"] 
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sendLastPhotoToUser",
          description: "Son çekilen fotoğrafı belirtilen kişiye mesaj olarak gönderir.",
          parameters: { 
            type: "object", 
            properties: { 
              username: { type: "string", description: "Fotoğrafın gönderileceği kişinin adı (örn: Ali)" },
              messageText: { type: "string", description: "İsteğe bağlı mesaj metni" }
            }, required: ["username"] 
          }
        }
      },
      {
        type: "function",
        function: {
          name: "makePhoneCall",
          description: "Çevrimiçi ağdaki bir kişiyi sesli olarak arar (telefon görüşmesi yapar). Görüntülü DEĞİLDİR.",
          parameters: { 
            type: "object", 
            properties: { 
              targetName: { type: "string", description: "Aranacak kişinin adı (örn: Alican, Mehmet vb.)" }
            }, required: ["targetName"] 
          }
        }
      }
    ];

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: `Sen "Tuzluca OS" işletim sisteminin kalbi olan Dinç isimli yapay zeka asistanısın. 
Kullanıcı senden sistemi kontrol etmeni (karanlık modu aç, ekranı kıs, uygulamayı başlat, son fotoğrafı birine gönder vb.) isterse MUTLAKA uygun aracı (tool) kullan. Asla "bunu yapamam" deme, araçları kullanarak yap. 
Çok samimi, doğal ve kısa Türkçe cümlelerle konuş.`
            },
            { role: 'user', content: cmd }
          ],
          tools: tools,
          tool_choice: "auto",
          max_tokens: 300
        })
      });
      
      if (!res.ok) {
        speak("Sistemle bağlantı kuramıyorum.");
        setIsProcessing(false);
        return;
      }
      
      const data = await res.json();
      const msg = data.choices[0].message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        let finalResponseText = '';
        for (const tc of msg.tool_calls) {
          const funcName = tc.function.name;
          const args = JSON.parse(tc.function.arguments);
          
          if (funcName === 'setDarkMode') {
             osApi.setDarkMode(args.enable);
             finalResponseText += args.enable ? "Karanlık moda geçildi. " : "Aydınlık moda geçildi. ";
          } else if (funcName === 'setVolume') {
             osApi.setVolume(args.level);
             finalResponseText += `Ses seviyesi %${args.level} yapıldı. `;
          } else if (funcName === 'setBrightness') {
             osApi.setBrightness(args.level);
             finalResponseText += `Parlaklık %${args.level} olarak ayarlandı. `;
          } else if (funcName === 'openApp') {
             setTimeout(() => osApi.openApp(args.appId), 1500);
             finalResponseText += `Hemen açıyorum. `;
          } else if (funcName === 'sendLastPhotoToUser') {
             setResponse('Fotoğraf gönderiliyor...');
             const sendRes = await osApi.sendLastPhotoToUser(args.username, args.messageText);
             finalResponseText += sendRes.message + " ";
          } else if (funcName === 'makePhoneCall') {
             setResponse('Arama başlatılıyor...');
             const callRes = osApi.makePhoneCall(args.targetName);
             finalResponseText += callRes.message + " ";
          }
        }
        
        speak(finalResponseText.trim() || "İşlemi tamamladım.");
      } else {
        if (msg.content) speak(msg.content);
        else speak("Bunu tam anlayamadım.");
      }
    } catch (err) {
      console.error(err);
      speak("İnternet bağlantınızda bir sorun var sanırım.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => {
    if (!textInput.trim() || isProcessing) return;
    playClick();
    setTranscript(textInput);
    processCommand(textInput);
    setTextInput('');
  };

  const bg = 'linear-gradient(180deg, #1c1c1e, #050505)';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '60px 20px 40px', fontFamily: '-apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.8 }}>
        <Bot size={36} color="#af52de" style={{ marginBottom: 10 }} />
        <span style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '2px', color: '#af52de' }}>TUZLUCA AI</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={response || transcript}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ fontSize: '26px', fontWeight: '700', textAlign: 'center', marginBottom: 50, lineHeight: 1.4, textShadow: '0 2px 10px rgba(0,0,0,0.5)', padding: '0 10px' }}
          >
            {response}
          </motion.div>
        </AnimatePresence>

        <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={{ 
              scale: isProcessing ? [1, 1.4, 1] : (isSpeaking ? [1, 1.2, 1] : 1),
              opacity: isProcessing ? 0.9 : (isSpeaking ? 0.7 : 0.2),
              rotate: isProcessing ? 360 : 0
            }}
            transition={{ 
              duration: isProcessing ? 0.8 : (isSpeaking ? 1.2 : 2), 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(175,82,222,0.8) 0%, rgba(94,92,230,0) 70%)',
              filter: 'blur(15px)'
            }}
          />
          <motion.div
            animate={{ scale: isSpeaking ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #af52de, #5e5ce6)',
              boxShadow: '0 0 40px rgba(175,82,222,0.6), inset 0 0 20px rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10
            }}
          >
            <Sparkles size={40} color="white" opacity={0.8} />
          </motion.div>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', marginBottom: 20, display: 'flex', gap: 10, position: 'relative' }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={isProcessing}
            placeholder={isProcessing ? "Yapay zeka düşünüyor..." : "Mesajınızı yazın..."}
            style={{
              flex: 1, padding: '16px 24px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '16px',
              outline: 'none', backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              opacity: isProcessing ? 0.5 : 1,
              transition: 'all 0.3s'
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={isProcessing || !textInput.trim()}
            style={{
              width: 54, height: 54, borderRadius: '50%', border: 'none',
              background: textInput.trim() && !isProcessing ? '#af52de' : 'rgba(255,255,255,0.1)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: textInput.trim() && !isProcessing ? 'pointer' : 'default',
              boxShadow: textInput.trim() && !isProcessing ? '0 4px 15px rgba(175,82,222,0.4)' : 'none',
              transition: 'all 0.3s'
            }}
          >
            <Send size={20} style={{ marginLeft: 2 }} />
          </motion.button>
        </div>
        
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
          Yapay Zeka Sesli Yanıt Sistemi Aktif
        </div>
      </div>
    </div>
  );
}
