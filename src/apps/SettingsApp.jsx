import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { ChevronLeft, ChevronRight, Lock, Palette, Moon, Volume2, VolumeX, BellOff, Bell, Check, UserCircle, Shield, Smartphone, Power, Sun } from 'lucide-react';
import { playClick } from '../audio';
import { RINGTONES, TEXT_TONES, playRingtone, playTextTone } from '../audio';

export default function SettingsApp({ myProfile, pin, setPin, wallpaper, setWallpaper, ringtone, setRingtone, textTone, setTextTone, volume, setVolume, isMuted, setIsMuted, isDark, setIsDark, brightness, setBrightness, WALLPAPERS, wpBg }) {
  const [view, setView] = useState('main'); // main, profile, sounds, wallpapers, pin
  const [tempPin, setTempPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(0);
  const [bio, setBio] = useState(myProfile?.bio || '');
  const [savingBio, setSavingBio] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const [localBrightness, setLocalBrightness] = useState(brightness || 100);
  const [autoLaunch, setAutoLaunch] = useState(false);

  React.useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  React.useEffect(() => {
    setLocalBrightness(brightness);
  }, [brightness]);

  React.useEffect(() => {
    if (window.electronAPI?.getLoginSettings) {
      window.electronAPI.getLoginSettings().then(v => setAutoLaunch(v)).catch(console.error);
    }
  }, []);

  // Stop ringtone when leaving the sounds view or closing settings
  React.useEffect(() => {
    return () => {
      playRingtone(null, true);
    };
  }, [view]);

  const dark = { bg: '#000000', card: '#1c1c1e', text: 'white', sub: '#8e8e93', border: '#38383a', rowActive: '#2c2c2e' };
  const light = { bg: '#f2f2f7', card: '#ffffff', text: '#000000', sub: '#8e8e93', border: '#c6c6c8', rowActive: '#e5e5ea' };
  const c = isDark ? dark : light;

  const Row = ({ iconBg, icon, label, right, onClick, danger }) => (
    <motion.div whileTap={{ backgroundColor: c.rowActive }} onClick={() => { if(onClick){ playClick(); onClick(); } }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', backgroundColor: c.card, borderBottom: `0.5px solid ${c.border}`, cursor: onClick ? 'pointer' : 'default' }}>
      {icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg || '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>}
      <span style={{ flex: 1, fontSize: 17, color: danger ? '#FF3B30' : c.text }}>{label}</span>
      {right}
    </motion.div>
  );

  const Toggle = ({ on, onChange }) => (
    <motion.div onClick={(e) => { e.stopPropagation(); playClick(); onChange(!on); }} animate={{ backgroundColor: on ? '#34C759' : c.border }}
      style={{ width: 51, height: 31, borderRadius: 16, padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <motion.div animate={{ x: on ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ width: 27, height: 27, borderRadius: '50%', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
    </motion.div>
  );

  const GroupTitle = ({ text }) => <div style={{ padding: '24px 16px 6px', fontSize: 13, color: c.sub, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{text}</div>;

  const NavBar = ({ title, onBack }) => (
    <div style={{ padding: '55px 16px 12px', borderBottom: `0.5px solid ${c.border}`, backgroundColor: c.bg, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => { playClick(); playRingtone(null, true); onBack(); }}
        style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'absolute', left: 8 }}>
        <ChevronLeft size={22} /> Geri
      </motion.button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 600, color: c.text }}>{title}</div>
    </div>
  );

  // ── SOUNDS VIEW ─────────────────────────────────────────────────────────
  if (view === 'sounds') return (
    <div style={{ width: '100%', height: '100%', backgroundColor: c.bg, position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column' }}>
      <NavBar title="Ses ve Dokunuş" onBack={() => setView('main')} />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        
        <GroupTitle text="Zil Sesi ve Uyarılar" />
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: `0.5px solid ${c.border}` }}>
            <VolumeX size={16} color={c.sub} />
            <input type="range" min="0" max="100" value={localVolume} 
              onChange={e => setLocalVolume(Number(e.target.value))} 
              onMouseUp={() => { setVolume(localVolume); localStorage.setItem('phoneVolume', localVolume); }}
              onTouchEnd={() => { setVolume(localVolume); localStorage.setItem('phoneVolume', localVolume); }}
              style={{ flex: 1, accentColor: '#007AFF' }} />
            <Volume2 size={16} color={c.sub} />
          </div>
          <Row icon={<BellOff size={16} color="white" />} iconBg="#FF3B30" label="Sessiz Modu" right={<Toggle on={isMuted} onChange={setIsMuted} />} />
        </div>

        <GroupTitle text="Sesler ve Titreşim Dokunuşları" />
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          
          <div style={{ padding: '12px 16px', backgroundColor: c.rowActive, color: c.sub, fontSize: 14, fontWeight: 600 }}>ZİL SESİ</div>
          {RINGTONES.map(rt => (
            <Row key={rt.id} label={rt.name} onClick={() => { 
              setRingtone(rt.id); 
              localStorage.setItem('phoneRingtone', rt.id);
              playRingtone(rt.id); 
            }} 
            right={ringtone === rt.id ? <Check size={18} color="#007AFF" /> : null} />
          ))}

          <div style={{ padding: '12px 16px', backgroundColor: c.rowActive, color: c.sub, fontSize: 14, fontWeight: 600 }}>MESAJ SESİ</div>
          {TEXT_TONES.map(tt => (
            <Row key={tt.id} label={tt.name} onClick={() => { 
              setTextTone(tt.id); 
              localStorage.setItem('phoneTextTone', tt.id);
              playTextTone(tt.id); 
            }} 
            right={textTone === tt.id ? <Check size={18} color="#007AFF" /> : null} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── DISPLAY & BRIGHTNESS VIEW ────────────────────────────────────────────
  if (view === 'display') return (
    <div style={{ width: '100%', height: '100%', backgroundColor: c.bg, position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column' }}>
      <NavBar title="Ekran ve Parlaklık" onBack={() => setView('main')} />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        
        <GroupTitle text="Görünüm" />
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <Row icon={<Moon size={16} color="white" />} iconBg="#000000" label="Karanlık Mod" right={<Toggle on={isDark} onChange={v => { setIsDark(v); localStorage.setItem('phoneDarkMode', v ? '1' : ''); }} />} />
        </div>

        <GroupTitle text="Parlaklık" />
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderBottom: `0.5px solid ${c.border}` }}>
            <Sun size={16} color={c.sub} />
            <input type="range" min="20" max="100" value={localBrightness} 
              onChange={e => { setLocalBrightness(Number(e.target.value)); setBrightness(Number(e.target.value)); }} 
              style={{ flex: 1, accentColor: '#007AFF' }} />
            <Sun size={24} color={c.sub} />
          </div>
        </div>

      </div>
    </div>
  );

  // ── WALLPAPERS VIEW ──────────────────────────────────────────────────────
  if (view === 'wallpapers') return (
    <div style={{ width: '100%', height: '100%', backgroundColor: c.bg, position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column' }}>
      <NavBar title="Duvar Kağıtları" onBack={() => setView('main')} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {WALLPAPERS.map((wp, i) => {
            const isActive = JSON.stringify(wallpaper) === JSON.stringify(wp);
            return (
              <motion.div key={i} whileTap={{ scale: 0.94 }} onClick={() => { playClick(); setWallpaper(wp); localStorage.setItem('phoneWallpaper', JSON.stringify(wp)); }}
                style={{ height: 220, borderRadius: 20, background: wpBg(wp), cursor: 'pointer', border: isActive ? '3px solid #007AFF' : '3px solid transparent', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.6))', padding: '30px 8px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{wp.name}</span>
                </div>
                {isActive && <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} color="white" strokeWidth={3} /></div>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── PROFILE VIEW ─────────────────────────────────────────────────────────
  if (view === 'profile') return (
    <div style={{ width: '100%', height: '100%', backgroundColor: c.bg, position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column' }}>
      <NavBar title="Apple Kimliği" onBack={() => setView('main')} />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: myProfile?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'white', fontWeight: 700, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            {(myProfile?.display_name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: c.text }}>{myProfile?.display_name || 'Kullanıcı'}</div>
          <div style={{ fontSize: 15, color: c.sub, marginTop: 4 }}>@{myProfile?.username}</div>
        </div>

        <GroupTitle text="Kişisel Bilgiler" />
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <Row label="Telefon Numarası" right={<span style={{ color: c.sub }}>{myProfile?.phone_number}</span>} />
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: c.sub, marginBottom: 6, fontWeight: 500 }}>Biyografi</div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Kendinizi tanıtın..."
              style={{ width: '100%', background: 'none', border: 'none', color: c.text, fontSize: 16, outline: 'none', resize: 'none', fontFamily: 'inherit', minHeight: 60 }} />
            <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { playClick(); setSavingBio(true); await supabase.from('profiles').update({ bio }).eq('id', myProfile?.id); setSavingBio(false); }}
              style={{ background: '#007AFF', border: 'none', borderRadius: 8, padding: '10px 18px', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 10, width: '100%' }}>
              {savingBio ? 'Kaydediliyor...' : 'Kaydet'}
            </motion.button>
          </div>
        </div>

        <GroupTitle text="Giriş ve Güvenlik" />
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <Row label="Hesabı Çıkış Yap" danger onClick={async () => {
            playClick();
            if (window.confirm('Çıkış yapılacak. Emin misiniz?')) {
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.reload();
            }
          }} />
        </div>
      </div>
    </div>
  );

  // ── PIN VIEW ────────────────────────────────────────────────────────────
  if (view === 'pin') {
    const letters = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ' };
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: c.bg, position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column' }}>
        <NavBar title="Parola" onBack={() => { setView('main'); setPinStep(0); setTempPin(''); setConfirmPin(''); }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: c.text, marginBottom: 6 }}>{pinStep === 0 ? 'Yeni Parola' : 'Doğrulayın'}</h2>
          <div style={{ display: 'flex', gap: 20, margin: '20px 0 40px' }}>
            {[0, 1, 2, 3].map(i => { const v = pinStep === 0 ? tempPin : confirmPin; return <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${c.text}`, background: v.length > i ? c.text : 'transparent', transition: 'background 0.1s' }} />; })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((k, i) => {
              if (k === null) return <div key={i} />;
              return (
                <motion.button key={i} whileTap={{ scale: 0.88, backgroundColor: isDark ? '#444' : '#c6c6c8' }}
                  onClick={() => {
                    playClick();
                    if (k === 'del') { pinStep === 0 ? setTempPin(p => p.slice(0, -1)) : setConfirmPin(p => p.slice(0, -1)); return; }
                    if (pinStep === 0) { const np = tempPin.length < 4 ? tempPin + k : tempPin; setTempPin(np); if (np.length === 4) setTimeout(() => setPinStep(1), 300); }
                    else { const nc = confirmPin.length < 4 ? confirmPin + k : confirmPin; setConfirmPin(nc); if (nc.length === 4) { if (nc === tempPin) { setPin(tempPin); localStorage.setItem('phonePin', tempPin); alert('PIN oluşturuldu!'); setView('main'); } else { alert('Parola eşleşmedi!'); setTempPin(''); setConfirmPin(''); setPinStep(0); } } }
                  }}
                  style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', background: isDark ? '#2c2c2e' : '#e5e5ea', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {k === 'del' ? <span style={{ fontSize: 18, color: c.text }}>Sil</span> : <>
                    <span style={{ fontSize: 32, fontWeight: 400, color: c.text, lineHeight: 1.1 }}>{k}</span>
                    {letters[k] && <span style={{ fontSize: 10, color: c.sub, letterSpacing: '1px', fontWeight: 600 }}>{letters[k]}</span>}
                  </>}
                </motion.button>
              );
            })}
          </div>
          {pin && <button onClick={() => { setPin(''); localStorage.removeItem('phonePin'); setView('main'); }} style={{ marginTop: 40, background: 'none', border: 'none', color: '#FF3B30', fontSize: 17, cursor: 'pointer' }}>Parolayı Kapat</button>}
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ───────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: c.bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      <div style={{ padding: '60px 16px 16px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.5px' }}>Ayarlar</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        
        {/* Apple ID Card */}
        <motion.div whileTap={{ scale: 0.98 }} onClick={() => { playClick(); setView('profile'); }}
          style={{ margin: '0 16px 24px', backgroundColor: c.card, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: myProfile?.avatar_color || '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 600 }}>
            {(myProfile?.display_name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: c.text }}>{myProfile?.display_name || 'Kullanıcı'}</div>
            <div style={{ fontSize: 14, color: c.sub, marginTop: 4 }}>Apple Kimliği, iCloud+, Medya</div>
          </div>
          <ChevronRight size={20} color={c.sub} />
        </motion.div>

        {/* First Section */}
        <div style={{ margin: '0 16px 24px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <Row icon={<Volume2 size={16} color="white" />} iconBg="#FF3B30" label="Ses ve Dokunuş" onClick={() => setView('sounds')} right={<ChevronRight size={20} color={c.sub} />} />
          <Row icon={<Sun size={16} color="white" />} iconBg="#007AFF" label="Ekran ve Parlaklık" onClick={() => setView('display')} right={<ChevronRight size={20} color={c.sub} />} />
          <Row icon={<Palette size={16} color="white" />} iconBg="linear-gradient(135deg, #007AFF, #5AC8FA)" label="Duvar Kağıdı" onClick={() => setView('wallpapers')} right={<ChevronRight size={20} color={c.sub} />} />
        </div>

        {/* Second Section */}
        <div style={{ margin: '0 16px 24px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <Row icon={<Shield size={16} color="white" />} iconBg="#34C759" label="Face ID ve Parola" onClick={() => setView('pin')} right={<><span style={{ color: c.sub, fontSize: 15 }}>{pin ? 'Açık' : 'Kapalı'}</span><ChevronRight size={20} color={c.sub} /></>} />
        </div>

        {/* Third Section */}
        <div style={{ margin: '0 16px 24px', borderRadius: 12, overflow: 'hidden', backgroundColor: c.card }}>
          <Row icon={<Power size={16} color="white" />} iconBg="#FF9500" label="Windows Başlarken Çalıştır" right={<Toggle on={autoLaunch} onChange={(v) => { setAutoLaunch(v); window.electronAPI?.setLoginSettings(v); }} />} />
        </div>
      </div>
    </div>
  );
}
