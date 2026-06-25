import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Headphones, Clock, ChevronDown } from 'lucide-react';

const DUMMY_PODCASTS = [
  {
    id: 1,
    title: "Kalbe Dokunan Bir Yolculuk: Allah'a Yakınlaşmanın Huzuru",
    author: "Tuzluca Podcast",
    duration: "Dinle",
    cover: "linear-gradient(135deg, #FF6B6B, #556270)",
    description: "İç huzuru bulmak ve manevi yolculuğa adım atmak için rehber niteliğinde bir bölüm.",
    audioUrl: "./podcast1.mp3"
  },
  {
    id: 2,
    title: "Allah'a Güvenmek (Tevekkül) ve Hayatın Yüklerini Rabbimize Bırakmak",
    author: "Tuzluca Podcast",
    duration: "Dinle",
    cover: "linear-gradient(135deg, #1A2980, #26D0CE)",
    description: "Tevekkülün gücü ve hayatın zorluklarına karşı Allah'a sığınmanın getirdiği ferahlık.",
    audioUrl: "./podcast2.mp3"
  },
  {
    id: 3,
    title: "Dünyaya Misafir Olmak",
    author: "Tuzluca Podcast",
    duration: "Dinle",
    cover: "linear-gradient(135deg, #8A2387, #E94057, #F27121)",
    description: "Bu dünyanın geçiciliği ve ebedi hayata hazırlık üzerine düşünceler.",
    audioUrl: "./podcast3.mp3"
  },
  {
    id: 4,
    title: "Yavaşlamayı Unutan İnsan",
    author: "Tuzluca Podcast",
    duration: "Dinle",
    cover: "linear-gradient(135deg, #43e97b, #38f9d7)",
    description: "Modern hayatın koşturmacası içinde durup dinlenmenin ve ana odaklanmanın önemi.",
    audioUrl: "./podcast4.mp3"
  },
  {
    id: 5,
    title: "Büyüyünce Her Şey Düzelir Sanıyorduk",
    author: "Tuzluca Podcast",
    duration: "Dinle",
    cover: "linear-gradient(135deg, #f093fb, #f5576c)",
    description: "Çocukluk hayalleri, yetişkinliğin gerçekleri ve içsel büyüme üzerine samimi bir sohbet.",
    audioUrl: "./podcast5.mp3"
  }
];

const formatTime = (time) => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const PodcastApp = forwardRef(({ onPodcastStateChange }, ref) => {
  const [activePodcast, setActivePodcast] = useState(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000000' : '#F2F2F7';
  const text = isDark ? '#FFFFFF' : '#000000';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const secondaryText = isDark ? '#8E8E93' : '#8E8E93';

  useEffect(() => {
    if (onPodcastStateChange) {
      onPodcastStateChange({ activePodcast, isPlaying, progress, currentTime, duration });
    }
  }, [activePodcast, isPlaying, progress, currentTime, duration, onPodcastStateChange]);

  useImperativeHandle(ref, () => ({
    togglePlay: () => togglePlay(),
    playNext: () => skip(15), // Skip forward 15s
    playPrev: () => skip(-15), // Skip backward 15s
    seek: (pct) => { if (audioRef.current && duration) audioRef.current.currentTime = pct * duration; }
  }));

  useEffect(() => {
    if (audioRef.current && activePodcast?.audioUrl) {
      if (audioRef.current.src && !audioRef.current.src.endsWith(activePodcast.audioUrl)) {
        audioRef.current.src = activePodcast.audioUrl;
        audioRef.current.load();
      } else if (!audioRef.current.src) {
        audioRef.current.src = activePodcast.audioUrl;
        audioRef.current.load();
      }
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.log('Audio play blocked', e));
        }
      }
    }
  }, [activePodcast, isPlaying]);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!activePodcast) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current?.src && activePodcast.audioUrl !== "") {
        audioRef.current.play().catch(err => console.log(err));
        setIsPlaying(true);
      } else {
        alert('Bu podcast için henüz ses dosyası eklenmedi.');
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(cur);
      setDuration(dur);
      const p = (cur / dur) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
      setProgress((val / duration) * 100);
    }
  };

  const skip = (seconds, e) => {
    if (e) e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const selectPodcast = (pod) => {
    if (activePodcast?.id === pod.id) {
      setIsPlayerExpanded(true);
    } else {
      setActivePodcast(pod);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      setIsPlayerExpanded(true);
      if (audioRef.current) {
        audioRef.current.src = pod.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(e => console.log(e));
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: text, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)} 
      />

      <div style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, paddingLeft: 20, borderBottom: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Headphones color="#A259FF" size={32} /> Podcasts
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, paddingBottom: activePodcast ? 120 : 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 15 }}>Sizin İçin Seçilenler</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {DUMMY_PODCASTS.map(pod => (
            <motion.div 
              key={pod.id}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectPodcast(pod)}
              style={{ background: cardBg, borderRadius: 20, padding: 15, display: 'flex', gap: 15, cursor: 'pointer', boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.5)' : '0 4px 15px rgba(0,0,0,0.05)', border: `1px solid ${isDark ? '#333' : '#eee'}` }}
            >
              <div style={{ width: 80, height: 80, borderRadius: 15, background: pod.cover, flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 12, color: '#A259FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{pod.author}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, lineHeight: 1.2 }}>{pod.title}</div>
                <div style={{ fontSize: 13, color: secondaryText, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} /> {pod.duration}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activePodcast && !isPlayerExpanded && (
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={() => setIsPlayerExpanded(true)}
            style={{ position: 'absolute', bottom: 20, left: 15, right: 15, background: isDark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 24, padding: '15px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: `1px solid ${isDark ? '#444' : '#ddd'}`, zIndex: 50, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: activePodcast.cover, flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{activePodcast.title}</div>
                <div style={{ fontSize: 13, color: secondaryText }}>{activePodcast.author}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <button onClick={togglePlay} style={{ width: 44, height: 44, borderRadius: '50%', background: '#A259FF', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(162,89,255,0.4)' }}>
                  {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: 3 }} />}
                </button>
              </div>
            </div>
            <div style={{ width: '100%', height: 4, background: isDark ? '#444' : '#E5E5EA', borderRadius: 2, marginTop: 15, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#A259FF', borderRadius: 2, transition: 'width 0.1s linear' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePodcast && isPlayerExpanded && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsPlayerExpanded(false);
              }
            }}
            style={{ position: 'absolute', inset: 0, background: isDark ? '#1C1C1E' : '#F2F2F7', zIndex: 100, display: 'flex', flexDirection: 'column', paddingTop: 50, paddingBottom: 40, paddingLeft: 30, paddingRight: 30 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 40 }}>
              <button 
                onClick={() => setIsPlayerExpanded(false)}
                style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: text, cursor: 'pointer', padding: 5 }}
              >
                <ChevronDown size={32} />
              </button>
              <div style={{ fontSize: 14, fontWeight: 700, color: secondaryText, textTransform: 'uppercase', letterSpacing: 1 }}>Oynatılıyor</div>
            </div>

            <motion.div 
              animate={{ scale: isPlaying ? 1 : 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ width: '100%', aspectRatio: '1/1', borderRadius: 20, background: activePodcast.cover, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', marginBottom: 50 }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 30 }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {activePodcast.title}
              </div>
              <div style={{ fontSize: 18, color: '#A259FF', fontWeight: 600 }}>
                {activePodcast.author}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={currentTime || 0} 
                onChange={handleSeek}
                style={{ width: '100%', margin: 0, accentColor: '#A259FF', cursor: 'pointer' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: secondaryText, fontWeight: 500 }}>
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
              <button onClick={(e) => skip(-15, e)} style={{ background: 'transparent', border: 'none', color: text, cursor: 'pointer', padding: 10 }}>
                <SkipBack size={40} />
              </button>
              <button onClick={togglePlay} style={{ width: 80, height: 80, borderRadius: '50%', background: '#A259FF', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 30px rgba(162,89,255,0.4)' }}>
                {isPlaying ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" style={{ marginLeft: 5 }} />}
              </button>
              <button onClick={(e) => skip(15, e)} style={{ background: 'transparent', border: 'none', color: text, cursor: 'pointer', padding: 10 }}>
                <SkipForward size={40} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default PodcastApp;
