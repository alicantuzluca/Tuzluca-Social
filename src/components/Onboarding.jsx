import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AVATAR_COLORS = [
  '#FF3B30','#FF9500','#FFCC00','#34C759',
  '#5AC8FA','#007AFF','#5856D6','#AF52DE',
];

// ── iOS-style Hello screen animation ─────────────────────────────────────
const HELLO_WORDS = ['Merhaba','Hello','Bonjour','Hola','Ciao','こんにちは','안녕하세요','Привет','مرحبا','Hallo'];

function HelloScreen({ onNext }) {
  const [idx, setIdx] = useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HELLO_WORDS.length), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width:'100%', height:'100%', background:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'0 0 15px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-20 }}
            transition={{ duration:0.35 }}
            style={{ fontSize:72, fontWeight:700, color:'#1c1c1e', textAlign:'center', letterSpacing:'-2px' }}>
            {HELLO_WORDS[idx]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ width:'100%', padding:'0 30px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        <p style={{ textAlign:'center', color:'#6c6c70', fontSize:15, margin:'0 0 4px', lineHeight:1.5 }}>
          Tuzluca Social Phone'u kullanmaya başlamak için yukarı kaydırın.
        </p>
        <motion.div
          drag="y"
          dragConstraints={{ top: -200, bottom: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.y < -60) onNext();
          }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '10px 20px 20px' }}
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <div style={{ fontSize: 16, color: '#1c1c1e', fontWeight: 500, opacity: 0.8 }}>Açmak için yukarı kaydırın</div>
          <div style={{ width: 40, height: 5, background: '#1c1c1e', borderRadius: 3, marginTop: 8, opacity: 0.8 }} />
        </motion.div>
      </div>
    </div>
  );
}

// ── Combined Hello & Language Screen ─────────────────────────────────────
const LANGUAGES = [
  { id:'tr', native:'Türkçe' },
  { id:'en', native:'English' },
  { id:'th', native:'ไทย' },
  { id:'ar', native:'عربي' },
  { id:'ru', native:'Русский' },
  { id:'cs', native:'Czech' },
  { id:'sv', native:'Svenska' },
  { id:'pl', native:'Polski' },
  { id:'hu', native:'Magyar' },
];

function LanguageScreen({ onSelect }) {
  return (
    <div style={{ width:'100%', height:'100%', background:'white', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', overflow:'hidden' }}>
      {/* Header section */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop: 80, paddingBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#000', margin: '0 0 40px', letterSpacing: '-0.5px' }}>Hello</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8e8e93', marginBottom: 4 }}>
          <Globe size={18} strokeWidth={2} />
          <span style={{ fontSize: 15, fontWeight: 500 }}>Select your language</span>
        </div>
      </div>

      {/* Language List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LANGUAGES.map((l) => (
            <motion.div key={l.id} whileTap={{ backgroundColor: '#e5e5ea' }} onClick={() => onSelect(l.id === 'tr' ? 'tr' : 'en')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f2f2f7', borderRadius: 12, cursor: 'pointer', transition: 'background 0.1s' }}>
              <span style={{ fontSize: 17, color: '#000', fontWeight: 500, letterSpacing: '-0.3px' }}>{l.native}</span>
              <ChevronRight size={18} color="#c6c6c8" strokeWidth={2.5} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Color picker grid ─────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14 }}>
      {AVATAR_COLORS.map(c => (
        <motion.div key={c} whileTap={{ scale:0.85 }} onClick={() => onChange(c)}
          style={{ width:'100%', aspectRatio:'1', borderRadius:'50%', background:c, cursor:'pointer', border: value===c ? '3px solid white' : '3px solid transparent', outline: value===c ? `3px solid ${c}` : 'none', outlineOffset:2, transition:'outline 0.15s' }} />
      ))}
    </div>
  );
}

// ── Steps config ──────────────────────────────────────────────────────────
const STEPS = ['hello','language','invite','name','avatar','confirm'];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState('hello');
  const [language, setLanguage] = useState('tr');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[5]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const T = {
    tr: {
      langTitle:'Dil', langSub:'Kullanmak istediğiniz dili seçin.',
      inviteTitle:'Davet Kodu', inviteSub:'Bu uygulama sadece davetliler içindir. Lütfen size verilen davet kodunu girin.',
      inviteLabel:'Davet Kodu', invitePlaceholder:'KOD GİRİN',
      nameTitle:'Adınız', nameSub:'Diğer kullanıcılar sizi bu isimle tanıyacak.',
      userLabel:'Kullanıcı Adı', dispLabel:'Görünen Ad',
      userPlaceholder:'ornek_kullanici', dispPlaceholder:'Adınız Soyadınız',
      avatarTitle:'Profil Rengi', avatarSub:'Avatarınız için bir renk seçin.',
      confirmTitle:'Özet', confirmSub:'Bilgilerinizi kontrol edin.',
      next:'Devam', finish:'Hesabı Oluştur', back:'Geri',
      creating:'Oluşturuluyor...',
      errShort:'En az 3 karakter gerekli.',
      errChars:'Sadece harf, rakam ve _ kullanın.',
    },
    en: {
      langTitle:'Language', langSub:'Choose your preferred language.',
      inviteTitle:'Invite Code', inviteSub:'This app is invite-only. Please enter your invite code.',
      inviteLabel:'Invite Code', invitePlaceholder:'ENTER CODE',
      nameTitle:'Your Name', nameSub:'Other users will recognize you by this name.',
      userLabel:'Username', dispLabel:'Display Name',
      userPlaceholder:'example_user', dispPlaceholder:'First Last',
      avatarTitle:'Profile Color', avatarSub:'Choose a color for your avatar.',
      confirmTitle:'Summary', confirmSub:'Check your information.',
      next:'Continue', finish:'Create Account', back:'Back',
      creating:'Creating...',
      errShort:'Minimum 3 characters required.',
      errChars:'Use only letters, numbers and _.',
    },
  }[language] || {};

  const idx = STEPS.indexOf(step);
  const canNext = () => {
    if (step === 'invite') return inviteCode.trim().toUpperCase() === 'TUZLUCA2026';
    if (step === 'name') return username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());
    return true;
  };

  const goNext = () => { setError(''); setStep(STEPS[idx + 1]); };
  const goBack = () => { setError(''); setStep(STEPS[idx - 1]); };

  const finish = async () => {
    setLoading(true); setError('');
    try {
      let phone = '05' + Math.floor(Math.random() * 1e8).toString().padStart(8, '0');
      if (username.toLowerCase().trim() === 'seyznr') {
        phone = '6161616161';
      }

      // Anonim oturum — email rate limit yok, onay gerekmez
      const { data: authData, error: authErr } = await supabase.auth.signInAnonymously();
      if (authErr) throw new Error('Oturum açılamadı: ' + authErr.message);
      const userId = authData.user?.id;
      if (!userId) throw new Error('Kullanıcı oluşturulamadı.');

      const { data: rpcData, error: profErr } = await supabase.rpc('register_profile', {
        p_user_id: userId,
        p_username: username.toLowerCase().trim(),
        p_display_name: displayName.trim() || username.trim(),
        p_phone: phone,
        p_avatar: avatarColor,
        p_theme: 'dark',
        p_language: language,
        p_invite_code: inviteCode.trim().toUpperCase()
      });

      if (profErr) {
        if (profErr.code === '23505') { setError('Bu kullanıcı adı zaten alınmış!'); setStep('name'); setLoading(false); return; }
        throw profErr;
      }

      localStorage.setItem('phoneDarkMode', '1');
      localStorage.setItem('phoneLanguage', language);
      localStorage.setItem('myPhoneNumber', phone);
      localStorage.setItem('myUsername', username.toLowerCase().trim());
      localStorage.setItem('onboardingDone', '1');

      const { data: profile } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase().trim()).maybeSingle();
      onComplete(profile || { username: username.toLowerCase().trim(), display_name: displayName.trim() || username.trim(), phone_number: phone, avatar_color: avatarColor });
    } catch (e) {
      setError(e.message || 'Bir hata oluştu.');
    }
    setLoading(false);
  };

  const isConfirm = step === 'confirm';
  const showBack = idx > 1;

  // ── Hello / Language screen ─────────────────────────────────────────────
  if (step === 'hello') return (
    <AnimatePresence mode="wait">
      <motion.div key="hello" exit={{ opacity: 0, y: -50, scale: 0.95 }} transition={{ duration: 0.4 }} style={{ width:'100%', height:'100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
        <HelloScreen onNext={() => setStep('language')} />
      </motion.div>
    </AnimatePresence>
  );

  if (step === 'language') return (
    <AnimatePresence mode="wait">
      <motion.div key="lang" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.35, type: 'spring', damping: 26, stiffness: 300 }} style={{ width:'100%', height:'100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
        <LanguageScreen onSelect={(lang) => { setLanguage(lang); setStep('invite'); }} />
      </motion.div>
    </AnimatePresence>
  );

  // ── Step screens ────────────────────────────────────────────────────────
  const titles = { invite: T.inviteTitle, name: T.nameTitle, avatar: T.avatarTitle, confirm: T.confirmTitle };
  const subs   = { invite: T.inviteSub, name: T.nameSub,   avatar: T.avatarSub,   confirm: T.confirmSub   };

  return (
    <div style={{ width:'100%', height:'100%', background:'#f2f2f7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', overflow:'hidden' }}>
      {/* iOS-style navigation bar */}
      <div style={{ padding:'55px 20px 0', background:'#f2f2f7' }}>
        {showBack && (
          <button onClick={goBack} style={{ background:'none', border:'none', color:'#007AFF', fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:'4px 0', fontFamily:'inherit' }}>
            <span style={{ fontSize:22, lineHeight:1 }}>‹</span> {T.back}
          </button>
        )}
      </div>

      {/* Title block */}
      <div style={{ padding: showBack ? '20px 30px 28px' : '30px 30px 28px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} transition={{ duration:0.35, type: 'spring', damping: 25, stiffness: 300 }}>
            <h1 style={{ fontSize:34, fontWeight:700, color:'#1c1c1e', margin:'0 0 10px', letterSpacing:'-0.5px' }}>{titles[step]}</h1>
            <p style={{ fontSize:15, color:'#6c6c70', margin:0, lineHeight:1.5 }}>{subs[step]}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:'0 20px', overflowY:'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0, y:0 }} exit={{ opacity:0, x:-40 }} transition={{ duration:0.35, type: 'spring', damping: 28, stiffness: 300 }}>

            {step === 'invite' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ background:'white', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'4px 16px 4px', background:'white' }}>
                    <label style={{ fontSize:12, color:'#6c6c70', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>{T.inviteLabel}</label>
                    <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder={T.invitePlaceholder} maxLength={20} autoFocus
                      style={{ display:'block', width:'100%', padding:'6px 0 10px', background:'none', border:'none', fontSize:22, color:'#1c1c1e', outline:'none', fontFamily:'inherit', boxSizing:'border-box', letterSpacing:'2px', fontWeight:600 }} />
                  </div>
                </div>
              </div>
            )}

            {step === 'name' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ background:'white', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'4px 16px 4px', background:'white' }}>
                    <label style={{ fontSize:12, color:'#6c6c70', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>{T.userLabel}</label>
                    <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g,''))} placeholder={T.userPlaceholder} maxLength={20} autoFocus
                      style={{ display:'block', width:'100%', padding:'6px 0 10px', background:'none', border:'none', fontSize:17, color:'#1c1c1e', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                  </div>
                </div>
                {username.length > 0 && username.length < 3 && <p style={{ fontSize:13, color:'#FF3B30', margin:0, paddingLeft:4 }}>{T.errShort}</p>}
                {username.length >= 3 && <p style={{ fontSize:13, color:'#34C759', margin:0, paddingLeft:4 }}>✓ @{username}</p>}

                <div style={{ background:'white', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'4px 16px 4px', background:'white' }}>
                    <label style={{ fontSize:12, color:'#6c6c70', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>{T.dispLabel}</label>
                    <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={T.dispPlaceholder} maxLength={30}
                      style={{ display:'block', width:'100%', padding:'6px 0 10px', background:'none', border:'none', fontSize:17, color:'#1c1c1e', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {step === 'avatar' && (
              <div style={{ background:'white', borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:20 }}>
                {/* Preview */}
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <motion.div animate={{ scale:[1,1.04,1] }} transition={{ repeat:Infinity, duration:2 }}
                    style={{ width:88, height:88, borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, color:'white', fontWeight:700, boxShadow:`0 8px 30px ${avatarColor}60` }}>
                    {(displayName || username || '?').charAt(0).toUpperCase()}
                  </motion.div>
                </div>
                <ColorPicker value={avatarColor} onChange={setAvatarColor} />
              </div>
            )}

            {step === 'confirm' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* Profile card */}
                <div style={{ background:'white', borderRadius:16, padding:'16px 20px', display:'flex', gap:16, alignItems:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'white', fontWeight:700, flexShrink:0 }}>
                    {(displayName || username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:600, color:'#1c1c1e' }}>{displayName || username}</div>
                    <div style={{ fontSize:14, color:'#6c6c70', marginTop:2 }}>@{username}</div>
                  </div>
                </div>
                {/* Info rows */}
                <div style={{ background:'white', borderRadius:12, overflow:'hidden' }}>
                  {[
                    { label:'Kullanıcı Adı', value:`@${username}` },
                    { label:'Dil', value: language === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English' },
                    { label:'Tema', value:'🌙 Karanlık' },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 16px', borderBottom: i < arr.length-1 ? '0.5px solid #c6c6c8' : 'none' }}>
                      <span style={{ fontSize:16, color:'#1c1c1e' }}>{row.label}</span>
                      <span style={{ fontSize:16, color:'#6c6c70' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                {error && (
                  <div style={{ background:'#FFF2F2', borderRadius:12, padding:'12px 16px', border:'1px solid #FFCDD2' }}>
                    <p style={{ color:'#FF3B30', fontSize:14, margin:0 }}>⚠️ {error}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div style={{ padding:'16px 20px 40px', background:'#f2f2f7' }}>
        <motion.button whileTap={{ scale:0.97 }}
          onClick={isConfirm ? finish : goNext}
          disabled={!canNext() || loading}
          style={{ width:'100%', padding:'17px', background: canNext() ? '#007AFF' : '#c7c7cc', border:'none', borderRadius:14, color:'white', fontSize:17, fontWeight:600, cursor: canNext() ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'background 0.2s', opacity: loading ? 0.8 : 1 }}>
          {loading ? T.creating : isConfirm ? T.finish : T.next}
        </motion.button>
      </div>
    </div>
  );
}
