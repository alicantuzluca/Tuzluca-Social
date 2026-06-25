import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Navigation, Info, Car, Footprints, Bus, Mic, BellRing, Target, Eye, EyeOff } from 'lucide-react';
import { playClick } from '../audio';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabaseClient';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = deg2rad(lat2-lat1);  
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

const createAvatarIcon = (name, avatarUrl, isSelf) => {
  const color = isSelf ? '#0A84FF' : '#FF3B30';
  const innerHtml = avatarUrl 
    ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
    : `${name ? name.substring(0, 2).toUpperCase() : '??'}`;

  const html = `
    <div style="
      background-color: ${color};
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-family: -apple-system, sans-serif;
      font-size: 16px;
      overflow: hidden;
    ">
      ${innerHtml}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-avatar-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }
  }, [center]);
  return null;
}

export default function MapsApp({ myProfile }) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [myPos, setMyPos] = useState([41.0082, 28.9784]); 
  const [hasLocation, setHasLocation] = useState(false);
  const [users, setUsers] = useState({}); 
  const [shareLocation, setShareLocation] = useState(() => {
    return localStorage.getItem('maps_shareLocation') !== 'false';
  });
  
  const channelRef = useRef(null);
  const mapCenterRef = useRef(null);

  const nickname = myProfile?.username || 'Misafir';
  const avatarUrl = myProfile?.avatar_url || null;
  const myId = myProfile?.id || useRef(Math.random().toString(36).substring(7)).current;

  const toggleShareLocation = () => {
    playClick();
    const newVal = !shareLocation;
    setShareLocation(newVal);
    localStorage.setItem('maps_shareLocation', newVal);
    if (!newVal && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'offline',
        payload: { id: myId }
      });
    } else {
      if (hasLocation) broadcastLocation(myPos[0], myPos[1]);
    }
  };

  useEffect(() => {
    const channel = supabase.channel('tuzluca-map');
    channelRef.current = channel;

    channel.on('broadcast', { event: 'location' }, ({ payload }) => {
      if (payload.id === myId) return;
      setUsers(prev => ({
        ...prev,
        [payload.id]: { ...payload, lastSeen: Date.now() }
      }));
    });

    channel.on('broadcast', { event: 'offline' }, ({ payload }) => {
      if (payload.id === myId) return;
      setUsers(prev => {
        const next = { ...prev };
        delete next[payload.id];
        return next;
      });
    });

    channel.on('broadcast', { event: 'poke' }, ({ payload }) => {
      if (payload.targetId === myId) {
        playClick();
        if(window.showDynamicAlert) window.showDynamicAlert(`${payload.fromName} sizi dürttü! 👉`);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && hasLocation && shareLocation) {
        broadcastLocation(myPos[0], myPos[1]);
      }
    });

    const cleanup = setInterval(() => {
      const now = Date.now();
      setUsers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(k => {
          if (now - next[k].lastSeen > 60000) { 
            delete next[k];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 10000);

    return () => {
      channel.unsubscribe();
      clearInterval(cleanup);
    };
  }, [hasLocation, shareLocation, myId]);

  const broadcastLocation = (lat, lng) => {
    if (shareLocation && channelRef.current && channelRef.current.state === 'joined') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'location',
        payload: { id: myId, name: nickname, avatar: avatarUrl, lat, lng }
      });
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMyPos([lat, lng]);
          setHasLocation(true);
          broadcastLocation(lat, lng);
        },
        (err) => {
          console.warn("Location error:", err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [shareLocation]); 

  const pokeUser = (userId, userName) => {
    playClick();
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'poke',
        payload: { targetId: userId, fromName: nickname }
      });
      if(window.showDynamicAlert) window.showDynamicAlert(`${userName} dütüldü!`);
    }
  };

  const locateMe = () => {
    playClick();
    if (hasLocation) {
      setMyPos([...myPos]);
    } else {
      if(window.showDynamicAlert) window.showDynamicAlert('Konum aranıyor...');
    }
  };

  const focusUser = (lat, lng) => {
    playClick();
    setSheetExpanded(false);
    setMyPos([lat, lng]);
  };

  const sortedUsers = useMemo(() => {
    const list = Object.values(users).map(u => {
      const dist = getDistanceFromLatLonInKm(myPos[0], myPos[1], u.lat, u.lng);
      return { ...u, distance: dist };
    });
    return list.sort((a, b) => a.distance - b.distance);
  }, [users, myPos]);

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const sheetBg = isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)';
  const textDark = isDark ? '#ffffff' : '#000000';
  const textSub = '#8e8e93';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: isDark ? '#000' : '#e5e5ea', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', overflow: 'hidden' }}>
      
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, filter: isDark ? 'invert(1) hue-rotate(180deg) contrast(0.9) brightness(0.8)' : 'none', transition: 'filter 0.3s' }}>
        <MapContainer center={myPos} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController center={myPos} />
          
          {hasLocation && shareLocation && (
            <Marker position={myPos} icon={createAvatarIcon(nickname, avatarUrl, true)}>
              <Popup>Buradasınız: {nickname}</Popup>
            </Marker>
          )}

          {Object.values(users).map((u) => (
            <Marker key={u.id} position={[u.lat, u.lng]} icon={createAvatarIcon(u.name, u.avatar, false)}>
              <Popup>
                <div style={{ textAlign: 'center', padding: '5px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>{u.name}</div>
                  <button 
                    onClick={(e) => { e.preventDefault(); pokeUser(u.id, u.name); }}
                    style={{ background: '#FF3B30', color: 'white', border: 'none', borderRadius: '15px', padding: '6px 15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}
                  >
                    <BellRing size={16} /> Dürt!
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ position: 'absolute', top: 60, right: 16, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 1000 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={locateMe} style={{ width: 48, height: 48, borderRadius: 12, background: sheetBg, backdropFilter: 'blur(20px)', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Target size={24} color={isDark ? '#0A84FF' : '#007AFF'} />
        </motion.button>
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y < -30) { playClick(); setSheetExpanded(true); }
          else if (info.offset.y > 30) { playClick(); setSheetExpanded(false); }
        }}
        animate={{ y: sheetExpanded ? -380 : 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        style={{ position: 'absolute', bottom: -400, left: 0, right: 0, height: 550, background: sheetBg, backdropFilter: 'blur(30px)', borderRadius: '30px 30px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}
      >
        <div style={{ width: '100%', height: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'grab' }} onClick={() => setSheetExpanded(!sheetExpanded)}>
          <div style={{ width: 40, height: 5, borderRadius: 2.5, background: textSub, opacity: 0.5 }} />
        </div>
        
        <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: textDark }}>Arkadaşımı Bul</h2>
            <p style={{ fontSize: 13, color: textSub, margin: 0 }}>Çevrenizdeki {sortedUsers.length} kişi</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={toggleShareLocation} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: shareLocation ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)', color: shareLocation ? '#34C759' : '#FF3B30', border: 'none', padding: '8px 12px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {shareLocation ? <Eye size={18} /> : <EyeOff size={18} />}
            {shareLocation ? 'Görünür' : 'Gizli'}
          </motion.button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sortedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', color: textSub, marginTop: '20px' }}>Yakınınızda kimse bulunmuyor.</div>
          ) : (
            sortedUsers.map(u => (
              <div key={u.id} onClick={() => focusUser(u.lat, u.lng)} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: '12px 15px', borderRadius: '16px', cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#0A84FF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                  {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" /> : u.name.substring(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: textDark }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: textSub }}>{u.distance < 1 ? (u.distance * 1000).toFixed(0) + ' metre' : u.distance.toFixed(1) + ' km'} uzakta</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); pokeUser(u.id, u.name); }} style={{ background: 'transparent', border: 'none', color: '#FF3B30', cursor: 'pointer' }}>
                  <BellRing size={22} />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

    </div>
  );
}
