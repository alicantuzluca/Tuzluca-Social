import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, Compass, Music, Camera, ImageIcon, Globe, Gamepad2, Settings, Wifi, Battery, CloudSun, Map, CalendarDays, Edit, CreditCard, HeartPulse, Clock, Calculator, Lock, Bell, BellOff, Volume2, ChevronLeft, ShoppingBag, Bot, TrendingUp, Languages, Loader2, Signal, Disc, Play, Pause, SkipBack, SkipForward, Palette, Video, PhoneOff, Mic, Headphones, Newspaper, Delete, Mail, Sparkles, Folder } from 'lucide-react';
import Peer from 'peerjs';
import { supabase } from './supabaseClient';
import { playClick, playLock, playTextTone } from './audio';
import { getOfflineQueue, clearOfflineQueue } from './storage';
import Onboarding from './components/Onboarding';
import NotificationCenter from './components/NotificationCenter';
import ControlCenter from './components/ControlCenter';
import PhoneApp from './apps/PhoneApp';
import ShareSheet from './components/ShareSheet';

// ── Lazy Loaded Apps (Tembel Yükleme) ──────────────────────────────────
const SettingsApp = lazy(() => import('./apps/SettingsApp'));
const MessagesApp = lazy(() => import('./apps/MessagesApp'));
const SocialApp   = lazy(() => import('./apps/SocialApp'));
const SafariApp   = lazy(() => import('./apps/SafariApp'));
const MusicApp    = lazy(() => import('./apps/MusicApp'));
const PhotosApp   = lazy(() => import('./apps/PhotosApp'));
const CameraApp   = lazy(() => import('./apps/CameraApp'));
const WeatherApp  = lazy(() => import('./apps/WeatherApp'));
const CalculatorApp = lazy(() => import('./apps/CalculatorApp'));
const ClockApp    = lazy(() => import('./apps/ClockApp'));
const NotesApp    = lazy(() => import('./apps/NotesApp'));
const CalendarApp = lazy(() => import('./apps/CalendarApp'));
const MapsApp     = lazy(() => import('./apps/MapsApp'));
const FilesApp    = lazy(() => import('./apps/FilesApp'));
const WalletApp   = lazy(() => import('./apps/WalletApp'));
const HealthApp   = lazy(() => import('./apps/HealthApp'));
const GamesApp    = lazy(() => import('./apps/GamesApp'));
const StoreApp    = lazy(() => import('./apps/StoreApp'));
const AiApp       = lazy(() => import('./apps/AiApp'));
const BorsaApp    = lazy(() => import('./apps/BorsaApp'));
const TranslateApp= lazy(() => import('./apps/TranslateApp'));
const RecorderApp = lazy(() => import('./apps/RecorderApp'));
const GarticApp   = lazy(() => import('./apps/GarticApp'));
const AmiralBattiApp = lazy(() => import('./apps/AmiralBattiApp'));
const FacetimeApp = lazy(() => import('./apps/FacetimeApp'));
const PodcastApp = lazy(() => import('./apps/PodcastApp'));
const NewsApp = lazy(() => import('./apps/NewsApp'));
const PinterestApp = lazy(() => import('./apps/PinterestApp'));
const MailApp = lazy(() => import('./apps/MailApp'));

/* ─── Wallpapers ─────────────────────────────────────────────────────── */
const WALLPAPERS = [
  { type:'image', url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', name:'Dağlar' },
  { type:'image', url:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80', name:'Vadi' },
  { type:'image', url:'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&q=80', name:'Orman' },
  { type:'image', url:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80', name:'Göl' },
  { type:'image', url:'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80', name:'Galaksi' },
  { type:'image', url:'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=400&q=80', name:'Gece Şehri' },
  { type:'image', url:'https://images.unsplash.com/photo-1530908295418-a12e326966ba?w=400&q=80', name:'Deniz' },
  { type:'image', url:'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=400&q=80', name:'Plaj' },
  { type:'gradient', url:'radial-gradient(at 80% 0%, #ee7b9c 0%, transparent 50%), radial-gradient(at 0% 50%, #7b8cde 0%, transparent 50%), radial-gradient(at 80% 100%, #f7c59f 0%, transparent 50%), radial-gradient(at 0% 0%, #67b7e0 0%, transparent 50%)', name:'Pembe Mor' },
  { type:'gradient', url:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', name:'Gece Mavisi' },
  { type:'gradient', url:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', name:'Mor Geçiş' },
  { type:'gradient', url:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', name:'Pembe Ateş' },
  { type:'gradient', url:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', name:'Açık Mavi' },
  { type:'gradient', url:'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', name:'Neon Yeşil' },
  { type:'gradient', url:'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', name:'Gün Batımı' },
  { type:'gradient', url:'#0a0a0a', name:'Saf Siyah' },
];

const wpBg = (wp) => {
  if (!wp) return '#1a1a2e';
  if (typeof wp === 'string') return wp;
  return wp.type === 'image' ? `url(${wp.url}) center/cover no-repeat` : wp.url;
};

/* ─── All apps config ────────────────────────────────────────────────── */
// Page 1
const PAGE1_APPS = [
  { id:'social', name:'Tuzluca', bg:'linear-gradient(135deg,#1DA1F2,#0077B5)', 
    icon:<Globe size={38} color="white" strokeWidth={1.5} /> },
    
  { id:'games', name:'Oyunlar', bg:'linear-gradient(180deg,#ff6259,#ff3229)', 
    icon: (
      <div style={{ position:'relative', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Gamepad2 size={36} color="white" strokeWidth={1.5} />
      </div>
    )
  },

  { id:'camera', name:'Kamera', bg:'linear-gradient(180deg,#e5e5ea,#c7c7cc)', 
    icon: (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', position:'relative', width:'100%', height:'100%' }}>
        <Camera size={34} color="#1c1c1e" fill="#1c1c1e" strokeWidth={1} />
        <div style={{ position:'absolute', width:6, height:6, borderRadius:3, background:'#FFCC00', top:16, right:12 }} />
      </div>
    )
  },

  { id:'photos', name:'Fotoğraflar', bg:'white', 
    icon: (
      <div style={{ width:'100%', height:'100%', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {[
          { color:'#FF2D55', rot:0 },
          { color:'#FF9500', rot:45 },
          { color:'#FFCC00', rot:90 },
          { color:'#34C759', rot:135 },
          { color:'#5AC8FA', rot:180 },
          { color:'#007AFF', rot:225 },
          { color:'#5856D6', rot:270 },
          { color:'#AF52DE', rot:315 },
        ].map((p, i) => (
          <div key={i} style={{
            position:'absolute', width:12, height:20, background:p.color, borderRadius:6,
            transform:`rotate(${p.rot}deg) translateY(-10px)`, opacity:0.85, mixBlendMode:'multiply'
          }} />
        ))}
        <div style={{ width:8, height:8, borderRadius:4, background:'white', zIndex:2 }} />
      </div>
    )
  },

  { id:'store', name:'App Store', bg:'linear-gradient(180deg,#1d9df9,#0076f6)', 
    icon: (
      <div style={{ position:'relative', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute', width:4, height:34, background:'white', borderRadius:2, transform:'rotate(30deg) translate(-2px, 4px)' }} />
        <div style={{ position:'absolute', width:4, height:34, background:'white', borderRadius:2, transform:'rotate(-30deg) translate(2px, 4px)' }} />
        <div style={{ position:'absolute', width:22, height:4, background:'white', borderRadius:2, transform:'translateY(6px)' }} />
      </div>
    )
  },

  { id:'weather', name:'Hava', bg:'linear-gradient(180deg,#74c0fa,#3284f6)', 
    icon: (
      <div style={{ width:'100%', height:'100%', position:'relative' }}>
        <CloudSun size={38} color="white" fill="white" strokeWidth={1} style={{ position:'absolute', top:10, left:10 }} />
      </div>
    )
  },

  { id:'maps', name:'Haritalar', bg:'linear-gradient(135deg, #A4D4A2, #D4E2D3)', 
    icon: (
      <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', borderRadius:14 }}>
        <div style={{ position:'absolute', width:20, height:100, background:'#F9E08E', transform:'rotate(30deg) translate(10px, -20px)' }} />
        <div style={{ position:'absolute', width:20, height:100, background:'#F9E08E', transform:'rotate(-60deg) translate(-20px, 10px)' }} />
        <div style={{ position:'absolute', width:8, height:8, borderRadius:4, background:'#007AFF', border:'2px solid white', top:26, left:26, boxShadow:'0 2px 4px rgba(0,0,0,0.3)' }} />
      </div>
    )
  },

  { id:'calendar', name:'Takvim', bg:'white', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:14 }}>
        <div style={{ width:'100%', height:16, background:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:'white', fontSize:8, fontWeight:700, letterSpacing:1 }}>SALI</span>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'white' }}>
          <span style={{ fontSize:32, fontWeight:300, color:'black', marginTop:-4 }}>21</span>
        </div>
      </div>
    )
  },

  { id:'notes', name:'Notlar', bg:'white', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:14 }}>
        <div style={{ width:'100%', height:14, background:'#FFCC00' }} />
        <div style={{ flex:1, padding:'6px 8px', display:'flex', flexDirection:'column', gap:3, background:'white' }}>
          <div style={{ width:'100%', height:2, background:'#e5e5ea', borderRadius:1 }} />
          <div style={{ width:'100%', height:2, background:'#e5e5ea', borderRadius:1 }} />
          <div style={{ width:'70%', height:2, background:'#e5e5ea', borderRadius:1 }} />
        </div>
      </div>
    )
  },

  { id:'wallet', name:'Cüzdan', bg:'linear-gradient(180deg,#1c1c1e,#000000)', 
    icon: (
      <div style={{ width:'100%', height:'100%', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ width:40, height:10, background:'#5AC8FA', borderRadius:3 }} />
        <div style={{ width:40, height:10, background:'#FFCC00', borderRadius:3 }} />
        <div style={{ width:40, height:10, background:'#FF2D55', borderRadius:3 }} />
      </div>
    )
  },

  { id:'health', name:'Sağlık', bg:'white', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <HeartPulse size={36} color="#FF2D55" strokeWidth={2} />
      </div>
    )
  },

  { id:'clock', name:'Saat', bg:'black', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:48, height:48, borderRadius:24, background:'white', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', width:3, height:16, background:'black', borderRadius:2, transformOrigin:'bottom center', transform:'translateY(-8px) rotate(45deg)' }} />
          <div style={{ position:'absolute', width:4, height:10, background:'black', borderRadius:2, transformOrigin:'bottom center', transform:'translateY(-5px) rotate(300deg)' }} />
          <div style={{ position:'absolute', width:1.5, height:20, background:'#FF9500', borderRadius:1, transformOrigin:'bottom center', transform:'translateY(-10px) rotate(180deg)' }} />
          <div style={{ width:4, height:4, borderRadius:2, background:'#FF9500', zIndex:2 }} />
        </div>
      </div>
    )
  },

  { id:'calculator', name:'Hesap', bg:'#2c2c2e', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridTemplateRows:'repeat(5,1fr)', gap:2, padding:6, borderRadius:14 }}>
        {[...Array(20)].map((_,i) => <div key={i} style={{ background: (i+1)%4===0 ? '#ff9f0a' : '#a5a5a5', borderRadius:2 }} />)}
      </div>
    )
  },

  { id:'settings', name:'Ayarlar', bg:'linear-gradient(180deg,#b0b0b8,#86868b)', 
    icon: (
      <div style={{ width:'100%', height:'100%', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Settings size={44} color="#3a3a3c" strokeWidth={2.5} />
        <div style={{ position:'absolute', width:18, height:18, borderRadius:9, background:'linear-gradient(180deg,#b0b0b8,#86868b)' }} />
      </div>
    )
  },

  { id:'ai', name:'Tuzluca AI', bg:'linear-gradient(180deg,#af52de,#5e5ce6)', 
    icon:<Bot size={36} color="white" strokeWidth={1.5} /> },
    
  { id:'borsa', name:'Borsa', bg:'black', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TrendingUp size={36} color="#34C759" strokeWidth={2} />
      </div>
    )
  },

  { id:'translate', name:'Çeviri', bg:'linear-gradient(180deg,#5AC8FA,#007AFF)', 
    icon:<Languages size={36} color="white" strokeWidth={1.5} /> },
    
  { id:'recorder', name:'Ses Notu', bg:'black', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
        <div style={{ display:'flex', gap:3, alignItems:'center' }}>
          <div style={{ width:3, height:10, background:'white', borderRadius:2 }} />
          <div style={{ width:3, height:22, background:'white', borderRadius:2 }} />
          <div style={{ width:3, height:14, background:'white', borderRadius:2 }} />
          <div style={{ width:3, height:28, background:'#FF2D55', borderRadius:2 }} />
          <div style={{ width:3, height:18, background:'white', borderRadius:2 }} />
          <div style={{ width:3, height:8, background:'white', borderRadius:2 }} />
        </div>
      </div>
    )
  },

  { id:'gartic', name:'Gartic', bg:'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', 
    icon:<Palette size={36} color="white" strokeWidth={1.5} /> 
  },

  { id:'amiral', name:'Amiral Battı', bg:'linear-gradient(180deg,#0A84FF,#0055B3)', 
    icon:<span style={{fontSize: 28}}>⚓</span>
  },

  { id:'facetime', name:'FaceTime', bg:'linear-gradient(135deg, #32D74B, #28A745)', 
    icon:<Video size={36} color="white" strokeWidth={1.5} /> 
  },

  { id:'podcast', name:'Podcasts', bg:'linear-gradient(135deg, #A259FF, #6B00FF)', 
    icon:<Headphones size={36} color="white" strokeWidth={1.5} /> 
  },

  { id:'news', name:'Haberler', bg:'linear-gradient(135deg, #FF2D55, #E94057)', 
    icon:<Newspaper size={36} color="white" strokeWidth={1.5} /> 
  },

  { id:'mail', name:'E-Posta', bg:'linear-gradient(180deg,#5AC8FA,#0A84FF)', 
    icon:<Mail size={36} color="white" strokeWidth={1.5} /> 
  },

  { id:'pinterest', name:'Pinterest', bg:'#E60023', 
    icon:<span style={{fontSize: 32, color: 'white', fontWeight: 'bold'}}>P</span> 
  },

  { id:'files', name:'Dosyalar', bg:'white', 
    icon: (
      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Folder size={36} color="#007AFF" fill="#007AFF" />
      </div>
    )
  },
];

const DOCK_APPS = [
  { id:'phone', name:'Telefon', bg:'linear-gradient(180deg,#42d45c,#24c645)', 
    icon:<Phone fill="white" size={34} color="white" strokeWidth={1} /> },
    
  { id:'messages', name:'Mesajlar', bg:'linear-gradient(180deg,#42d45c,#24c645)', 
    icon:<MessageCircle fill="white" size={34} color="white" strokeWidth={1} /> },
    
  { id:'safari', name:'Safari', bg:'white', 
    icon: (
      <div style={{ position:'relative', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:48, height:48, borderRadius:24, border:'2px solid #007AFF', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {[0,30,60,90,120,150].map(deg => (
             <div key={deg} style={{ position:'absolute', width:2, height:'100%', background:'#007AFF', opacity:0.3, transform:`rotate(${deg}deg)` }} />
          ))}
          <div style={{ width:40, height:40, borderRadius:20, background:'white', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:6, height:30, position:'relative', transform:'rotate(45deg)' }}>
               <div style={{ width:0, height:0, borderLeft:'3px solid transparent', borderRight:'3px solid transparent', borderBottom:'15px solid #FF3B30' }} />
               <div style={{ width:0, height:0, borderLeft:'3px solid transparent', borderRight:'3px solid transparent', borderTop:'15px solid #007AFF' }} />
            </div>
          </div>
        </div>
      </div>
    )
  },
  
  { id:'music', name:'Müzik', bg:'linear-gradient(180deg,#fa4b6b,#f82a55)', 
    icon:<Music fill="white" size={36} color="white" strokeWidth={1.5} /> },
];

/* ─── Dynamic Island ─────────────────────────────────────────────────── */
function DynamicIsland({ isMuted, showMuteHud, volume, showVolumeHud, customAlert, mediaState, mediaAppRef, isIslandExpanded, setIsIslandExpanded, activeApp, activeCall, isAiListening, isRecording, onOpenApp }) {
  const expandedHud = showMuteHud || showVolumeHud || !!customAlert;
  
  const showCall = activeCall && activeApp !== 'phone' && !expandedHud;
  const showAi = isAiListening && activeApp !== 'ai' && !expandedHud && !showCall;
  const showRecording = isRecording && activeApp !== 'recorder' && !expandedHud && !showCall && !showAi;
  const showMusic = mediaState?.currentSong && activeApp !== 'music' && activeApp !== 'podcast' && !expandedHud && !showCall && !showAi && !showRecording;
  
  const canExpand = showCall || showAi || showRecording || showMusic;
  const isExpanded = isIslandExpanded && canExpand;

  let width = 120;
  if (customAlert) width = Math.min(300, Math.max(160, customAlert.length * 8 + 60));
  else if (expandedHud) width = 230;
  else if (isExpanded) {
    if (showCall) width = 340;
    else if (showAi) width = 180;
    else if (showRecording) width = 220;
    else if (showMusic) width = 360;
  }
  else if (showCall) width = 170;
  else if (showAi) width = 140;
  else if (showRecording) width = 140;
  else if (showMusic) width = 160;
  
  const height = isExpanded ? (showMusic ? 160 : (showAi ? 100 : (showRecording ? 90 : 100))) : (expandedHud ? 46 : 35);
  const borderRadius = isExpanded ? (showMusic ? 40 : 25) : (expandedHud ? 23 : 18);

  const toggleIsland = (e) => {
    e.stopPropagation();
    if (canExpand && !expandedHud) {
      if (!isExpanded) playClick();
      setIsIslandExpanded(!isIslandExpanded);
    }
  };

  return (
    <motion.div
      onClick={toggleIsland}
      animate={{ width, height, borderRadius }}
      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
      style={{ position:'absolute', top:'10px', left:'50%', x:'-50%', background:'#000', zIndex:9998, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:customAlert ? 'center' : 'space-between', padding:customAlert ? '0 16px' : (isExpanded ? '20px' : '0 12px'), overflow:'hidden', willChange: 'width, height, border-radius, transform', cursor: canExpand ? 'pointer' : 'default', boxShadow: isExpanded ? '0 20px 40px rgba(0,0,0,0.5)' : 'none' }}>
      
      {!isExpanded && (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: customAlert ? 'center' : 'space-between' }}>
          {!canExpand && !customAlert && !showVolumeHud && !showMuteHud && <div style={{ width:10, height:10, borderRadius:'50%', background:'#111' }} />}
          
          <AnimatePresence mode="wait">
            {customAlert && (
              <motion.div key="alert" initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{customAlert}</span>
              </motion.div>
            )}
            {showVolumeHud && !customAlert && (
              <motion.div key="vol" initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Volume2 size={14} color="white" />
                <div style={{ width:90, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2 }}>
                  <div style={{ width:`${volume}%`, height:'100%', background:'white', borderRadius:2, transition:'width 0.1s' }} />
                </div>
              </motion.div>
            )}
            {showMuteHud && !customAlert && !showVolumeHud && (
              <motion.div key="mute" initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} style={{ display:'flex', alignItems:'center', gap:6 }}>
                {isMuted ? <BellOff size={14} color="#FF3B30" /> : <Bell size={14} color="white" />}
                <span style={{ color: isMuted ? '#FF3B30' : 'white', fontSize: 13, fontWeight: 600 }}>{isMuted ? 'Sessiz' : 'Sesli'}</span>
              </motion.div>
            )}
            {showCall && !customAlert && !showVolumeHud && !showMuteHud && (
              <motion.div key="call-small" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', color: '#32D74B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} fill="#32D74B" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{activeCall.status === 'active' ? 'Görüşme' : 'Aranıyor'}</span>
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 16 }}>
                  {[1,2,3,4].map(i => (
                    <motion.div key={`call-${i}`} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.4 + i*0.1 }} style={{ width: 3, background: '#32D74B', borderRadius: 2 }} />
                  ))}
                </div>
              </motion.div>
            )}
            {showAi && !customAlert && !showVolumeHud && !showMuteHud && (
              <motion.div key="ai-small" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', color: '#af52de' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="#af52de" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Tuzluca AI</span>
                </div>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 10, height: 10, borderRadius: '50%', background: '#af52de', boxShadow: '0 0 10px #af52de' }} />
              </motion.div>
            )}
            {showRecording && !customAlert && !showVolumeHud && !showMuteHud && (
              <motion.div key="rec-small" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', color: '#FF3B30' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mic size={14} color="#FF3B30" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Kayıt</span>
                </div>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3B30' }} />
              </motion.div>
            )}
            {showMusic && !customAlert && !showVolumeHud && !showMuteHud && (
              <motion.div key="music-small" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width:22, height:22, borderRadius:5, background:`linear-gradient(135deg, ${mediaState.currentSong.color}, #533483)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {React.cloneElement(mediaState.currentSong.emoji, { size: 14, color: 'white' })}
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 16 }}>
                  {[1,2,3,4].map(i => (
                    <motion.div key={`m-${i}`} animate={mediaState.isPlaying ? { height: [4, 12, 4] } : { height: 4 }} transition={{ repeat: Infinity, duration: 0.5 + i*0.1 }} style={{ width: 3, background: mediaState.currentSong.color, borderRadius: 2 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!canExpand && !customAlert && !showVolumeHud && !showMuteHud && <div style={{ width:10, height:10, borderRadius:'50%', background:'#111' }} />}
        </div>
      )}

      {/* Expanded UI */}
      <AnimatePresence>
        {isExpanded && showCall && (
          <motion.div key="call-exp" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 15, alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                {activeCall.remote?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{activeCall.remote?.username || 'Bilinmeyen'}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{activeCall.status === 'active' ? 'Görüşme Devam Ediyor' : 'Aranıyor...'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 5 }}>
              <button onClick={(e) => { e.stopPropagation(); setIsIslandExpanded(false); onOpenApp('phone'); }} style={{ width: 44, height: 44, borderRadius: '50%', background: '#32D74B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(50,215,75,0.4)' }}>
                 <Phone size={22} color="white" />
              </button>
            </div>
          </motion.div>
        )}
        
        {isExpanded && showAi && (
          <motion.div key="ai-exp" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ scale: [1, 1.1, 1], rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #af52de, #5e5ce6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(175,82,222,0.6)' }}>
               <Sparkles size={22} color="white" />
            </motion.div>
            <span style={{ color: 'white', marginTop: 8, fontSize: 13, fontWeight: 500 }}>Sizi dinliyor...</span>
          </motion.div>
        )}

        {isExpanded && showRecording && (
          <motion.div key="rec-exp" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 34, height: 34, borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255,59,48,0.5)' }}>
               <Mic size={18} color="white" />
             </motion.div>
             <span style={{ color: 'white', marginTop: 8, fontSize: 13, fontWeight: 500 }}>Ses Kaydediliyor</span>
          </motion.div>
        )}

        {isExpanded && showMusic && (
          <motion.div key="music-exp" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg, ${mediaState.currentSong.color}, #533483)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                {React.cloneElement(mediaState.currentSong.emoji, { size: 36, color: 'white' })}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mediaState.currentSong.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{mediaState.currentSong.artist}</div>
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24, marginRight: 5 }}>
                  {[1,2,3,4].map(i => (
                    <motion.div key={`m-exp-${i}`} animate={mediaState.isPlaying ? { height: [6, 20, 6] } : { height: 6 }} transition={{ repeat: Infinity, duration: 0.5 + i*0.1 }} style={{ width: 4, background: mediaState.currentSong.color, borderRadius: 2 }} />
                  ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 15 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{mediaState.currentSong.isLive ? 'CANLI' : Math.floor(mediaState.currentTime / 60) + ':' + String(Math.floor(mediaState.currentTime % 60)).padStart(2, '0')}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, cursor: 'pointer', overflow: 'hidden' }} onClick={e => {
                  e.stopPropagation();
                  if (mediaState.currentSong.isLive) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  if (mediaAppRef.current) mediaAppRef.current.seek(pct);
              }}>
                <div style={{ width: mediaState.currentSong.isLive ? '100%' : `${mediaState.progress}%`, height: '100%', background: 'white', borderRadius: 3, transition: 'width 0.2s' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{mediaState.currentSong.isLive ? 'YAYIN' : '-' + Math.floor(Math.max(0, mediaState.duration - mediaState.currentTime) / 60) + ':' + String(Math.floor(Math.max(0, mediaState.duration - mediaState.currentTime) % 60)).padStart(2, '0')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, marginTop: 10 }}>
              <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); mediaAppRef.current?.playPrev(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: mediaState.currentSong.isLive ? 0.3 : 1 }}>
                 <SkipBack size={28} fill="white" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); mediaAppRef.current?.togglePlay(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                 {mediaState.isPlaying ? <Pause size={34} fill="white" /> : <Play size={34} fill="white" style={{ marginLeft: 3 }} />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); mediaAppRef.current?.playNext(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: mediaState.currentSong.isLive ? 0.3 : 1 }}>
                 <SkipForward size={28} fill="white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!customAlert && !canExpand && <div style={{ width:8, height:8, borderRadius:'50%', background:'#111' }} />}
    </motion.div>
  );
}

const IosCellular = ({ color }) => (
  <svg width="17" height="11" viewBox="0 0 17 11" fill={color} xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="7" width="2.8" height="4" rx="0.5" />
    <rect x="4.5" y="4.5" width="2.8" height="6.5" rx="0.5" />
    <rect x="9" y="2" width="2.8" height="9" rx="0.5" />
    <rect x="13.5" y="0" width="2.8" height="11" rx="0.5" />
  </svg>
);

const IosWifi = ({ color }) => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 12C8.82843 12 9.5 11.3284 9.5 10.5C9.5 9.67157 8.82843 9 8 9C7.17157 9 6.5 9.67157 6.5 10.5C6.5 11.3284 7.17157 12 8 12Z" fill={color} />
    <path d="M12.0298 7.02944C10.963 5.96265 9.51651 5.36336 8.0001 5.36336C6.48369 5.36336 5.03719 5.96265 3.9704 7.02944C3.67751 7.32233 3.20263 7.32233 2.90974 7.02944C2.61685 6.73655 2.61685 6.26167 2.90974 5.96878C4.25997 4.61855 6.09117 3.86016 8.0001 3.86016C9.90903 3.86016 11.7402 4.61855 13.0905 5.96878C13.3833 6.26167 13.3833 6.73655 13.0905 7.02944C12.7976 7.32233 12.3227 7.32233 12.0298 7.02944Z" fill={color} />
    <path d="M15.4217 3.52841C13.4475 1.55424 10.7699 0.445129 7.97825 0.445129C5.18664 0.445129 2.50901 1.55424 0.534839 3.52841C0.241946 3.82131 0.241946 4.29618 0.534839 4.58907C0.827732 4.88197 1.30261 4.88197 1.5955 4.58907C3.28471 2.89987 5.57551 1.95078 7.97825 1.95078C10.381 1.95078 12.6718 2.89987 14.361 4.58907C14.6539 4.88197 15.1288 4.88197 15.4217 4.58907C15.7146 4.29618 15.7146 3.82131 15.4217 3.52841Z" fill={color} />
  </svg>
);

const handleShareToApp = (appId, data) => {
    localStorage.setItem('pendingShare', JSON.stringify(data));
    handleOpenApp(appId);
};

/* ─── Status Bar ─────────────────────────────────────────────────────── */
function BatteryIndicator({ c }) {
  const [level, setLevel] = useState(1);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        setLevel(bat.level);
        setCharging(bat.charging);
        const update = () => { setLevel(bat.level); setCharging(bat.charging); };
        bat.addEventListener('levelchange', update);
        bat.addEventListener('chargingchange', update);
      });
    }
  }, []);

  const isLow = level < 0.3 && !charging;
  const batPct = Math.round(level * 100);
  
  let color = '#FFCC00'; // yellow
  if (charging) color = '#34C759'; // green
  else if (isLow) color = '#FF3B30'; // red

  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 14, 
      border: `1.5px solid ${color}`, 
      borderRadius: 4, 
      position: 'relative',
      background: isLow ? '#FF3B30' : 'transparent',
      marginLeft: 2,
      overflow: 'visible'
    }}>
      {/* Battery Fill */}
      {!isLow && (
        <div style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: `${Math.max(5, batPct)}%`, background: color, borderRadius: 2, opacity: 0.6 }} />
      )}
      
      {/* Percentage Text Inside */}
      <span style={{ fontSize: 10, fontWeight: 800, color: isLow ? 'white' : c, zIndex: 2, textShadow: isLow ? 'none' : '0px 0px 2px rgba(0,0,0,0.5)' }}>
        {batPct}
      </span>
      
      {/* Battery Tip */}
      <div style={{ position: 'absolute', right: -4, top: 2.5, width: 2, height: 6, background: color, borderRadius: '0 2px 2px 0' }} />
    </div>
  );
}

function StatusBar({ dark, customAlert, customAlertTimer, isRecording, recordingDone, brightness }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    // Expose global Dynamic Alert trigger for apps
    if (customAlert && customAlert.set) {
      window.showDynamicAlert = (msg) => {
        customAlert.set(msg);
        if (customAlertTimer && customAlertTimer.current) clearTimeout(customAlertTimer.current);
        if (customAlertTimer) customAlertTimer.current = setTimeout(() => customAlert.set(null), 3000);
      };
    }

    const upd = () => { const d = new Date(); setTime(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`); };
    upd(); const t = setInterval(upd, 1000); return () => clearInterval(t);
  }, []);

  const c = dark && !isRecording ? '#1c1c1e' : 'white';

  return (
    <>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:44, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 22px', color:c, fontSize:15, fontWeight:600, zIndex:9990, pointerEvents:'none', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              background: isRecording ? '#FF3B30' : (recordingDone ? '#32D74B' : 'transparent'), 
              padding: isRecording || recordingDone ? '2px 10px' : '0px', 
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              marginLeft: isRecording || recordingDone ? -10 : 0
            }}
          >
            {isRecording && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
            {recordingDone && <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#32D74B' }} />}
            <span style={{ color: isRecording || recordingDone ? 'white' : c }}>{time}</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <IosCellular color={c} />
          <IosWifi color={c} />
          <BatteryIndicator c={c} />
        </div>
      </div>
    </>
  );
}

/* ─── Lock Screen ────────────────────────────────────────────────────── */
function LockScreen({ pin, onUnlock, wallpaper }) {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (input.length === 4) {
      if (!pin || input === pin) onUnlock();
      else { setShake(true); setTimeout(() => { setShake(false); setInput(''); }, 500); }
    }
  }, [input, pin, onUnlock]);

  const letters = { 2:'ABC', 3:'DEF', 4:'GHI', 5:'JKL', 6:'MNO', 7:'PQRS', 8:'TUV', 9:'WXYZ' };
  return (
    <div style={{ width:'100%', height:'100%', background: wpBg(wallpaper), position:'relative', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' }}>
      <div style={{ position:'absolute', inset:0, backdropFilter:'blur(40px) brightness(0.5)', WebkitBackdropFilter:'blur(40px) brightness(0.5)' }} />
      <StatusBar dark={false} />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%' }}>
        <div style={{ marginTop:80, textAlign:'center', color:'white', marginBottom:50 }}>
          <div style={{ fontSize:82, fontWeight:200, lineHeight:1, letterSpacing:'-4px', textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>
            {now.toLocaleTimeString('tr-TR',{ hour:'2-digit', minute:'2-digit' })}
          </div>
          <div style={{ fontSize:18, fontWeight:400, marginTop:10, opacity:0.85 }}>
            {now.toLocaleDateString('tr-TR',{ weekday:'long', day:'numeric', month:'long' })}
          </div>
        </div>
        {pin ? (
          <>
            <div style={{ display:'flex', gap:22, marginBottom:36 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width:13, height:13, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.8)', backgroundColor: input.length > i ? 'white' : 'transparent', transition:'background 0.1s' }} />)}
            </div>
            <motion.div animate={{ x: shake ? [-10,10,-10,10,0] : 0 }} transition={{ duration:0.4 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 82px)', gap:14 }}>
                {[1,2,3,4,5,6,7,8,9,null,0,'del'].map((k,i) => {
                  if (k === null) return <div key={i} />;
                  return (
                    <motion.button key={i} whileTap={{ scale:0.88, backgroundColor:'rgba(255,255,255,0.35)' }}
                      onClick={() => { playClick(); k==='del' ? setInput(p=>p.slice(0,-1)) : setInput(p => p.length < 4 ? p+k : p); }}
                      style={{ width:82, height:82, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.18)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)' }}>
                      {k==='del' ? <Delete size={22} color="white" /> : <>
                        <span style={{ fontSize:34, fontWeight:300, color:'white', lineHeight:1.1 }}>{k}</span>
                        {letters[k] && <span style={{ fontSize:9, color:'rgba(255,255,255,0.65)', letterSpacing:'1.5px', fontWeight:600 }}>{letters[k]}</span>}
                      </>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.button whileTap={{ scale:0.95 }} onClick={onUnlock}
            style={{ padding:'14px 36px', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:30, color:'white', fontSize:17, fontWeight:500, cursor:'pointer', backdropFilter:'blur(10px)' }}>
            Kaydırarak Aç
          </motion.button>
        )}
      </div>
    </div>
  );
}

/* ─── Home Screen ────────────────────────────────────────────────────── */
function HomeScreen({ onOpenApp, wallpaper, isDark, unreadMessages, unreadEmails, installedApps, defaultInstalledApps, onUninstallApp }) {
  const bg = wpBg(wallpaper);
  
  const allApps = PAGE1_APPS.filter(app => installedApps.includes(app.id));
  const dock = DOCK_APPS.filter(app => installedApps.includes(app.id));

  const pages = [];
  for (let i = 0; i < Math.max(1, allApps.length); i += 24) {
    pages.push(allApps.slice(i, i + 24));
  }

  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const handleScroll = (e) => {
    const width = e.target.clientWidth;
    const page = Math.round(e.target.scrollLeft / width);
    if (page !== activePage) setActivePage(page);
  };

  const onDragStart = (e) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX || (e.touches && e.touches[0].pageX) || 0;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    if (scrollRef.current) {
      scrollRef.current.style.scrollSnapType = 'none';
      scrollRef.current.style.scrollBehavior = 'auto';
    }
  };

  const onDragMove = (e) => {
    if (!isDragging.current) return;
    const x = e.pageX || (e.touches && e.touches[0].pageX) || 0;
    const walk = (dragStartX.current - x);
    if (Math.abs(walk) > 5) hasDragged.current = true;
    scrollRef.current.scrollLeft = dragScrollLeft.current + walk;
  };

  const onDragEnd = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollSnapType = 'x mandatory';
      scrollRef.current.style.scrollBehavior = 'smooth';
      
      // Snap to nearest page manually to assist CSS scroll snap
      const width = scrollRef.current.clientWidth;
      const nearestPage = Math.round(scrollRef.current.scrollLeft / width);
      scrollRef.current.scrollTo({ left: nearestPage * width, behavior: 'smooth' });
    }
  };

  const [isJiggleMode, setIsJiggleMode] = useState(false);
  const pressTimer = useRef(null);

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      playClick();
      setIsJiggleMode(true);
    }, 600);
  };

  const handlePointerUp = (e, appId) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (hasDragged.current) return;
    if (!isJiggleMode) {
      playClick();
      onOpenApp(appId);
    }
  };

  const clearTimer = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleBgClick = () => {
    if (isJiggleMode) {
      playClick();
      setIsJiggleMode(false);
    }
  };

  return (
    <div onClick={handleBgClick} style={{ width:'100%', height:'100%', background:bg, display:'flex', flexDirection:'column', position:'relative', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', overflow:'hidden' }}>
      {/* Dark overlay based on theme for readability */}
      <div style={{ position:'absolute', inset:0, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)', pointerEvents:'none' }} />

      {/* App grid (Paginated) */}
      <div 
        className="home-grid"
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerLeave={onDragEnd}
        style={{ flex:1, display:'flex', overflowX:'auto', overflowY:'hidden', scrollSnapType:'x mandatory', scrollBehavior:'smooth', scrollbarWidth:'none', position:'relative', zIndex:1 }}
      >
        <style>{`.hide-scrollbars::-webkit-scrollbar { display: none; }`}</style>
        {pages.map((pageApps, pageIdx) => (
          <div key={pageIdx} style={{ minWidth:'100%', padding:'80px 16px 8px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridAutoRows:'min-content', gap:'20px 4px', alignContent:'start', scrollSnapAlign:'start' }}>
            {pageApps.map(app => {
              const isDeletable = !defaultInstalledApps.includes(app.id);
              return (
                <motion.div 
                  key={app.id} 
                  onPointerDown={handlePointerDown}
                  onPointerUp={(e) => handlePointerUp(e, app.id)}
                  onPointerMove={clearTimer}
                  onPointerCancel={clearTimer}
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => e.preventDefault()}
                  animate={isJiggleMode ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
                  transition={isJiggleMode ? { repeat: Infinity, duration: 0.25, ease: "linear", repeatType: "mirror", delay: Math.random() * 0.1 } : {}}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer', position: 'relative' }}
                >
                  <motion.div whileTap={!isJiggleMode ? { scale:0.80 } : {}}
                    style={{ width:60, height:60, borderRadius:14, background:app.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:27, boxShadow:'0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)', position:'relative' }}>
                    {app.icon}
                    {app.id === 'messages' && unreadMessages > 0 && !isJiggleMode && (
                      <div style={{ position:'absolute', top:-4, right:-4, minWidth:18, height:18, borderRadius:9, background:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:700, padding:'0 4px' }}>{unreadMessages}</div>
                    )}
                    {app.id === 'mail' && unreadEmails > 0 && !isJiggleMode && (
                      <div style={{ position:'absolute', top:-4, right:-4, minWidth:18, height:18, borderRadius:9, background:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:700, padding:'0 4px' }}>{unreadEmails}</div>
                    )}
                    {isJiggleMode && isDeletable && (
                      <div onClick={(e) => { e.stopPropagation(); onUninstallApp(app.id); }} style={{ position:'absolute', top:-6, left:-6, width:24, height:24, borderRadius:'50%', background:'#e5e5ea', display:'flex', alignItems:'center', justifyContent:'center', color:'#FF3B30', zIndex: 10 }}>
                        <div style={{ width:12, height:2, background:'#FF3B30', borderRadius:1 }} />
                      </div>
                    )}
                  </motion.div>
                  <span style={{ fontSize:10, color:'white', textShadow:'0 1px 3px rgba(0,0,0,0.8)', fontWeight:500, textAlign:'center', lineHeight:1.2 }}>{app.name}</span>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Page dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:8, paddingBottom:12, position:'relative', zIndex:1, height: '24px', alignItems: 'center' }}>
        {pages.map((_, idx) => (
          <div key={idx} style={{ width:6, height:6, borderRadius:'50%', background: activePage === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', transition: '0.2s' }} />
        ))}
      </div>

      {/* Dock */}
      <div style={{ position:'absolute', bottom: 20, left: 16, right: 16, zIndex:1, height: 86, background:'rgba(255,255,255,0.22)', backdropFilter:'blur(40px) saturate(200%)', WebkitBackdropFilter:'blur(40px) saturate(200%)', borderRadius: 40, border:'1px solid rgba(255,255,255,0.3)', boxShadow:'0 10px 40px rgba(0,0,0,0.15)', display:'flex', justifyContent:'space-evenly', alignItems:'center', padding:'0 10px' }}>
        {dock.map(app => (
          <motion.div 
            key={app.id} 
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => handlePointerUp(e, app.id)}
            onPointerMove={clearTimer}
            onPointerCancel={clearTimer}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            animate={isJiggleMode ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
            transition={isJiggleMode ? { repeat: Infinity, duration: 0.25, ease: "linear", repeatType: "mirror", delay: Math.random() * 0.1 } : {}}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer', position:'relative' }}
          >
            <motion.div whileTap={!isJiggleMode ? { scale:0.80 } : {}} style={{ width:62, height:62, borderRadius:15, background:app.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, boxShadow:'0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)' }}>{app.icon}</motion.div>
            {app.id === 'messages' && unreadMessages > 0 && !isJiggleMode && (
              <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:'50%', background:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:700 }}>{unreadMessages}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}


/* ─── Main App ───────────────────────────────────────────────────────── */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  
  const [activeApp, setActiveApp] = useState(null);
  const [runningApps, setRunningApps] = useState([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  
  const defaultInstalledApps = ['phone', 'settings', 'messages', 'safari', 'music', 'photos', 'camera', 'social', 'games', 'weather', 'maps', 'calendar', 'notes', 'wallet', 'health', 'clock', 'calculator', 'store', 'recorder', 'podcast', 'news', 'pinterest', 'mail', 'ai', 'files'];
  const [installedApps, setInstalledApps] = useState(() => {
    try { 
      const local = JSON.parse(localStorage.getItem('phoneInstalledApps'));
      if (local && Array.isArray(local) && local.length > 0) {
        const missing = defaultInstalledApps.filter(app => !local.includes(app));
        return [...local, ...missing];
      }
      return defaultInstalledApps;
    }
    catch { return defaultInstalledApps; }
  });

  const [pin, setPin] = useState(localStorage.getItem('phonePin') || '');
  const [isLocked, setIsLocked] = useState(!!localStorage.getItem('phonePin'));
  const [wallpaper, setWallpaper] = useState(() => { try { return JSON.parse(localStorage.getItem('phoneWallpaper')) || WALLPAPERS[0]; } catch { return WALLPAPERS[0]; } });
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);
  const [ringtone, setRingtone] = useState(localStorage.getItem('phoneRingtone') || 'marimba');
  const [isAiListening, setIsAiListening] = useState(false);
  const [textTone, setTextTone] = useState(localStorage.getItem('phoneTextTone') || 'tri-tone');
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(!!localStorage.getItem('phoneIsMuted'));
  const [isDark, setIsDark] = useState(!!localStorage.getItem('phoneDarkMode'));
  const [brightness, setBrightness] = useState(100);
  const [isScreenOff, setIsScreenOff] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [showMuteHud, setShowMuteHud] = useState(false);
  const [showVolumeHud, setShowVolumeHud] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const [musicState, setMusicState] = useState({ currentSong: null, isPlaying: false, progress: 0, currentTime: 0, duration: 0 });
  const musicAppRef = useRef(null);
  const [podcastState, setPodcastState] = useState(null);
  const podcastAppRef = useRef(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadEmails, setUnreadEmails] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDone, setRecordingDone] = useState(false);
  const muteTimer = useRef(null);
  const volTimer = useRef(null);
  const customAlertTimer = useRef(null);
  const msgSubRef = useRef(null);
  const emailSubRef = useRef(null);
  const socialSubRef = useRef(null);
  const activeAppRef = useRef(null);

  const [alarms, setAlarms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoneAlarms')) || []; }
    catch { return []; }
  });

  // FaceTime / WebRTC States
  const [peerObj, setPeerObj] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [shareData, setShareData] = useState(null);
  const myPeerId = useRef(null);
  const presenceChannel = useRef(null);

  const endCall = (streamToStop) => {
    const targetStream = (streamToStop && streamToStop.getTracks) ? streamToStop : localStream;
    if (activeCall) activeCall.close();
    if (incomingCall) incomingCall.close();
    if (targetStream) targetStream.getTracks().forEach(t => t.stop());
    if (localStream && localStream !== targetStream) localStream.getTracks().forEach(t => t.stop());
    setActiveCall(null);
    setRemoteStream(null);
    setLocalStream(null);
    setIncomingCall(null);
  };

  const startCall = async (targetPeerId, isVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true }).catch(err => {
        setCustomAlert('Kamera/Mikrofon izni reddedildi!');
        throw err;
      });
      setLocalStream(stream);
      const call = peerObj.call(targetPeerId, stream, { metadata: { type: isVideo ? 'video' : 'audio' } });
      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });
      call.on('close', () => endCall(stream));
      setActiveCall(call);
    } catch (e) {
      console.error(e);
    }
  };

  const answerCall = async () => {
    try {
      const isVideo = incomingCall?.metadata?.type !== 'audio';
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true }).catch(err => {
        setCustomAlert('Kamera/Mikrofon izni reddedildi!');
        throw err;
      });
      setLocalStream(stream);
      incomingCall.answer(stream);
      incomingCall.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });
      incomingCall.on('close', () => endCall(stream));
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setActiveApp('facetime');
    } catch (e) {
      console.error(e);
      endCall();
    }
  };

  useEffect(() => {
    activeAppRef.current = activeApp;
  }, [activeApp]);

  useEffect(() => {
    // Ensure newly added default apps (like phone, recorder) are appended for existing users
    const missing = defaultInstalledApps.filter(app => !installedApps.includes(app));
    if (missing.length > 0) {
      const merged = [...installedApps, ...missing];
      setInstalledApps(merged);
      localStorage.setItem('phoneInstalledApps', JSON.stringify(merged));
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      if (window.showDynamicAlert) window.showDynamicAlert('Bağlantı Kuruldu: Senkronize Ediliyor...');
      const queue = await getOfflineQueue();
      if (queue && queue.length > 0) {
        for (const action of queue) {
          if (action.type === 'SOCIAL_POST') {
            await supabase.from('social_posts').insert([action.payload]);
          }
          if (action.type === 'MAIL_SEND') {
            await supabase.from('emails').insert([action.payload]);
          }
        }
        await clearOfflineQueue();
        if (window.showDynamicAlert) window.showDynamicAlert('Senkronizasyon Tamamlandı');
      }
    };
    const handleOffline = () => {
      if (window.showDynamicAlert) window.showDynamicAlert('İnternet Koptu: Çevrimdışı Mod Aktif');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setAlarms(prev => {
        let changed = false;
        const next = prev.map(a => {
          // If we haven't rung in the last 60 seconds (we deactivate it after ringing)
          if (a.active && a.time === timeStr) {
            if (window.showDynamicAlert) window.showDynamicAlert(`ALARM: ${a.label || 'Zaman Doldu'}`);
            // Fallback play if you want to import playRingtone here, we will just use playClick multiple times or simply assume dynamic alert is enough.
            changed = true;
            return { ...a, active: false };
          }
          return a;
        });
        if (changed) localStorage.setItem('phoneAlarms', JSON.stringify(next));
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    initApp();
    return () => msgSubRef.current?.unsubscribe();
  }, []);

  // WebRTC & Global Presence Setup
  useEffect(() => {
    if (!myProfile) return;

    let savedId = localStorage.getItem('deviceId');
    if (!savedId) {
      savedId = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('deviceId', savedId);
    }
    myPeerId.current = savedId;

    const peer = new Peer(savedId);
    setPeerObj(peer);

    // Refresh, sekme kapatma (F5 vb.) durumlarında bağlantıları zorla kapat (Zombie Call engeli)
    const cleanupBeforeUnload = () => {
      endCall();
      peer.destroy();
    };
    window.addEventListener('beforeunload', cleanupBeforeUnload);

    peer.on('call', (call) => {
      // Incoming call!
      const isMutedNow = !!localStorage.getItem('phoneIsMuted');
      const rt = localStorage.getItem('phoneRingtone') || 'marimba';
      if (!isMutedNow) playTextTone(rt); // Reusing playTextTone for ringtone for now or we can implement playRingtone
      setIncomingCall(call);

      // Windows Focus & Notification Logic
      if (typeof window !== 'undefined') {
        window.focus(); // Attempt to blink taskbar
        if (document.hidden && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            const notif = new Notification('📞 Gelen Görüntülü Arama', {
              body: 'Biri sizi FaceTime üzerinden arıyor. Açmak için tıklayın!',
              requireInteraction: true
            });
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          } else if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      }
    });

    // Supabase presence
    const channel = supabase.channel('tuzluca_global_presence', {
      config: { presence: { key: savedId } }
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = [];
      for (const key in state) {
        if (state[key] && state[key][0]) {
          users.push(state[key][0]);
        }
      }
      setOnlineUsers(users);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const nick = localStorage.getItem('gartic_nickname') || localStorage.getItem('myUsername') || 'Misafir';
        await channel.track({
          id: savedId,
          peerId: savedId,
          nickname: nick
        });
      }
    });

    presenceChannel.current = channel;

    return () => {
      window.removeEventListener('beforeunload', cleanupBeforeUnload);
      peer.destroy();
      supabase.removeChannel(channel);
    };
  }, [myProfile]);

  const initApp = async () => {
    if (localStorage.getItem('appVersion') !== '1.0.2') {
      // Sadece eski hatalı versiyonlarda temizle, bundan sonra kalıcı
      // Eğer daha önce 1.0.1 ise temizlemeyelim ki insanların hesabı gitmesin
      localStorage.setItem('appVersion', '1.0.2');
    }

    const done = localStorage.getItem('onboardingDone');
    if (!done) { setOnboarded(false); setLoading(false); return; }

    // Çevrimdışı/Hızlı açılış için önbellekten yükle
    const cachedProfile = localStorage.getItem('myProfileCache');
    if (cachedProfile) {
      try {
        const p = JSON.parse(cachedProfile);
        setMyProfile(p);
        setIsDark(p.theme === 'dark' || p.theme === 'amoled');
        setOnboarded(true);
      } catch(e) {}
    }

    try {
      // Try to restore existing session
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Anonim oturum süresi dolmuşsa yeniden anonim giriş yap
      if (!session) {
        const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
        if (!anonErr) session = anonData?.session;
      }

      if (!session) {
        console.warn('Oturum alınamadı, muhtemelen internet yok. Çevrimdışı devam ediliyor.');
      }

      const username = localStorage.getItem('myUsername');
      if (username) {
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (profile) {
          localStorage.setItem('myProfileCache', JSON.stringify(profile));
          setMyProfile(profile);
          setIsDark(profile.theme === 'dark' || profile.theme === 'amoled');
          setOnboarded(true);
          setupUnreadListener(profile.id);
          loadUnread(profile.id);
          setupUnreadEmailListener(profile.username);
          loadUnreadEmails(profile.username);
          setupSocialListener(profile.id);
          supabase.from('profiles').update({ is_online: true, last_seen: new Date() }).eq('id', profile.id);
        } else if (error) {
          console.warn('Profil Supabase üzerinden çekilemedi (RLS veya silinmiş olabilir), önbellek kullanılmaya devam ediliyor.', error);
          if (cachedProfile) setOnboarded(true);
        }
      }
    } catch (err) {
      console.error('Bağlantı hatası, çevrimdışı mod kullanılıyor.', err);
      if (cachedProfile) setOnboarded(true);
    }

    setLoading(false);
  };

  const loadUnread = async (profileId) => {
    const { count } = await supabase.from('messages').select('*', { count:'exact', head:true })
      .eq('receiver_id', profileId).eq('is_read', false);
    if (count !== null) setUnreadMessages(count);
  };

  const setupUnreadListener = (profileId) => {
    if (msgSubRef.current) supabase.removeChannel(msgSubRef.current);
    msgSubRef.current = supabase.channel(`unread-${profileId}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${profileId}` }, async (payload) => {
        loadUnread(profileId);
        // Ses çal
        const isMutedNow = !!localStorage.getItem('phoneIsMuted');
        const tt = localStorage.getItem('phoneTextTone') || 'tri-tone';
        if (!isMutedNow) playTextTone(tt);

        // Dinamik Ada (Sanal Telefon İçi Bildirim)
        if (activeAppRef.current !== 'messages' && window.showDynamicAlert) {
          // Gönderenin adını bul
          const { data } = await supabase.from('profiles').select('username').eq('id', payload.new.sender_id).single();
          const senderName = data?.username || 'Biri';
          window.showDynamicAlert(`Mesaj: ${senderName}`);
        }
        
        // Windows/Mac Sistem Bildirimi
        if (window.electronAPI?.showNotification) {
          const hasPin = !!localStorage.getItem('phonePin');
          if (hasPin) {
            // Şifre varsa içeriği gizle
            window.electronAPI.showNotification("Yeni Bildirim", "Gizli İçerik (Kilitli Sistem)");
          } else {
            // Şifre yoksa mesajı göster
            const { data } = await supabase.from('profiles').select('username').eq('id', payload.new.sender_id).single();
            const senderName = data?.username || 'Biri';
            const msgContent = payload.new.content || '📸 Fotoğraf/Medya';
            window.electronAPI.showNotification(`Yeni Mesaj: ${senderName}`, msgContent.substring(0, 50));
          }
        }
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'messages', filter:`receiver_id=eq.${profileId}` }, () => loadUnread(profileId))
      .subscribe();
  };

  const loadUnreadEmails = async (username) => {
    const { count } = await supabase.from('emails').select('*', { count:'exact', head:true })
      .eq('receiver_username', username).eq('is_read', false).eq('is_deleted', false);
    if (count !== null) setUnreadEmails(count);
  };

  const setupUnreadEmailListener = (username) => {
    if (emailSubRef.current) supabase.removeChannel(emailSubRef.current);
    emailSubRef.current = supabase.channel(`unread-emails-${username}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'emails', filter:`receiver_username=eq.${username}` }, (payload) => {
        loadUnreadEmails(username);
        const isMutedNow = !!localStorage.getItem('phoneIsMuted');
        const tt = localStorage.getItem('phoneTextTone') || 'tri-tone';
        if (!isMutedNow) playTextTone(tt);

        if (activeAppRef.current !== 'mail' && window.showDynamicAlert) {
          window.showDynamicAlert(`E-Posta: ${payload.new.sender_username}`);
        }
        
        if (window.electronAPI?.showNotification) {
          const hasPin = !!localStorage.getItem('phonePin');
          if (hasPin) {
            window.electronAPI.showNotification("Yeni Bildirim", "Gizli İçerik (Kilitli Sistem)");
          } else {
            window.electronAPI.showNotification(`E-Posta: ${payload.new.sender_username}`, payload.new.subject?.substring(0, 50) || "Yeni e-posta");
          }
        }
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'emails', filter:`receiver_username=eq.${username}` }, () => loadUnreadEmails(username))
      .subscribe();
  };

  const setupSocialListener = (profileId) => {
    if (socialSubRef.current) supabase.removeChannel(socialSubRef.current);
    socialSubRef.current = supabase.channel('public:social_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_posts' }, async (payload) => {
        // Kendi postumuz değilse
        if (payload.new.profile_id !== profileId) {
          const isMutedNow = !!localStorage.getItem('phoneIsMuted');
          const tt = localStorage.getItem('phoneTextTone') || 'tri-tone';
          if (!isMutedNow) playTextTone(tt);

          const { data } = await supabase.from('profiles').select('username').eq('id', payload.new.profile_id).single();
          const username = data?.username || 'Biri';

          if (activeAppRef.current !== 'social' && window.showDynamicAlert) {
            window.showDynamicAlert(`Sosyal: ${username} yeni bir gönderi paylaştı.`);
          }

          if (window.electronAPI?.showNotification) {
            const hasPin = !!localStorage.getItem('phonePin');
            if (hasPin) {
              window.electronAPI.showNotification("Yeni Bildirim", "Gizli İçerik (Kilitli Sistem)");
            } else {
              window.electronAPI.showNotification(`Tuzluca Social`, `${username} yeni bir gönderi paylaştı.`);
            }
          }
        }
      })
      .subscribe();
  };

  const handleOnboardingComplete = async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('username', data.username).single();
    if (profile) {
      localStorage.setItem('myProfileCache', JSON.stringify(profile));
      setMyProfile(profile);
      setIsDark(profile.theme === 'dark' || profile.theme === 'amoled');
      setOnboarded(true);
      setupUnreadListener(profile.id);
      setupUnreadEmailListener(profile.username);
      setupSocialListener(profile.id);
    }
  };

  const togglePower = () => {
    playLock();
    if (isScreenOff) { setIsScreenOff(false); if (pin) setIsLocked(true); }
    else { setIsScreenOff(true); setActiveApp(null); }
  };

  const handleMute = () => {
    const next = !isMuted; 
    setIsMuted(next); 
    localStorage.setItem('phoneIsMuted', next ? '1' : '');
    setShowMuteHud(true);
    clearTimeout(muteTimer.current); muteTimer.current = setTimeout(() => setShowMuteHud(false), 1800);
  };

  const handleVolume = (delta) => {
    setVolume(v => {
      const next = Math.max(0, Math.min(100, v + delta));
      localStorage.setItem('phoneVolume', next);
      return next;
    }); 
    setShowVolumeHud(true);
    clearTimeout(volTimer.current); volTimer.current = setTimeout(() => setShowVolumeHud(false), 1800);
  };

  const handleOpenApp = (id) => {
    if (id !== 'phone') {
      setRunningApps(prev => prev.includes(id) ? prev : [...prev, id]);
    }
    setActiveApp(id);
    setIsSwitcherOpen(false);
  };

  const handleUninstallApp = (id) => {
    if (defaultInstalledApps.includes(id)) return;
    const next = installedApps.filter(a => a !== id);
    setInstalledApps(next);
    localStorage.setItem('phoneInstalledApps', JSON.stringify(next));
    closeApp(id);
  };

  const handleInstallApp = (id) => {
    const newApps = [...installedApps, id];
    setInstalledApps(newApps);
    localStorage.setItem('phoneInstalledApps', JSON.stringify(newApps));
  };

  const handleShareToApp = (appId, data) => {
    localStorage.setItem('pendingShare', JSON.stringify(data));
    handleOpenApp(appId);
  };

  const swipeUp = (_, info) => { 
    if (isNotifCenterOpen) {
      setIsNotifCenterOpen(false);
      return;
    }
    if (isControlCenterOpen) {
      setIsControlCenterOpen(false);
      return;
    }
    if (info.offset.y < -150 || info.velocity.y < -500) { 
      playClick(); setActiveApp(null); setIsSwitcherOpen(false); 
    } else if (info.offset.y < -40) {
      playClick(); setIsSwitcherOpen(true);
    } 
  };

  const sharedProps = { myProfile, pin, setPin, wallpaper, setWallpaper, ringtone, setRingtone, textTone, setTextTone, volume, setVolume, isMuted, setIsMuted, isDark, setIsDark, brightness, setBrightness, WALLPAPERS, wpBg, alarms, setAlarms, isRecording, setIsRecording, recordingDone, setRecordingDone, isAiListening, setIsAiListening };

  const osApi = {
    setDarkMode: (val) => setIsDark(val),
    setVolume: (val) => { 
      setVolume(val); 
      setIsMuted(val === 0); 
      localStorage.setItem('phoneVolume', val);
    },
    setBrightness: (val) => setBrightness(val),
    openApp: (appId) => handleOpenApp(appId),
    makePhoneCall: (targetName) => {
      if (!onlineUsers || onlineUsers.length === 0) return { success: false, message: 'Şu an ağda kimse çevrimiçi değil.' };
      const target = onlineUsers.find(u => u.nickname.toLowerCase().includes(targetName.toLowerCase()));
      if (!target) return { success: false, message: `'${targetName}' isimli kişi çevrimiçi bulunamadı.` };
      
      handleOpenApp('facetime');
      setTimeout(() => startCall(target.peerId, false), 800);
      return { success: true, message: `${target.nickname} adlı kişi sesli olarak aranıyor...` };
    },
    sendLastPhotoToUser: async (targetUsername, textContent) => {
      try {
        if (!myProfile) return { success: false, message: 'Kullanıcı girişi yapılmamış.' };
        const { data: profiles } = await supabase.from('profiles').select('id, username').ilike('username', `%${targetUsername}%`).limit(1);
        if (!profiles || profiles.length === 0) return { success: false, message: `'${targetUsername}' adında bir kullanıcı bulunamadı.` };
        const targetUser = profiles[0];
        
        const local = await idbStorage.getItem('cameraPhotos') || [];
        let lastPhoto = null;
        if (local.length > 0) {
          lastPhoto = local[0];
        } else if (window.electronAPI?.readPhotos) {
          const loaded = await window.electronAPI.readPhotos();
          if (loaded.length > 0) lastPhoto = loaded[0].url;
        }
        
        if (!lastPhoto) return { success: false, message: 'Galeride gönderilecek hiç fotoğraf yok.' };

        const { error } = await supabase.from('messages').insert([{
          sender_id: myProfile.id,
          receiver_id: targetUser.id,
          content: textContent || '📸 Sana bir fotoğraf gönderdim!',
          image_url: lastPhoto
        }]);

        if (error) return { success: false, message: `Veritabanı hatası: ${error.message}` };
        return { success: true, message: `Fotoğraf başarıyla ${targetUser.username} kişisine gönderildi.` };
      } catch(err) {
        return { success: false, message: err.message };
      }
    }
  };

  const renderApp = (id) => {
    switch(id) {
      case 'settings':    return <SettingsApp {...sharedProps} />;
      case 'messages':    return <MessagesApp myProfile={myProfile} onAppBadgeUpdate={setUnreadMessages} />;
      case 'safari':      return <SafariApp />;
      case 'music':       return <MusicApp ref={musicAppRef} onMusicStateChange={setMusicState} />;
      case 'photos':      return <PhotosApp onShare={setShareData} />;
      case 'camera':      return <CameraApp isActiveApp={activeApp === 'camera'} onOpenApp={handleOpenApp} />;
      case 'social':      return <SocialApp myProfile={myProfile} isActiveApp={activeApp === 'social'} />;
      case 'games':       return <GamesApp myProfile={myProfile} />;
      case 'weather':     return <WeatherApp />;
      case 'maps':        return <MapsApp myProfile={myProfile} />;
      case 'calendar':    return <CalendarApp />;
      case 'notes':       return <NotesApp onShare={setShareData} />;
      case 'wallet':      return <WalletApp />;
      case 'health':      return <HealthApp />;
      case 'clock':       return <ClockApp alarms={alarms} setAlarms={setAlarms} />;
      case 'calculator':  return <CalculatorApp />;
      case 'store':       return <StoreApp installedApps={installedApps} onInstall={handleInstallApp} onOpenApp={handleOpenApp} />;
      case 'ai':          return <AiApp {...sharedProps} osApi={osApi} onOpenApp={handleOpenApp} />;
      case 'borsa':       return <BorsaApp />;
      case 'translate':   return <TranslateApp />;
      case 'recorder':    return <RecorderApp {...sharedProps} />;
      case 'gartic':      return <GarticApp />;
      case 'amiral':      return <AmiralBattiApp />;
      case 'facetime':    return <FacetimeApp onlineUsers={onlineUsers} myId={myPeerId.current} onCallUser={startCall} activeCall={activeCall} localStream={localStream} remoteStream={remoteStream} onEndCall={endCall} />;
      case 'podcast':     return <PodcastApp ref={podcastAppRef} onPodcastStateChange={setPodcastState} />;
      case 'news':        return <NewsApp />;
      case 'pinterest':   return <PinterestApp />;
      case 'mail':        return <MailApp myProfile={myProfile} />;
      case 'files':       return <FilesApp onShare={setShareData} />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="device-frame">
      <div className="hardware-button minimize-button" onClick={() => window.electronAPI?.minimizeWindow()} style={{ cursor:'pointer' }} title="Alta Al" />
      <div className="hardware-button mute-switch" />
      <div className="hardware-button volume-up" />
      <div className="hardware-button volume-down" />
      <div className="hardware-button power-button" />
      <div className="phone-container" style={{ background:'black' }} />
    </div>
  );

  if (!onboarded) return (
    <div className="device-frame">
      <div className="hardware-button minimize-button" onClick={() => window.electronAPI?.minimizeWindow()} style={{ cursor:'pointer' }} title="Alta Al" />
      <div className="hardware-button mute-switch" />
      <div className="hardware-button volume-up" />
      <div className="hardware-button volume-down" />
      <div className="hardware-button power-button" onClick={togglePower} style={{ cursor:'pointer' }} />
      <div className="phone-container">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    </div>
  );

  const lightStatusApps = ['settings', 'weather'];
  const statusDark = (lightStatusApps.includes(activeApp) && !isSwitcherOpen) && !isDark;

  const closeApp = (id) => {
    playClick();
    setRunningApps(prev => prev.filter(a => a !== id));
    if (activeApp === id) setActiveApp(null);
  };

  return (
    <div className="device-frame">
      <div className="hardware-button minimize-button" onClick={() => window.electronAPI?.minimizeWindow()} style={{ cursor:'pointer' }} title="Alta Al" />

      <div className="hardware-button mute-switch" onClick={handleMute} style={{ cursor:'pointer', backgroundColor: isMuted ? '#FF3B30' : '#666' }} />
      <div className="hardware-button volume-up" onClick={() => handleVolume(10)} style={{ cursor:'pointer' }} />
      <div className="hardware-button volume-down" onClick={() => handleVolume(-10)} style={{ cursor:'pointer' }} />
      <div className="hardware-button power-button" onClick={togglePower} style={{ cursor:'pointer' }} />

      <div className="phone-container" onClick={(e) => {
        if (isIslandExpanded) setIsIslandExpanded(false);
      }}>
        <StatusBar dark={statusDark} customAlert={{ set: setCustomAlert }} customAlertTimer={customAlertTimer} isRecording={isRecording} recordingDone={recordingDone} />
        {/* Compute active media state for Dynamic Island */}
        {(() => {
          let mediaState = null;
          let mediaAppRef = null;
          if (musicState?.isPlaying || musicState?.currentSong) {
            mediaState = musicState;
            mediaAppRef = musicAppRef;
          }
          if (podcastState?.isPlaying || (podcastState?.activePodcast && !musicState?.isPlaying)) {
            mediaState = {
              currentSong: {
                title: podcastState.activePodcast.title,
                artist: podcastState.activePodcast.author,
                color: '#A259FF',
                emoji: <Headphones size={24} color="white" />,
                isLive: false,
              },
              isPlaying: podcastState.isPlaying,
              progress: podcastState.progress,
              currentTime: podcastState.currentTime,
              duration: podcastState.duration
            };
            mediaAppRef = podcastAppRef;
          }
          return !isScreenOff && <DynamicIsland isMuted={isMuted} showMuteHud={showMuteHud} volume={volume} showVolumeHud={showVolumeHud} customAlert={customAlert} mediaState={mediaState} mediaAppRef={mediaAppRef} isIslandExpanded={isIslandExpanded} setIsIslandExpanded={setIsIslandExpanded} activeApp={activeApp} activeCall={activeCall} isAiListening={isAiListening} isRecording={isRecording} onOpenApp={handleOpenApp} />;
        })()}

        {!isNotifCenterOpen && !isControlCenterOpen && !isScreenOff && !isLocked && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, zIndex: 9996, display: 'flex' }}>
            <motion.div
              onClick={() => { playClick(); setIsNotifCenterOpen(true); }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 30 || info.velocity.y > 200) {
                  playClick();
                  setIsNotifCenterOpen(true);
                }
              }}
              style={{ flex: 1, height: '100%', cursor: 'pointer' }}
            />
            <motion.div
              onClick={() => { playClick(); setIsControlCenterOpen(true); }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 30 || info.velocity.y > 200) {
                  playClick();
                  setIsControlCenterOpen(true);
                }
              }}
              style={{ flex: 1, height: '100%', cursor: 'pointer' }}
            />
          </div>
        )}

        <div style={{ position:'absolute', inset:0, zIndex:1 }}>
          <img className="home-bg"
            src={activeApp ? undefined : (typeof wallpaper === 'object' ? wallpaper.url : wallpaper)}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              objectFit: 'cover', opacity: isSwitcherOpen ? 0.4 : 1, transition: 'opacity 0.3s',
              display: activeApp ? 'none' : 'block'
            }}
            alt=""
          />
          <HomeScreen onOpenApp={handleOpenApp} onUninstallApp={handleUninstallApp} wallpaper={wallpaper} isDark={isDark} unreadMessages={unreadMessages} unreadEmails={unreadEmails} installedApps={installedApps} defaultInstalledApps={defaultInstalledApps} />

          <NotificationCenter isOpen={isNotifCenterOpen} onClose={() => setIsNotifCenterOpen(false)} myProfile={myProfile} />
          <ControlCenter isOpen={isControlCenterOpen} onClose={() => setIsControlCenterOpen(false)} />
          <ShareSheet data={shareData} onClose={() => setShareData(null)} onShareToApp={handleShareToApp} />
          <PhoneApp myProfile={myProfile} isActiveApp={activeApp === 'phone' && !isSwitcherOpen} />

          <div style={{
            position: 'absolute', inset: 0, zIndex: isSwitcherOpen ? 90 : 1,
            display: isSwitcherOpen ? 'flex' : 'block',
            alignItems: 'center',
            overflowX: isSwitcherOpen ? 'auto' : 'hidden',
            overflowY: 'hidden',
            padding: isSwitcherOpen ? '0 40px' : '0',
            gap: isSwitcherOpen ? 20 : 0,
            scrollSnapType: isSwitcherOpen ? 'x mandatory' : 'none',
            background: isSwitcherOpen ? 'rgba(0,0,0,0.75)' : 'transparent',
            pointerEvents: (isSwitcherOpen || activeApp) ? 'auto' : 'none',
            transition: 'background 0.2s ease-out'
            // Performance: Removed backdrop-filter as it heavily degrades animation FPS
          }}
          onClick={(e) => { if (isSwitcherOpen && e.target === e.currentTarget) setIsSwitcherOpen(false); }}
          >
            <AnimatePresence>
              {runningApps.map(appId => {
                if (appId === 'phone') return null;
                const isAppActive = activeApp === appId && !isSwitcherOpen;
                const isAppHidden = !isAppActive && !isSwitcherOpen;

                return (
                  <motion.div key={`app-${appId}`}
                    layout
                    drag={isSwitcherOpen ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => {
                      if (isSwitcherOpen && (info.offset.y < -50 || info.velocity.y < -200)) closeApp(appId);
                    }}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ 
                      opacity: isAppHidden ? 0 : 1, 
                      y: isAppHidden ? 30 : 0, 
                      scale: isAppHidden ? 0.9 : 1,
                      borderRadius: isSwitcherOpen ? '30px' : '0px',
                      boxShadow: isSwitcherOpen ? '0 10px 40px rgba(0,0,0,0.5)' : '0 0px 0px rgba(0,0,0,0)'
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }}
                    style={{
                      position: isSwitcherOpen ? 'relative' : 'absolute',
                      inset: isSwitcherOpen ? 'auto' : 0,
                      width: isSwitcherOpen ? 220 : '100%',
                      height: isSwitcherOpen ? 450 : '100%',
                      flexShrink: 0,
                      scrollSnapAlign: 'center',
                      overflow: 'hidden', 
                      background: isDark ? '#1c1c1e' : 'white',
                      pointerEvents: isAppActive ? 'auto' : (isSwitcherOpen ? 'auto' : 'none'),
                      display: isAppHidden ? 'none' : 'block',
                      cursor: isSwitcherOpen ? 'pointer' : 'default',
                      zIndex: isAppActive ? 100 : 1,
                      willChange: 'transform, width, height, opacity, border-radius',
                      WebkitTransform: 'translateZ(0)' // Force GPU hardware acceleration
                    }}
                    onClick={() => { if (isSwitcherOpen) handleOpenApp(appId); }}
                  >
                    <div style={{
                      width: '100%', height: '100%', 
                      pointerEvents: isSwitcherOpen ? 'none' : 'auto',
                      transform: 'translateZ(0)'
                    }}>
                      <Suspense fallback={<div style={{ width:'100%', height:'100%', background: isDark ? '#1c1c1e' : '#fff' }} />}>
                        {renderApp(appId)}
                      </Suspense>
                    </div>

                    {isSwitcherOpen && (
                      <motion.div 
                        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
                        style={{position:'absolute', top:15, right:15, width:30, height:30, borderRadius:'50%', background:'rgba(255,59,48,0.2)', color:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:'bold', zIndex: 10}} 
                        onClick={(e) => { e.stopPropagation(); closeApp(appId); }}
                      >
                        ✕
                      </motion.div>
                    )}
                    
                    {isSwitcherOpen && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'absolute', bottom: -25, left: 0, width: '100%', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 13, opacity: 0.8}}>
                        {PAGE1_APPS.find(a => a.id === appId)?.name || DOCK_APPS.find(a => a.id === appId)?.name || appId}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isLocked && !isScreenOff && (
              <motion.div key="lock" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ y:'-100%', opacity:0 }} transition={{ duration:0.3 }} style={{ position:'absolute', inset:0, zIndex:200 }}>
                <LockScreen pin={pin} onUnlock={() => setIsLocked(false)} wallpaper={wallpaper} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <AnimatePresence>
          {isScreenOff && (
            <motion.div key="off" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }} style={{ position:'absolute', inset:0, background:'black', zIndex:9995 }} />
          )}
        </AnimatePresence>

        {/* Incoming Call UI */}
        <AnimatePresence>
          {incomingCall && !activeCall && (
            <motion.div 
              initial={{ y: '-100%', opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: '-100%', opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '50px 20px 30px', background: 'rgba(30,30,30,0.85)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', zIndex: 9998, borderRadius: '0 0 30px 30px', borderBottom: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}
            >
              <div style={{ fontSize: 16, fontWeight: 500, opacity: 0.8, marginBottom: 5 }}>FaceTime Görüntülü Arama</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 30 }}>Biri Sizi Arıyor...</div>
              
              <div style={{ display: 'flex', gap: 40, width: '100%', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <button 
                    onClick={() => { endCall(); }}
                    style={{ width: 70, height: 70, borderRadius: '50%', background: '#FF3B30', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,59,48,0.4)' }}
                  >
                    <PhoneOff size={32} color="white" />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Reddet</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <button 
                    onClick={answerCall}
                    style={{ width: 70, height: 70, borderRadius: '50%', background: '#32D74B', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(50,215,75,0.4)', animation: 'pulse 1.5s infinite' }}
                  >
                    <Video size={32} color="white" />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Aç</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brightness Overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9998,
          backgroundColor: `rgba(0,0,0, ${1 - brightness/100})`,
          transition: 'background-color 0.3s ease',
          borderRadius: '40px'
        }} />

        <motion.div drag="y" dragConstraints={{ top:0, bottom:0 }} onDragEnd={swipeUp}
          onPointerDown={() => {
            window.homePressTimer = setTimeout(() => {
              if (isNotifCenterOpen) setIsNotifCenterOpen(false);
              if (isSwitcherOpen) setIsSwitcherOpen(false);
              playClick();
              setActiveApp('ai');
            }, 600);
          }}
          onPointerUp={() => clearTimeout(window.homePressTimer)}
          onPointerLeave={() => clearTimeout(window.homePressTimer)}
          onClick={() => { 
            clearTimeout(window.homePressTimer);
            if (isNotifCenterOpen) setIsNotifCenterOpen(false);
            else if (isSwitcherOpen) setIsSwitcherOpen(false); 
            else if (activeApp) { playClick(); setActiveApp(null); } 
          }}
          className="home-indicator-container" style={{ zIndex:9999, cursor: (activeApp || isSwitcherOpen) ? 'pointer' : 'default', paddingBottom: 10 }}>
          <div className="home-indicator" style={{ backgroundColor: statusDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }} />
        </motion.div>
      </div>
    </div>
  );
}
