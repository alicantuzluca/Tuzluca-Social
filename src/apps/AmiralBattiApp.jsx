import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { playClick, playTada, playTick } from '../audio';
import { Ship, Crosshair, Anchor, ShieldAlert } from 'lucide-react';

const SHIPS = [
  { id: 'carrier', name: 'Uçak Gemisi', size: 5, color: '#FF3B30' },
  { id: 'battleship', name: 'Kruvazör', size: 4, color: '#FF9500' },
  { id: 'destroyer', name: 'Muhrip', size: 3, color: '#FFCC00' },
  { id: 'submarine', name: 'Denizaltı', size: 3, color: '#4CD964' },
  { id: 'patrol', name: 'Hücumbot', size: 2, color: '#5AC8FA' }
];

export default function AmiralBattiApp() {
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, PLACEMENT, WAITING, PLAYING, GAMEOVER
  const [myGrid, setMyGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [opponentGrid, setOpponentGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  
  const [availableShips, setAvailableShips] = useState(SHIPS);
  const [selectedShip, setSelectedShip] = useState(null); // Changed from draggedShip
  const [orientation, setOrientation] = useState('horizontal');
  
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [winner, setWinner] = useState(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isInGame, setIsInGame] = useState(false);

  const [myPlayAgain, setMyPlayAgain] = useState(false);
  const [opponentPlayAgain, setOpponentPlayAgain] = useState(false);

  const nickname = localStorage.getItem('gartic_nickname') || 'Oyuncu';
  const myId = useRef(Math.random().toString(36).substring(7)).current;
  const channelRef = useRef(null);
  const gameIdRef = useRef(null);

  // LOBBY Matchmaking logic
  useEffect(() => {
    let searchInterval;
    
    if (gameState === 'LOBBY') {
      const lobbyChannel = supabase.channel('battleship-lobby-v2');
      
      const handleMatchFound = (opponentId) => {
        const sortedIds = [myId, opponentId].sort();
        gameIdRef.current = `game_${sortedIds[0]}_${sortedIds[1]}`;
        // The one whose ID is first in sort gets the first turn
        setIsMyTurn(myId === sortedIds[0]);
        setGameState('PLACEMENT');
        setIsInGame(true);
        if (window.showDynamicAlert) window.showDynamicAlert('Eşleşme bulundu!');
      };

      lobbyChannel.on('broadcast', { event: 'looking_for_match' }, ({ payload }) => {
        if (payload.id !== myId && gameState === 'LOBBY') {
          // Found someone looking, send accept
          lobbyChannel.send({
            type: 'broadcast',
            event: 'match_accept',
            payload: { from: myId, to: payload.id }
          });
          handleMatchFound(payload.id);
        }
      });

      lobbyChannel.on('broadcast', { event: 'match_accept' }, ({ payload }) => {
        if (payload.to === myId && gameState === 'LOBBY') {
          handleMatchFound(payload.from);
        }
      });

      lobbyChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce I am looking
          searchInterval = setInterval(() => {
            if (gameState === 'LOBBY') {
              lobbyChannel.send({
                type: 'broadcast',
                event: 'looking_for_match',
                payload: { id: myId }
              });
            }
          }, 2000);
        }
      });

      return () => {
        clearInterval(searchInterval);
        lobbyChannel.unsubscribe();
      };
    }
  }, [gameState, myId]);

  const myGridRef = useRef(myGrid);
  useEffect(() => { myGridRef.current = myGrid; }, [myGrid]);

  const opponentGridRef = useRef(opponentGrid);
  useEffect(() => { opponentGridRef.current = opponentGrid; }, [opponentGrid]);

  const opponentReadyRef = useRef(opponentReady);
  useEffect(() => { opponentReadyRef.current = opponentReady; }, [opponentReady]);

  // GAME logic
  useEffect(() => {
    if (isInGame && gameIdRef.current) {
      const channel = supabase.channel(gameIdRef.current);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'ready' }, ({ payload }) => {
        if (payload.id !== myId) {
          setOpponentReady(true);
          opponentReadyRef.current = true;
          setGameState(prev => {
            if (prev === 'WAITING') {
              if(window.showDynamicAlert) window.showDynamicAlert('Oyun Başladı!');
              return 'PLAYING';
            }
            return prev;
          });
        }
      });

      channel.on('broadcast', { event: 'shoot' }, ({ payload }) => {
        if (payload.id !== myId) {
          handleIncomingShot(payload.r, payload.c);
        }
      });

      channel.on('broadcast', { event: 'shot_result' }, ({ payload }) => {
        if (payload.id !== myId) {
          updateOpponentGrid(payload.r, payload.c, payload.hit, payload.sunk, payload.sunkShipId);
        }
      });

      channel.on('broadcast', { event: 'game_over' }, ({ payload }) => {
        if (payload.id !== myId) {
          setWinner('ME');
          setGameState('GAMEOVER');
          playTada();
          if(window.showDynamicAlert) window.showDynamicAlert('Rakip tüm gemilerini kaybetti. KAZANDIN!');
        }
      });

      channel.on('broadcast', { event: 'play_again' }, ({ payload }) => {
        if (payload.id !== myId) {
          setOpponentPlayAgain(true);
        }
      });

      channel.on('broadcast', { event: 'leave_game' }, ({ payload }) => {
        if (payload.id !== myId) {
          if (window.showDynamicAlert) window.showDynamicAlert('Rakip oyundan ayrıldı.');
          resetToLobby();
        }
      });

      channel.subscribe();
      return () => channel.unsubscribe();
    }
  }, [isInGame]); // Only depend on isInGame so channel is not destroyed on every move

  useEffect(() => {
    if (myPlayAgain && opponentPlayAgain) {
      restartGame();
    }
  }, [myPlayAgain, opponentPlayAgain]);

  const resetToLobby = () => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'leave_game', payload: { id: myId } });
      channelRef.current.unsubscribe();
    }
    setGameState('LOBBY');
    setMyGrid(Array(10).fill(null).map(() => Array(10).fill(null)));
    setOpponentGrid(Array(10).fill(null).map(() => Array(10).fill(null)));
    setAvailableShips(SHIPS);
    setSelectedShip(null);
    setOrientation('horizontal');
    setWinner(null);
    setOpponentReady(false);
    setMyPlayAgain(false);
    setOpponentPlayAgain(false);
    gameIdRef.current = null;
    setIsInGame(false);
  };

  const restartGame = () => {
    setGameState('PLACEMENT');
    setMyGrid(Array(10).fill(null).map(() => Array(10).fill(null)));
    setOpponentGrid(Array(10).fill(null).map(() => Array(10).fill(null)));
    setAvailableShips(SHIPS);
    setSelectedShip(null);
    setOrientation('horizontal');
    setWinner(null);
    setOpponentReady(false);
    setMyPlayAgain(false);
    setOpponentPlayAgain(false);
  };

  const handleIncomingShot = (r, c) => {
    const cell = myGridRef.current[r][c];
    let hit = false;
    let sunk = false;
    
    if (cell && cell !== 'MISS' && cell !== 'HIT' && !cell.isHit) {
      hit = true;
      const newGrid = [...myGridRef.current];
      newGrid[r] = [...newGrid[r]];
      const shipId = cell.shipId;
      newGrid[r][c] = { ...cell, isHit: true };
      setMyGrid(newGrid);
      playTick();

      const isSunk = !newGrid.flat().some(x => x && x.shipId === shipId && !x.isHit);
      if (isSunk) sunk = true;

      const allSunk = !newGrid.flat().some(x => x && x.shipId && !x.isHit);
      
      // Send result back immediately
      channelRef.current.send({
        type: 'broadcast',
        event: 'shot_result',
        payload: { id: myId, r, c, hit, sunk, sunkShipId: sunk ? shipId : null }
      });

      if (allSunk) {
        setTimeout(() => {
          channelRef.current.send({
            type: 'broadcast',
            event: 'game_over',
            payload: { id: myId }
          });
          setWinner('OPPONENT');
          setGameState('GAMEOVER');
        }, 500);
      }
    } else {
      const newGrid = [...myGridRef.current];
      newGrid[r] = [...newGrid[r]];
      if (!newGrid[r][c]) newGrid[r][c] = 'MISS';
      setMyGrid(newGrid);
      playClick();
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'shot_result',
        payload: { id: myId, r, c, hit, sunk, sunkShipId: null }
      });
      setIsMyTurn(true); // Opponent missed, my turn
    }
  };

  const updateOpponentGrid = (r, c, hit, sunk, sunkShipId) => {
    const newGrid = [...opponentGridRef.current];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = hit ? 'HIT' : 'MISS';
    setOpponentGrid(newGrid);

    if (hit) {
      playTick();
      if (sunk && window.showDynamicAlert) {
        const shipObj = SHIPS.find(s => s.id === sunkShipId);
        window.showDynamicAlert(`Rakibin ${shipObj ? shipObj.name : 'gemisi'} battı!`);
      }
      // Hit means I get to shoot again, so isMyTurn remains true
    } else {
      playClick();
      setIsMyTurn(false); // Miss means turn ends
    }
  };

  const handleShoot = (r, c) => {
    if (gameState !== 'PLAYING' || !isMyTurn || opponentGrid[r][c]) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'shoot',
      payload: { id: myId, r, c }
    });
    // Optimistically wait for result... (could add a loading state here)
  };

  const handleShipSelect = (ship) => {
    playClick();
    setSelectedShip(selectedShip?.id === ship.id ? null : ship);
  };

  const handleGridClick = (r, c) => {
    if (gameState !== 'PLACEMENT') return;
    
    // If a ship is selected, try to place it
    if (selectedShip) {
      let valid = true;
      for (let i = 0; i < selectedShip.size; i++) {
        let rr = r + (orientation === 'vertical' ? i : 0);
        let cc = c + (orientation === 'horizontal' ? i : 0);
        if (rr >= 10 || cc >= 10 || myGrid[rr][cc]) valid = false;
      }

      if (valid) {
        const newGrid = [...myGrid];
        for (let i = 0; i < selectedShip.size; i++) {
          let rr = r + (orientation === 'vertical' ? i : 0);
          let cc = c + (orientation === 'horizontal' ? i : 0);
          newGrid[rr] = [...newGrid[rr]];
          newGrid[rr][cc] = { shipId: selectedShip.id, color: selectedShip.color, isHit: false };
        }
        setMyGrid(newGrid);
        setAvailableShips(availableShips.filter(s => s.id !== selectedShip.id));
        setSelectedShip(null);
        playClick();
      } else {
        if(window.showDynamicAlert) window.showDynamicAlert('Buraya yerleştirilemez!');
        playClick(); // Error sound could be added
      }
    }
  };

  const handleReady = () => {
    channelRef.current.send({
      type: 'broadcast',
      event: 'ready',
      payload: { id: myId }
    });
    setGameState(prev => {
      if (opponentReadyRef.current) {
        if(window.showDynamicAlert) window.showDynamicAlert('Oyun Başladı!');
        return 'PLAYING';
      }
      return 'WAITING';
    });
  };

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#1c1c1e' : '#f2f2f7';
  const textDark = isDark ? '#ffffff' : '#000000';
  const cellBg = isDark ? '#2c2c2e' : '#e5e5ea';
  const cellBorder = isDark ? '#3a3a3c' : '#c7c7cc';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: textDark, fontFamily: '-apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ paddingTop: 50, paddingBottom: 15, textAlign: 'center', background: isDark ? '#000' : '#fff', borderBottom: `1px solid ${cellBorder}` }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Anchor size={24} color="#0A84FF" />
          Amiral Battı
        </h1>
        <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 4 }}>
          {gameState === 'LOBBY' && 'Rakip Bekleniyor...'}
          {gameState === 'PLACEMENT' && 'Gemilerini Yerleştir'}
          {gameState === 'WAITING' && 'Rakibin Hazır Olması Bekleniyor...'}
          {gameState === 'PLAYING' && (isMyTurn ? 'Senin Sıran - Ateş Et!' : 'Rakibin Sırası')}
          {gameState === 'GAMEOVER' && (winner === 'ME' ? 'Kazandın! 🎉' : 'Kaybettin! 😢')}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* LOBBY */}
        {gameState === 'LOBBY' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 15 }}>
            <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #0A84FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p>Eşleşme aranıyor...</p>
          </div>
        )}

        {/* PLACEMENT */}
        {gameState === 'PLACEMENT' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Gemiler ({availableShips.length})</span>
                <button 
                  onClick={() => { playClick(); setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal'); }}
                  style={{ background: '#0A84FF', color: '#fff', border: 'none', borderRadius: 12, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Döndür: {orientation === 'horizontal' ? 'Yatay' : 'Dikey'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', minHeight: 60, padding: 10, background: cellBg, borderRadius: 12 }}>
                {availableShips.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => handleShipSelect(s)}
                    style={{ 
                      background: s.color, 
                      padding: '5px 10px', 
                      borderRadius: 6, 
                      color: '#fff', 
                      fontWeight: 600, 
                      fontSize: 13, 
                      cursor: 'pointer',
                      border: selectedShip?.id === s.id ? '2px solid white' : '2px solid transparent',
                      boxShadow: selectedShip?.id === s.id ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                      transform: selectedShip?.id === s.id ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {s.name} ({s.size})
                  </div>
                ))}
                {availableShips.length === 0 && <span style={{ color: '#8e8e93', fontSize: 14 }}>Tüm gemiler yerleştirildi.</span>}
                {availableShips.length > 0 && !selectedShip && <span style={{ color: '#8e8e93', fontSize: 13, width: '100%', marginTop: 5 }}>Yerleştirmek için bir gemi seçin ve ızgaraya dokunun.</span>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              {myGrid.map((row, r) => (
                <div key={r} style={{ display: 'flex', gap: 5 }}>
                  {row.map((cell, c) => (
                    <div 
                      key={`${r}-${c}`}
                      onClick={() => handleGridClick(r, c)}
                      style={{ 
                        width: 30, height: 30, borderRadius: 4, 
                        background: cell ? cell.color : cellBg, 
                        border: `1px solid ${cellBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: selectedShip && !cell ? 'crosshair' : 'default'
                      }}
                    >
                      {cell && <Ship size={16} color="rgba(255,255,255,0.5)" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {availableShips.length === 0 && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleReady}
                style={{ width: '100%', padding: 16, background: '#32D74B', color: '#fff', border: 'none', borderRadius: 16, fontSize: 18, fontWeight: 700, marginTop: 10, cursor: 'pointer' }}
              >
                Hazırım! Savaş Başlasın
              </motion.button>
            )}
          </>
        )}

        {/* PLAYING / WAITING / GAMEOVER */}
        {(gameState === 'PLAYING' || gameState === 'WAITING' || gameState === 'GAMEOVER') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center' }}>
            
            {/* Opponent Grid (Target) */}
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 16, textAlign: 'center', color: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Crosshair size={18}/> Düşman Suları</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {opponentGrid.map((row, r) => (
                  <div key={r} style={{ display: 'flex', gap: 4 }}>
                    {row.map((cell, c) => (
                      <div 
                        key={`opp-${r}-${c}`}
                        onClick={() => handleShoot(r, c)}
                        style={{ 
                          width: 28, height: 28, borderRadius: 4, 
                          background: cell === 'HIT' ? '#FF3B30' : cell === 'MISS' ? '#0A84FF' : cellBg, 
                          border: `1px solid ${cellBorder}`,
                          cursor: isMyTurn && !cell && gameState === 'PLAYING' ? 'pointer' : 'default',
                          opacity: isMyTurn ? 1 : 0.6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {cell === 'HIT' && <span style={{ color: 'white', fontWeight: 'bold' }}>✕</span>}
                        {cell === 'MISS' && <span style={{ color: 'white', fontSize: 20 }}>·</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: 1, background: cellBorder }} />

            {/* My Grid */}
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 16, textAlign: 'center', color: '#32D74B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><ShieldAlert size={18}/> Kendi Sularım</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {myGrid.map((row, r) => (
                  <div key={r} style={{ display: 'flex', gap: 4 }}>
                    {row.map((cell, c) => (
                      <div 
                        key={`my-${r}-${c}`}
                        style={{ 
                          width: 25, height: 25, borderRadius: 4, 
                          background: cell === 'MISS' ? '#0A84FF' : (cell && cell.color) ? cell.color : cellBg, 
                          border: `1px solid ${cellBorder}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: (cell === 'MISS' || (cell && cell.isHit)) ? 0.8 : 1
                        }}
                      >
                        {cell === 'MISS' && <span style={{ color: 'white', fontSize: 18 }}>·</span>}
                        {cell && cell.isHit && <span style={{ color: 'white', fontWeight: 'bold' }}>✕</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* GAMEOVER OVERLAY */}
      {gameState === 'GAMEOVER' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, color: 'white', padding: 20, textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 36, marginBottom: 15, marginTop: 0 }}>{winner === 'ME' ? 'Kazandın! 🎉' : 'Kaybettin! 😢'}</h2>
          <span style={{ fontSize: 18, fontWeight: 600, marginBottom: 25, opacity: 0.9 }}>
            Tekrar Oynama İsteği: { (myPlayAgain ? 1 : 0) + (opponentPlayAgain ? 1 : 0) } / 2
          </span>
          <div style={{ display: 'flex', gap: 15 }}>
            <button 
              onClick={() => {
                playClick();
                setMyPlayAgain(true);
                channelRef.current.send({ type: 'broadcast', event: 'play_again', payload: { id: myId } });
              }}
              disabled={myPlayAgain}
              style={{ background: myPlayAgain ? '#8e8e93' : '#32D74B', color: 'white', padding: '14px 24px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 16, cursor: myPlayAgain ? 'default' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              Tekrar Oyna
            </button>
            <button 
              onClick={() => {
                playClick();
                resetToLobby();
              }}
              style={{ background: '#FF3B30', color: 'white', padding: '14px 24px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              Çık
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
