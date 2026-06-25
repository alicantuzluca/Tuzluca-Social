import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, ChevronDown, Heart, Radio, Library, Search, Music, Guitar, Sparkles, Star, Flame } from 'lucide-react';
import { playClick } from '../audio';

const SONGS = [
  { id: 1, title: 'Easy On Me', artist: 'Adele', album: '30', color: '#1a1a2e', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', emoji: <Music size={24} color="white" /> },
  { id: 2, title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", color: '#16213e', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', emoji: <Guitar size={24} color="white" /> },
  { id: 3, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', color: '#0f3460', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', emoji: <Star size={24} color="white" /> },
  { id: 4, title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', color: '#533483', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', emoji: <Sparkles size={24} color="white" /> },
  { id: 5, title: 'Stay', artist: 'Justin Bieber', album: 'Justice', color: '#1a1a2e', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', emoji: <Star size={24} color="white" /> },
  { id: 6, title: 'Bad Habits', artist: 'Ed Sheeran', album: '=', color: '#2d1b69', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', emoji: <Flame size={24} color="white" /> },
];

const RADIOS = [
  { id: 'r1', title: 'PowerTürk', artist: 'Canlı Radyo', album: 'Pop', color: '#E3000F', url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r2', title: 'Power FM', artist: 'Canlı Radyo', album: 'Yabancı Hit', color: '#000000', url: 'https://listen.powerapp.com.tr/powerfm/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r3', title: 'JoyTürk', artist: 'Canlı Radyo', album: 'Türkçe Pop', color: '#9d0208', url: 'https://listen.powerapp.com.tr/joyturk/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r4', title: 'Power Dance', artist: 'Canlı Radyo', album: 'Elektronik', color: '#0055B3', url: 'https://listen.powerapp.com.tr/powerdance/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r5', title: 'Virgin Radio', artist: 'Canlı Radyo', album: 'Yabancı Hit', color: '#d90429', url: 'https://listen.powerapp.com.tr/virginradio/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r6', title: 'JoyTürk Akustik', artist: 'Canlı Radyo', album: 'Akustik', color: '#ff003c', url: 'https://listen.powerapp.com.tr/joyturkakustik/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r7', title: 'Joy FM', artist: 'Canlı Radyo', album: 'Yabancı Slow', color: '#6a040f', url: 'https://listen.powerapp.com.tr/joyfm/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r8', title: 'Power Acoustic', artist: 'Canlı Radyo', album: 'Akustik', color: '#e60000', url: 'https://listen.powerapp.com.tr/poweracoustic/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r9', title: 'Power Pop', artist: 'Canlı Radyo', album: 'Pop', color: '#CC0000', url: 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
  { id: 'r10', title: 'Power Love', artist: 'Canlı Radyo', album: 'Slow', color: '#e63946', url: 'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio', emoji: <Radio size={24} color="white" />, isLive: true },
];

const MusicApp = forwardRef(({ onMusicStateChange }, ref) => {
  const [tab, setTab] = useState('library');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [liked, setLiked] = useState({});
  const [shuffle, setShuffle] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [musicVolume, setMusicVolume] = useState(() => Number(localStorage.getItem('musicVolume') || 0.8));
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
  }

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = musicVolume;
    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0); };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { playNext(); };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => { audio.removeEventListener('timeupdate', onTimeUpdate); audio.removeEventListener('loadedmetadata', onLoadedMetadata); audio.removeEventListener('ended', onEnded); };
  }, [currentSong, musicVolume]);

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setMusicVolume(pct);
    if (audioRef.current) audioRef.current.volume = pct;
    localStorage.setItem('musicVolume', pct);
  };

  useEffect(() => {
    if (onMusicStateChange) {
      onMusicStateChange({ currentSong, isPlaying, progress, currentTime, duration });
    }
  }, [currentSong, isPlaying, progress, currentTime, duration, onMusicStateChange]);

  useImperativeHandle(ref, () => ({
    togglePlay,
    playNext,
    playPrev,
    seek: (pct) => { if (audioRef.current && duration) audioRef.current.currentTime = pct * duration; }
  }));

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const playSong = (song) => {
    playClick();
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    audioRef.current.src = song.url;
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setStreamError(null);
    
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        if (err.name === 'AbortError') return; // Ignore intentional aborts (skipping fast)
        console.error('Playback error:', err);
        setIsPlaying(false);
        setStreamError('Yayın bağlantısı kurulamadı. Lütfen başka bir kanal deneyin.');
        setTimeout(() => setStreamError(null), 3000);
      });
    }
  };

  const togglePlay = () => {
    playClick();
    if (!currentSong) return;
    if (isPlaying) { 
      audioRef.current.pause(); 
      setIsPlaying(false); 
    } else { 
      const playPromise = audioRef.current.play(); 
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name !== 'AbortError') console.warn('Playback prevented:', err);
        });
      }
      setIsPlaying(true); 
    }
  };

  const playNext = () => {
    if (!currentSong) return;
    const idx = SONGS.findIndex(s => s.id === currentSong.id);
    const next = shuffle ? SONGS[Math.floor(Math.random() * SONGS.length)] : SONGS[(idx + 1) % SONGS.length];
    playSong(next);
  };

  const playPrev = () => {
    if (!currentSong) return;
    if (currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const idx = SONGS.findIndex(s => s.id === currentSong.id);
    const prev = SONGS[(idx - 1 + SONGS.length) % SONGS.length];
    playSong(prev);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#f2f2f7', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: currentSong ? '80px' : '10px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'library' && (
              <div style={{ padding: '55px 20px 20px' }}>
                <h1 style={{ fontSize: '34px', fontWeight: '700', color: 'black', margin: '0 0 20px 0' }}>Arşiv</h1>
                <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#8e8e93', marginBottom: '12px' }}>Şarkılar</h2>
                {SONGS.map(song => (
                  <motion.div key={song.id} whileTap={{ backgroundColor: '#e5e5ea' }} onClick={() => { playSong(song); setShowPlayer(true); }} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #c6c6c8', cursor: 'pointer' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', background: `linear-gradient(135deg, ${song.color}, #533483)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{song.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '17px', fontWeight: currentSong?.id === song.id ? '600' : '400', color: currentSong?.id === song.id ? '#FF2D55' : 'black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div style={{ fontSize: '14px', color: '#8e8e93' }}>{song.artist} · {song.album}</div>
                    </div>
                    {currentSong?.id === song.id && isPlaying && <div style={{ color: '#FF2D55', fontSize: '18px' }}>▶</div>}
                    <Heart size={18} fill={liked[song.id] ? '#FF2D55' : 'none'} color={liked[song.id] ? '#FF2D55' : '#c6c6c8'} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={e => { e.stopPropagation(); setLiked(l => ({ ...l, [song.id]: !l[song.id] })); }} />
                  </motion.div>
                ))}
              </div>
            )}
            {tab === 'radio' && (
              <div style={{ padding: '55px 20px 20px' }}>
                <h1 style={{ fontSize: '34px', fontWeight: '700', color: 'black', margin: '0 0 20px 0' }}>Radyo</h1>
                <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#8e8e93', marginBottom: '12px' }}>Canlı İstasyonlar</h2>
                {RADIOS.map(song => (
                  <motion.div key={song.id} whileTap={{ backgroundColor: '#e5e5ea' }} onClick={() => { playSong(song); setShowPlayer(true); }} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #c6c6c8', cursor: 'pointer' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', background: `linear-gradient(135deg, ${song.color}, #000)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{song.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '17px', fontWeight: currentSong?.id === song.id ? '600' : '400', color: currentSong?.id === song.id ? '#FF2D55' : 'black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div style={{ fontSize: '14px', color: '#8e8e93' }}>{song.album}</div>
                    </div>
                    {currentSong?.id === song.id && isPlaying && <div style={{ color: '#FF2D55', fontSize: '18px' }}>▶</div>}
                  </motion.div>
                ))}
              </div>
            )}
            {(tab === 'listen_now' || tab === 'search') && (
              <div style={{ padding: '80px 20px 20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  {tab === 'listen_now' ? <Music size={48} color="#8e8e93" /> : <Search size={48} color="#8e8e93" />}
                </div>
                <h2 style={{ color: 'black', fontWeight: '600' }}>{tab === 'listen_now' ? 'Şimdi Dinle' : 'Ara'}</h2>
                <p style={{ color: '#8e8e93', fontSize: '15px' }}>Yakında</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mini Player */}
      {currentSong && !showPlayer && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} onClick={() => setShowPlayer(true)} style={{ position: 'absolute', bottom: '83px', left: '10px', right: '10px', height: '64px', backgroundColor: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(20px)', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '12px', cursor: 'pointer', zIndex: 50 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: `linear-gradient(135deg, ${currentSong.color}, #533483)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{currentSong.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'black' }}>{currentSong.title}</div>
            <div style={{ fontSize: '12px', color: '#8e8e93' }}>{currentSong.artist}</div>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); togglePlay(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); playNext(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <SkipForward size={22} fill="black" />
          </motion.button>
        </motion.div>
      )}

      {/* Full Player */}
      <AnimatePresence>
        {showPlayer && currentSong && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.35 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(180deg, ${currentSong.color} 0%, #000 100%)`, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
            {/* Top */}
            <div style={{ padding: '50px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowPlayer(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronDown size={22} color="white" />
              </motion.button>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Şimdi Çalıyor</span>
              <div style={{ width: '34px' }} />
            </div>

            {/* Album Art */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 40px 0' }}>
              <motion.div animate={{ scale: isPlaying ? 1 : 0.87 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', background: `linear-gradient(135deg, ${currentSong.color} 0%, #533483 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                {React.cloneElement(currentSong.emoji, { size: 100, color: 'white' })}
              </motion.div>
            </div>

            {/* Info */}
            <div style={{ padding: '30px 30px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>{currentSong.title}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', margin: 0 }}>{currentSong.artist}</p>
              </div>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setLiked(l => ({ ...l, [currentSong.id]: !l[currentSong.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                <Heart size={26} fill={liked[currentSong.id] ? '#FF2D55' : 'none'} color={liked[currentSong.id] ? '#FF2D55' : 'rgba(255,255,255,0.5)'} />
              </motion.button>
              
              {/* Error Toast */}
              <AnimatePresence>
                {streamError && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: -40, left: '10%', right: '10%', background: '#FF3B30', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', textAlign: 'center', zIndex: 10 }}>
                    {streamError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress */}
            <div style={{ padding: '20px 30px 0', opacity: currentSong.isLive ? 0.3 : 1, pointerEvents: currentSong.isLive ? 'none' : 'auto' }}>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '8px', cursor: 'pointer' }} onClick={e => {
                if (currentSong.isLive) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pct * duration;
              }}>
                <div style={{ height: '100%', width: currentSong.isLive ? '100%' : `${progress}%`, background: 'white', borderRadius: '2px', transition: 'width 0.25s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{currentSong.isLive ? 'CANLI YAYIN' : fmt(currentTime)}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{currentSong.isLive ? 'CANLI' : `-${fmt(Math.max(0, duration - currentTime))}`}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ padding: '10px 30px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShuffle(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentSong.isLive ? 0.3 : 1, pointerEvents: currentSong.isLive ? 'none' : 'auto' }}>
                  <Shuffle size={22} color={shuffle ? '#FF2D55' : 'rgba(255,255,255,0.5)'} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={playPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentSong.isLive ? 0.3 : 1, pointerEvents: currentSong.isLive ? 'none' : 'auto' }}>
                  <SkipBack size={38} fill="white" color="white" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay} style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" style={{ marginLeft: '3px' }} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentSong.isLive ? 0.3 : 1, pointerEvents: currentSong.isLive ? 'none' : 'auto' }}>
                  <SkipForward size={38} fill="white" color="white" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Repeat size={22} color="rgba(255,255,255,0.5)" />
                </motion.button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Volume2 size={18} color="rgba(255,255,255,0.4)" />
                <div 
                  style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    handleVolumeChange(e);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1) handleVolumeChange(e);
                  }}
                >
                  <div style={{ width: `${musicVolume * 100}%`, height: '100%', background: 'white', borderRadius: '2px' }} />
                  {/* Slider Knob */}
                  <div style={{ position: 'absolute', top: '50%', left: `${musicVolume * 100}%`, width: '12px', height: '12px', background: 'white', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', transition: 'transform 0.1s' }} />
                </div>
                <Volume2 size={22} color="rgba(255,255,255,0.4)" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <div style={{ height: '83px', backgroundColor: 'rgba(249,249,249,0.94)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid #c6c6c8', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: '10px' }}>
        {[
          { id: 'listen_now', Icon: Play, label: 'Şimdi Dinle' },
          { id: 'radio', Icon: Radio, label: 'Radyo' },
          { id: 'library', Icon: Library, label: 'Arşiv' },
          { id: 'search', Icon: Search, label: 'Ara' }
        ].map(({ id, Icon, label }) => (
          <div key={id} onClick={() => { playClick(); setTab(id); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', minWidth: '60px' }}>
            <Icon size={24} color={tab === id ? '#FF2D55' : '#8e8e93'} />
            <span style={{ fontSize: '10px', color: tab === id ? '#FF2D55' : '#8e8e93', fontWeight: '500' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default MusicApp;
