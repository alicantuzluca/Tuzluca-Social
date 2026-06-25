import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick } from '../audio';
import { ChevronLeft, Plus, Search, List } from 'lucide-react';
import { idbStorage } from '../storage';

export default function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('09:00');

  useEffect(() => {
    async function loadEvents() {
      const saved = await idbStorage.getItem('calendarEvents');
      if (saved) setEvents(saved);
    }
    loadEvents();
  }, []);

  const saveEvents = async (newEvents) => {
    setEvents(newEvents);
    await idbStorage.setItem('calendarEvents', newEvents);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    let day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Pazartesi = 0
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const prevMonth = () => { playClick(); setCurrentDate(new Date(year, month - 1, 1)); };
  const nextMonth = () => { playClick(); setCurrentDate(new Date(year, month + 1, 1)); };

  const days = [];
  // Önceki ay
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, y: month===0?year-1:year, m: month===0?11:month-1 });
  }
  // Bu ay
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, y: year, m: month });
  }
  // Sonraki ay (42 hücreye tamamla - 6 satır)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false, y: month===11?year+1:year, m: month===11?0:month+1 });
  }

  const dateKey = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const selKey = dateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  const handleAddEvent = () => {
    playClick();
    if (!newEventTitle.trim()) { setIsAdding(false); return; }
    const evs = events[selKey] || [];
    saveEvents({ ...events, [selKey]: [...evs, { id: Date.now(), title: newEventTitle, time: newEventTime }].sort((a,b) => a.time.localeCompare(b.time)) });
    setNewEventTitle('');
    setNewEventTime('09:00');
    setIsAdding(false);
  };

  const handleDeleteEvent = (id) => {
    playClick();
    if(window.confirm("Etkinliği silmek istediğinize emin misiniz?")) {
      const evs = events[selKey].filter(e => e.id !== id);
      saveEvents({ ...events, [selKey]: evs });
    }
  };

  const today = new Date();
  const checkIsToday = (y, m, d) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
  const checkIsSelected = (y, m, d) => d === selectedDate.getDate() && m === selectedDate.getMonth() && y === selectedDate.getFullYear();

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000000' : '#ffffff';
  const textDark = isDark ? '#ffffff' : '#000000';
  const textSub = '#8e8e93';
  const accent = '#FF3B30'; // iOS Calendar red
  const card = isDark ? '#1c1c1e' : '#ffffff';
  const listBg = isDark ? '#000000' : '#ffffff';

  let touchStartX = 0;
  const onTouchStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
  const onTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchEndX - touchStartX > 50) prevMonth();
    if (touchStartX - touchEndX > 50) nextMonth();
  };

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: textDark, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 16px 10px', background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', color: accent, cursor: 'pointer', fontSize: '17px', gap: '2px', fontWeight: '400' }} onClick={prevMonth}>
          <ChevronLeft size={24} style={{ marginLeft: '-8px' }} /> 
          {year}
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <List size={22} color={accent} style={{ cursor: 'pointer' }} onClick={playClick} />
          <Search size={22} color={accent} style={{ cursor: 'pointer' }} onClick={playClick} />
          <Plus size={24} color={accent} style={{ cursor: 'pointer' }} onClick={() => { playClick(); setIsAdding(true); }} />
        </div>
      </div>
      
      {/* Month Title */}
      <h1 style={{ fontSize: '34px', fontWeight: '700', margin: '4px 16px 12px', letterSpacing: '-0.5px' }}>
        {monthNames[month]}
      </h1>

      {/* Weekdays Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: textSub, borderBottom: `0.5px solid ${isDark ? '#333' : '#e5e5ea'}`, paddingBottom: '10px' }}>
        {dayNames.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar Grid */}
      <div 
        onTouchStart={onTouchStart} 
        onTouchEnd={onTouchEnd} 
        style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 0', borderBottom: `0.5px solid ${isDark ? '#333' : '#e5e5ea'}` }}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${year}-${month}`} 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'contents' }}
          >
            {days.map((dItem, i) => {
              const { day: d, isCurrentMonth, y, m } = dItem;
              const key = dateKey(y, m, d);
              const hasEvent = events[key] && events[key].length > 0;
              
              const isTod = checkIsToday(y, m, d);
              const isSel = checkIsSelected(y, m, d);

              let circleBg = 'transparent';
              let circleColor = isCurrentMonth ? textDark : textSub;
              
              if (isTod && isSel) {
                circleBg = accent;
                circleColor = 'white';
              } else if (isTod) {
                circleBg = 'transparent';
                circleColor = accent;
              } else if (isSel) {
                circleBg = isDark ? '#ffffff' : '#000000';
                circleColor = isDark ? '#000000' : '#ffffff';
              }

              return (
                <div key={i} onClick={() => { playClick(); setSelectedDate(new Date(y, m, d)); if(!isCurrentMonth) setCurrentDate(new Date(y, m, 1)); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', height: '44px' }}>
                  <div style={{ 
                    width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: isTod || isSel ? '600' : '400',
                    background: circleBg,
                    color: circleColor,
                    transition: 'background 0.2s, color 0.2s'
                  }}>
                    {d}
                  </div>
                  {hasEvent && (
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSel && !isTod ? (isDark ? '#000' : '#fff') : textSub, marginTop: '2px' }} />
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Events List */}
      <div style={{ flex: 1, background: listBg, overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '20px', fontWeight: '600', color: checkIsToday(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) ? accent : textDark }}>
            {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </span>
        </div>

        <div style={{ padding: '10px 20px 30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(events[selKey] || []).map(ev => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={ev.id} style={{ display: 'flex', alignItems: 'center', background: isDark ? '#1c1c1e' : '#f2f2f7', padding: '14px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: '16px', minWidth: '45px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: textSub }}>{ev.time}</span>
              </div>
              <div style={{ width: '4px', height: '36px', background: ev.id % 3 === 0 ? '#34C759' : ev.id % 2 === 0 ? '#FF9F0A' : '#0A84FF', borderRadius: '4px', marginRight: '14px' }} />
              <div style={{ flex: 1, fontSize: '16px', fontWeight: '500', color: textDark }}>{ev.title}</div>
              <div onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }} style={{ padding: '8px', background: 'rgba(255,59,48,0.1)', color: accent, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginLeft: '10px' }}>
                Sil
              </div>
            </motion.div>
          ))}
          {!(events[selKey] && events[selKey].length > 0) && (
            <div style={{ marginTop: '20px', padding: '30px 20px', fontSize: '16px', color: textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '10px' }}>📅</div>
              Hiç Etkinlik Yok
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal (iOS Sheet Style) */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '90%', zIndex: 100, background: isDark ? '#1c1c1e' : '#f2f2f7', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDark ? '#2c2c2e' : '#ffffff', borderBottom: `0.5px solid ${isDark ? '#333' : '#c6c6c8'}` }}>
                <span onClick={() => { playClick(); setIsAdding(false); }} style={{ color: accent, fontSize: '17px', cursor: 'pointer' }}>İptal</span>
                <span style={{ fontSize: '17px', fontWeight: '600' }}>Yeni Etkinlik</span>
                <span onClick={handleAddEvent} style={{ color: newEventTitle.trim() ? accent : textSub, fontSize: '17px', cursor: 'pointer', fontWeight: '600' }}>Ekle</span>
              </div>
              
              {/* Modal Body */}
              <div style={{ padding: '20px 16px', flex: 1, overflowY: 'auto' }}>
                <div style={{ background: isDark ? '#2c2c2e' : '#ffffff', borderRadius: '10px', overflow: 'hidden' }}>
                  <input 
                    autoFocus 
                    value={newEventTitle} 
                    onChange={(e) => setNewEventTitle(e.target.value)} 
                    placeholder="Başlık" 
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '17px', color: textDark, padding: '16px', borderBottom: `0.5px solid ${isDark ? '#333' : '#e5e5ea'}` }} 
                  />
                  <input 
                    placeholder="Konum veya Görüntülü Arama" 
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '17px', color: textDark, padding: '16px' }} 
                  />
                </div>

                <div style={{ background: isDark ? '#2c2c2e' : '#ffffff', borderRadius: '10px', overflow: 'hidden', marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `0.5px solid ${isDark ? '#333' : '#e5e5ea'}` }}>
                    <span style={{ fontSize: '17px' }}>Tüm Gün</span>
                    <input type="checkbox" style={{ width: '50px', height: '30px', appearance: 'none', background: '#34C759', borderRadius: '15px', position: 'relative' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                    <span style={{ fontSize: '17px' }}>Başlangıç</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: isDark ? '#3a3a3c' : '#e5e5ea', padding: '6px 12px', borderRadius: '6px', fontSize: '15px' }}>Bugün</span>
                      <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} style={{ border: 'none', background: isDark ? '#3a3a3c' : '#e5e5ea', borderRadius: '6px', padding: '6px 12px', color: textDark, fontSize: '15px', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
