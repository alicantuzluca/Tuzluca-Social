import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Zap, ZapOff, RefreshCcw, Image as ImageIcon } from 'lucide-react';
import { idbStorage } from '../storage';

export default function CameraApp({ isActiveApp = true, onOpenApp }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | active | error
  const [lastPhoto, setLastPhoto] = useState(null);
  const [facing, setFacing] = useState('environment'); // environment | user
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState('photo'); // photo | video
  const [shutterFlash, setShutterFlash] = useState(false);

  useEffect(() => {
    async function loadLast() {
      const existing = await idbStorage.getItem('cameraPhotos') || [];
      if (existing.length > 0) setLastPhoto(existing[0]);
    }
    loadLast();
  }, [shutterFlash]);

  useEffect(() => {
    let isCancelled = false;

    const startCamera = async () => {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setStatus('loading');
      try {
        const constraints = {
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: facing },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ignore AbortError when play is interrupted by React unmounting or StrictMode
          await videoRef.current.play().catch(e => {
            if (e.name !== 'AbortError') throw e;
          });
          if (!isCancelled) setStatus('active');
        }
      } catch (err) {
        if (!isCancelled && err.name !== 'AbortError') {
          console.error('Camera error:', err);
          setStatus('error');
        }
      }
    };

    if (isActiveApp) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setStatus('loading');
    }

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActiveApp, facing]);

  const takePicture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Shutter flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 150);

    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    
    // If front camera, flip horizontally before saving
    if (facing === 'user') {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    
    const dataUrl = c.toDataURL('image/jpeg', 0.85);

    // Save to physical hard drive if possible
    if (window.electronAPI?.savePhoto) {
      await window.electronAPI.savePhoto(dataUrl);
    }

    // Save to idbStorage gallery
    try {
      const existing = await idbStorage.getItem('cameraPhotos') || [];
      const newPhotos = [dataUrl, ...existing].slice(0, 100);
      await idbStorage.setItem('cameraPhotos', newPhotos);
      setLastPhoto(dataUrl);
    } catch (err) {
      console.warn('Storage error:', err);
    }
  };

  const flipCamera = () => {
    const newFacing = facing === 'environment' ? 'user' : 'environment';
    setFacing(newFacing);
    startCamera(newFacing);
  };

  if (status === 'error') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', textAlign: 'center', padding: '30px' }}>
        <div style={{ marginBottom: '20px' }}><CameraOff size={64} strokeWidth={1} /></div>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '10px' }}>Kamera Erişimi Reddedildi</h2>
        <p style={{ color: '#8e8e93', fontSize: '15px', lineHeight: 1.5 }}>
          Kamerayı kullanmak için tarayıcı izinlerinizden kamera erişimine izin verin, ardından sayfayı yenileyin.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      {/* Loading */}
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ color: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '16px' }}><Camera size={48} strokeWidth={1.5} /></div>
            <div style={{ fontSize: '16px', color: '#8e8e93' }}>Kamera açılıyor...</div>
          </div>
        </div>
      )}

      {/* Shutter flash overlay */}
      <AnimatePresence>
        {shutterFlash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, background: 'black', zIndex: 30, pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>

      {/* Video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'active' ? 'block' : 'none', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Controls */}
      {status === 'active' && (
        <div style={{ position: 'absolute', top: '55px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setFlash(f => !f)} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', color: flash ? '#FFD60A' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            {flash ? <Zap size={18} fill="#FFD60A" /> : <ZapOff size={18} />}
          </motion.button>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', padding: '4px 8px', backdropFilter: 'blur(10px)' }}>
            {['Fotoğraf', 'Video'].map((m, i) => (
              <button key={m} onClick={() => setMode(i === 0 ? 'photo' : 'video')} style={{ background: mode === (i === 0 ? 'photo' : 'video') ? 'rgba(255,255,255,0.25)' : 'none', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>{m}</button>
            ))}
          </div>
          <div style={{ width: '38px' }} />
        </div>
      )}

      {/* Bottom Controls */}
      {status === 'active' && (
        <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 30px' }}>
          {/* Last photo thumbnail */}
          <div onClick={() => onOpenApp && onOpenApp('photos')} style={{ width: '50px', height: '50px', borderRadius: '10px', border: '2px solid white', background: '#333', overflow: 'hidden', cursor: 'pointer' }}>
            {lastPhoto ? (
              <img src={lastPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="last" />
            ) : (
              <ImageIcon size={24} color="white" style={{ margin: '13px' }} />
            )}
          </div>
          {/* Shutter */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={takePicture}
            style={{ width: '76px', height: '76px', borderRadius: '50%', border: '4px solid white', background: mode === 'video' ? '#FF3B30' : 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {mode === 'video' && <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#FF3B30' }} />}
          </motion.button>
          {/* Flip camera */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={flipCamera}
            style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', color: 'white', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCcw size={22} />
          </motion.button>
        </div>
      )}

      {/* Mode selector */}
      {status === 'active' && (
        <div style={{ position: 'absolute', bottom: '128px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {['Portre', 'Fotoğraf', 'Video', 'Slow Mo'].map((m, i) => (
            <span key={m} style={{ color: i === 1 ? '#FFD60A' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: i === 1 ? '700' : '500', cursor: 'pointer' }}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}
