import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick } from '../audio';
import { Globe, AlarmClock, Timer, Hourglass, Plus, Trash2 } from 'lucide-react';

const IosSwitch = ({ checked, onChange }) => (
  <div onClick={() => { playClick(); onChange(!checked); }} style={{ width: 51, height: 31, borderRadius: 16, background: checked ? '#34C759' : '#39393d', padding: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', transition: '0.2s', justifyContent: checked ? 'flex-end' : 'flex-start' }}>
    <motion.div layout style={{ width: 27, height: 27, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

const IosModal = ({ isOpen, onClose, title, actionLabel, onAction, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
          onClick={() => { playClick(); onClose(); }}
        />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 101, display: 'flex', flexDirection: 'column', color: 'white', paddingBottom: 30 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '0.5px solid #333' }}>
            <span onClick={() => { playClick(); onClose(); }} style={{ color: '#FF9F0A', fontSize: 17, cursor: 'pointer' }}>Vazgeç</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span>
            <span onClick={() => { playClick(); onAction(); }} style={{ color: '#FF9F0A', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>{actionLabel}</span>
          </div>
          <div style={{ padding: '20px 16px', maxHeight: '50vh', overflowY: 'auto' }}>
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default function ClockApp({ alarms, setAlarms }) {
  const [tab, setTab] = useState('world');
  const bg = '#000';
  const accent = '#FF9F0A';

  // ── Modals State ──
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Alarm');

  // ── World Clock ──
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const worldCities = [
    { name: 'Tokyo', tz: 'Asia/Tokyo', offset: '+6' },
    { name: 'İstanbul', tz: 'Europe/Istanbul', offset: '0' },
    { name: 'Londra', tz: 'Europe/London', offset: '-3' },
    { name: 'New York', tz: 'America/New_York', offset: '-8' }
  ];

  // ── Alarm ──
  const toggleAlarm = (id) => {
    setAlarms(prev => {
      const next = prev.map(a => a.id === id ? { ...a, active: !a.active } : a);
      localStorage.setItem('phoneAlarms', JSON.stringify(next));
      return next;
    });
  };

  const handleAddAlarmSave = () => {
    if (!/^\d{2}:\d{2}$/.test(newAlarmTime)) {
      if (window.showDynamicAlert) window.showDynamicAlert("Geçersiz saat formatı!");
      return;
    }
    setAlarms(prev => {
      const next = [...prev, { id: Date.now(), time: newAlarmTime, label: newAlarmLabel || 'Alarm', active: true }];
      localStorage.setItem('phoneAlarms', JSON.stringify(next));
      return next;
    });
    setShowAddAlarm(false);
  };

  const deleteAlarm = (id) => {
    playClick();
    setAlarms(prev => {
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem('phoneAlarms', JSON.stringify(next));
      return next;
    });
  };

  // ── Stopwatch ──
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState([]);
  const swRef = useRef(null);

  const toggleSw = () => {
    playClick();
    if (swRunning) {
      clearInterval(swRef.current);
      setSwRunning(false);
    } else {
      swRef.current = setInterval(() => setSwTime(t => t + 1), 10);
      setSwRunning(true);
    }
  };

  const handleSwResetOrLap = () => {
    playClick();
    if (swRunning) {
      setSwLaps([swTime, ...swLaps]);
    } else {
      setSwTime(0);
      setSwLaps([]);
    }
  };

  const formatSw = (ticks) => {
    const ms = ticks * 10;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const msec = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${msec.toString().padStart(2, '0')}`;
  };

  let bestLap = -1;
  let worstLap = -1;
  if (swLaps.length > 1) {
    const lapsDiff = [];
    for(let i=0; i<swLaps.length; i++) {
      const prev = i === swLaps.length - 1 ? 0 : swLaps[i+1];
      lapsDiff.push(swLaps[i] - prev);
    }
    const max = Math.max(...lapsDiff);
    const min = Math.min(...lapsDiff);
    worstLap = swLaps[lapsDiff.indexOf(max)];
    bestLap = swLaps[lapsDiff.indexOf(min)];
  }

  // ── Timer ──
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInput, setTimerInput] = useState(300); // 5 mins
  const [timerRemaining, setTimerRemaining] = useState(0);
  const tmRef = useRef(null);

  const toggleTimer = () => {
    playClick();
    if (timerRunning) {
      clearInterval(tmRef.current);
      setTimerRunning(false);
    } else {
      if (timerRemaining === 0) setTimerRemaining(timerInput);
      setTimerRunning(true);
      tmRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(tmRef.current);
            setTimerRunning(false);
            if (window.showDynamicAlert) window.showDynamicAlert('Süre doldu!');
            // Play alarm sound if needed
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetTimer = () => {
    playClick();
    clearInterval(tmRef.current);
    setTimerRunning(false);
    setTimerRemaining(0);
  };

  const formatTimer = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  const progress = timerRemaining > 0 ? timerRemaining / timerInput : 1;

  // Picker Handlers (Simulated)
  const adjustTimer = (amount) => {
    playClick();
    setTimerInput(prev => Math.max(60, prev + amount));
  };

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: 'white', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', position: 'relative' }}>
      
      {/* Modals */}
      <IosModal isOpen={showAddAlarm} onClose={() => setShowAddAlarm(false)} title="Alarm Ekle" actionLabel="Kaydet" onAction={handleAddAlarmSave}>
        <div style={{ background: '#2c2c2e', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 17 }}>Saat</span>
          <input type="time" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 20, outline: 'none' }} />
        </div>
        <div style={{ background: '#2c2c2e', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17 }}>Etiket</span>
          <input type="text" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)} placeholder="Alarm" style={{ background: 'transparent', border: 'none', color: '#8e8e93', fontSize: 17, outline: 'none', textAlign: 'right', width: 150 }} />
        </div>
      </IosModal>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '60px 20px 20px' }}>
        
        {/* WORLD CLOCK */}
        {tab === 'world' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: accent, fontSize: '18px', fontWeight: '500', cursor: 'pointer' }}>Düzenle</span>
              <Plus size={28} color={accent} style={{ cursor: 'pointer' }} onClick={() => { playClick(); if(window.showDynamicAlert) window.showDynamicAlert('Yeni şehir ekleme yakında!'); }} />
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: '700', marginBottom: '20px', letterSpacing: '-0.5px' }}>Dünya Saati</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {worldCities.map((c, i) => {
                const timeStr = now.toLocaleTimeString('tr-TR', { timeZone: c.tz, hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '0.5px solid #333' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '15px', color: '#8e8e93' }}>Bugün, {c.offset}SA</span>
                      <span style={{ fontSize: '28px', fontWeight: '400', letterSpacing: '0.5px' }}>{c.name}</span>
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: '300', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{timeStr}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ALARM */}
        {tab === 'alarm' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: accent, fontSize: '18px', fontWeight: '500', cursor: 'pointer' }}>Düzenle</span>
              <Plus size={28} color={accent} style={{ cursor: 'pointer' }} onClick={() => { playClick(); setShowAddAlarm(true); }} />
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.5px' }}>Alarm</h1>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', padding: '16px 0 8px', display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '0.5px solid #333' }}>
                <span style={{ color: 'white' }}>Uyku | Uyanma</span>
              </div>
              
              {alarms.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid #333', opacity: a.active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div onClick={() => deleteAlarm(a.id)} style={{ cursor: 'pointer', background: 'rgba(255, 69, 58, 0.2)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={20} color="#FF453A" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '56px', fontWeight: '300', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', marginBottom: '-8px' }}>{a.time}</span>
                      <span style={{ fontSize: '15px', fontWeight: '400' }}>{a.label}</span>
                    </div>
                  </div>
                  <IosSwitch checked={a.active} onChange={() => toggleAlarm(a.id)} />
                </div>
              ))}
              {alarms.length === 0 && (
                <div style={{ padding: '20px 0', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Henüz alarm yok</div>
              )}
            </div>
          </div>
        )}

        {/* STOPWATCH */}
        {tab === 'stopwatch' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '84px', fontWeight: '200', fontVariantNumeric: 'tabular-nums', margin: '60px 0', letterSpacing: '-2px' }}>
              {formatSw(swTime)}
            </div>
            
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 10px', marginBottom: '40px' }}>
              <div onClick={handleSwResetOrLap} style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: 'white', fontSize: '16px', fontWeight: '500' }}>
                  {swRunning ? 'Tur' : 'Sıfırla'}
                </div>
              </div>
              <div onClick={toggleSw} style={{ width: '80px', height: '80px', borderRadius: '50%', background: swRunning ? '#330000' : '#003300', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', background: swRunning ? '#330000' : '#003300', color: swRunning ? '#FF453A' : '#32D74B', fontSize: '16px', fontWeight: '500' }}>
                  {swRunning ? 'Durdur' : 'Başlat'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, width: '100%', overflowY: 'auto', borderTop: '0.5px solid #333' }}>
              {swRunning && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid #333', fontSize: '17px', color: 'white' }}>
                  <span>Tur {swLaps.length + 1}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSw(swTime - (swLaps[0] || 0))}</span>
                </div>
              )}
              {swLaps.map((lap, i) => {
                const prev = i === swLaps.length - 1 ? 0 : swLaps[i+1];
                const diff = lap - prev;
                let color = 'white';
                if (swLaps.length > 1) {
                  if (lap === bestLap) color = '#32D74B';
                  if (lap === worstLap) color = '#FF453A';
                }
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid #333', fontSize: '17px', color: color }}>
                    <span>Tur {swLaps.length - i}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSw(diff)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TIMER */}
        {tab === 'timer' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            
            {timerRemaining > 0 || timerRunning ? (
              <div style={{ position: 'relative', width: '280px', height: '280px', margin: '40px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                  <circle cx="140" cy="140" r="135" fill="none" stroke="#1c1c1e" strokeWidth="8" />
                  <motion.circle cx="140" cy="140" r="135" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeDasharray="848" strokeDashoffset={848 * (1 - progress)} transition={{ duration: 1, ease: 'linear' }} />
                </svg>
                <div style={{ fontSize: '64px', fontWeight: '200', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
                  {formatTimer(timerRemaining)}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '280px', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '40px 0' }}>
                <div style={{ fontSize: '64px', fontWeight: '200', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
                  {formatTimer(timerInput)}
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <button onClick={() => adjustTimer(-60)} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 20, fontSize: 18, cursor: 'pointer' }}>- 1 Dk</button>
                  <button onClick={() => adjustTimer(60)} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 20, fontSize: 18, cursor: 'pointer' }}>+ 1 Dk</button>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 10px', marginBottom: '40px' }}>
              <div onClick={resetTimer} style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px', opacity: timerRunning || timerRemaining > 0 ? 1 : 0.5 }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: 'white', fontSize: '16px', fontWeight: '500' }}>
                  İptal
                </div>
              </div>
              <div onClick={toggleTimer} style={{ width: '80px', height: '80px', borderRadius: '50%', background: timerRunning ? '#330000' : 'rgba(52,199,89,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', background: timerRunning ? '#330000' : 'rgba(52,199,89,0.2)', color: timerRunning ? '#FF453A' : '#32D74B', fontSize: '16px', fontWeight: '500' }}>
                  {timerRunning ? 'Durdur' : 'Başlat'}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{ display: 'flex', height: '83px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid #333', paddingBottom: '20px', zIndex: 10 }}>
        {[
          { id: 'world', icon: <Globe size={24} />, label: 'Dünya Saati' },
          { id: 'alarm', icon: <AlarmClock size={24} />, label: 'Alarm' },
          { id: 'stopwatch', icon: <Timer size={24} />, label: 'Kronometre' },
          { id: 'timer', icon: <Hourglass size={24} />, label: 'Sayaç' }
        ].map(t => (
          <div key={t.id} onClick={() => { playClick(); setTab(t.id); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tab === t.id ? accent : '#8e8e93' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '500' }}>{t.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
