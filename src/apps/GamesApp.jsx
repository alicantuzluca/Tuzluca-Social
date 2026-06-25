import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Trophy, Gamepad2 } from 'lucide-react';
import { playClick } from '../audio';
import Game2048 from './Game2048';
import GameFlappy from './GameFlappy';

function Leaderboard({ onBack }) {
  const [scores, setScores] = useState([]);
  const [tab, setTab] = useState('2048');

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase
        .from('game_scores')
        .select('score, game_type, profiles(display_name, avatar_color, username)')
        .eq('game_type', tab)
        .order('score', { ascending: false })
        .limit(10);
      if (data) setScores(data);
    };
    fetchScores();
  }, [tab]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1c1c1e', color: 'white' }}>
      <div style={{ padding: '50px 20px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#007AFF', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={24} /> Geri
        </button>
        <h2 style={{ margin: '0 auto', fontSize: 18, transform: 'translateX(-20px)' }}>Liderlik Tablosu</h2>
      </div>

      <div style={{ display: 'flex', padding: '10px 20px', gap: 10 }}>
        <button onClick={() => setTab('2048')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: tab === '2048' ? '#007AFF' : '#333', color: 'white', border: 'none' }}>2048</button>
        <button onClick={() => setTab('flappy')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: tab === 'flappy' ? '#007AFF' : '#333', color: 'white', border: 'none' }}>Flappy Bird</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {scores.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #333' }}>
            <div style={{ width: 30, fontSize: 18, fontWeight: 'bold', color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#888' }}>
              #{i + 1}
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.profiles?.avatar_color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: 15 }}>
              {(s.profiles?.display_name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{s.profiles?.display_name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>@{s.profiles?.username}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#007AFF' }}>
              {s.score}
            </div>
          </div>
        ))}
        {scores.length === 0 && <div style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>Henüz skor yok.</div>}
      </div>
    </div>
  );
}

export default function GamesApp({ myProfile }) {
  const [view, setView] = useState('hub'); // hub, 2048, flappy, leaderboard

  const saveScore = async (gameType, score) => {
    if (!myProfile) return;
    await supabase.from('game_scores').insert([{ user_id: myProfile.id, game_type: gameType, score }]);
  };

  if (view === '2048') return <Game2048 onBack={() => { playClick(); setView('hub'); }} onSaveScore={score => saveScore('2048', score)} />;
  if (view === 'flappy') return <GameFlappy onBack={() => { playClick(); setView('hub'); }} onSaveScore={score => saveScore('flappy', score)} />;
  if (view === 'leaderboard') return <Leaderboard onBack={() => { playClick(); setView('hub'); }} />;

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      <div style={{ padding: '60px 20px 20px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gamepad2 size={32} color="#007AFF" /> Oyunlar
        </h1>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <motion.div whileTap={{ scale: 0.95 }} onClick={() => { playClick(); setView('2048'); }}
          style={{ background: 'linear-gradient(135deg, #FF9500, #FFCC00)', padding: 20, borderRadius: 16, cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,149,0,0.3)' }}>
          <h2 style={{ fontSize: 24, margin: '0 0 5px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>2048</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>Zeka ve strateji.</p>
        </motion.div>

        <motion.div whileTap={{ scale: 0.95 }} onClick={() => { playClick(); setView('flappy'); }}
          style={{ background: 'linear-gradient(135deg, #34C759, #30D158)', padding: 20, borderRadius: 16, cursor: 'pointer', boxShadow: '0 10px 20px rgba(52,199,89,0.3)' }}>
          <h2 style={{ fontSize: 24, margin: '0 0 5px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Flappy Bird</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>Uçan kuş klasiği.</p>
        </motion.div>

        <motion.div whileTap={{ scale: 0.95 }} onClick={() => { playClick(); setView('leaderboard'); }}
          style={{ background: '#1c1c1e', border: '1px solid #333', padding: 20, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 15 }}>
          <Trophy size={28} color="#FFD700" />
          <div>
            <h2 style={{ fontSize: 18, margin: 0 }}>Liderlik Tablosu</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Kim daha iyi gör!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
