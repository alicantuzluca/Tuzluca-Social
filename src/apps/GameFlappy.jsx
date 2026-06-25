import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';

const GRAVITY = 0.3;
const JUMP = -6.5;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 55;
const PIPE_GAP = 180;
const BIRD_SIZE = 30;

export default function GameFlappy({ onBack, onSaveScore }) {
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Use refs for the game loop to avoid dependency issues
  const birdY = useRef(250);
  const birdVelocity = useRef(0);
  const pipes = useRef([]);
  const scoreRef = useRef(0);
  const requestRef = useRef();

  // Visual state to trigger renders
  const [renderTrigger, setRenderTrigger] = useState(0);

  const resetGame = () => {
    birdY.current = 250;
    birdVelocity.current = 0;
    pipes.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setScoreSaved(false);
    setPlaying(true);
  };

  const jump = useCallback(() => {
    if (!playing && !gameOver) {
      resetGame();
      birdVelocity.current = JUMP; // Start jumping immediately
    } else if (playing) {
      birdVelocity.current = JUMP;
    }
  }, [playing, gameOver]);

  const gameLoop = useCallback(() => {
    if (!playing) return;

    // Physics
    birdVelocity.current += GRAVITY;
    birdY.current += birdVelocity.current;

    // Floor collision
    if (birdY.current > 600 - BIRD_SIZE) {
      birdY.current = 600 - BIRD_SIZE;
      endGame();
      return;
    }
    // Ceiling collision
    if (birdY.current < 0) {
      birdY.current = 0;
      birdVelocity.current = 0;
    }

    // Pipe generation & movement
    let p = pipes.current;
    if (p.length === 0 || p[p.length - 1].x < 200) {
      const topHeight = Math.random() * 250 + 50;
      p.push({ x: 400, topHeight, passed: false });
    }

    p.forEach(pipe => {
      pipe.x -= PIPE_SPEED;

      // Collision detection
      const birdRect = { x: 50, y: birdY.current, w: BIRD_SIZE, h: BIRD_SIZE };
      const topPipeRect = { x: pipe.x, y: 0, w: PIPE_WIDTH, h: pipe.topHeight };
      const bottomPipeRect = { x: pipe.x, y: pipe.topHeight + PIPE_GAP, w: PIPE_WIDTH, h: 600 - pipe.topHeight - PIPE_GAP };

      if (
        (birdRect.x < topPipeRect.x + topPipeRect.w && birdRect.x + birdRect.w > topPipeRect.x && birdRect.y < topPipeRect.y + topPipeRect.h && birdRect.y + birdRect.h > topPipeRect.y) ||
        (birdRect.x < bottomPipeRect.x + bottomPipeRect.w && birdRect.x + birdRect.w > bottomPipeRect.x && birdRect.y < bottomPipeRect.y + bottomPipeRect.h && birdRect.y + birdRect.h > bottomPipeRect.y)
      ) {
        endGame();
      }

      // Scoring
      if (!pipe.passed && pipe.x + PIPE_WIDTH < birdRect.x) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    });

    // Clean up off-screen pipes
    pipes.current = p.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    setRenderTrigger(prev => prev + 1); // Trigger re-render
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [playing]);

  const endGame = () => {
    setPlaying(false);
    setGameOver(true);
    cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  useEffect(() => {
    if (gameOver && !scoreSaved && scoreRef.current > 0) {
      setScoreSaved(true);
      onSaveScore(scoreRef.current);
    }
  }, [gameOver, scoreSaved, onSaveScore]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#70c5ce', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }} onClick={jump}>
      
      <div style={{ position: 'absolute', top: 65, left: 20, zIndex: 10 }}>
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', padding: '8px 12px', borderRadius: 20, color: 'white', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          <ChevronLeft size={20} /> Çıkış
        </button>
      </div>

      <div style={{ position: 'absolute', top: 50, left: 0, width: '100%', textAlign: 'center', zIndex: 5 }}>
        <span style={{ fontSize: 48, fontWeight: 'bold', color: 'white', textShadow: '2px 2px 0 #000' }}>{score}</span>
      </div>

      {/* Bird */}
      <div style={{
        position: 'absolute',
        top: birdY.current,
        left: 50,
        width: BIRD_SIZE,
        height: BIRD_SIZE,
        background: '#f4d142', // Bird color
        borderRadius: '50%',
        border: '2px solid #000',
        transform: `rotate(${Math.min(birdVelocity.current * 3, 90)}deg)`,
        transition: 'transform 0.1s'
      }}>
        {/* Eye */}
        <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: 'white', borderRadius: '50%' }}>
          <div style={{ position: 'absolute', top: 2, right: 1, width: 3, height: 3, background: 'black', borderRadius: '50%' }} />
        </div>
        {/* Beak */}
        <div style={{ position: 'absolute', top: 15, right: -5, width: 12, height: 8, background: '#f45c42', borderRadius: '5px' }} />
      </div>

      {/* Pipes */}
      {pipes.current.map((pipe, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', top: 0, left: pipe.x, width: PIPE_WIDTH, height: pipe.topHeight, background: '#74bf2e', border: '2px solid #543847', borderTop: 'none' }} />
          <div style={{ position: 'absolute', top: pipe.topHeight + PIPE_GAP, left: pipe.x, width: PIPE_WIDTH, height: 600 - pipe.topHeight - PIPE_GAP, background: '#74bf2e', border: '2px solid #543847', borderBottom: 'none' }} />
        </React.Fragment>
      ))}

      {/* Ground (decorative) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 100, background: '#ded895', borderTop: '4px solid #73bf2e', zIndex: 6, display: 'flex' }}>
         <div style={{ width: '100%', height: 10, background: '#543847', marginTop: -4 }} />
      </div>

      {/* UI Overlays */}
      {!playing && !gameOver && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textShadow: '2px 2px 0 #000', textAlign: 'center' }}>
            Ekrana Dokun<br/><span style={{ fontSize: 16 }}>Zıplamak için tıkla</span>
          </div>
        </div>
      )}

      {gameOver && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#ded895', border: '3px solid #543847', padding: '20px 40px', borderRadius: 10, textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px', color: '#543847' }}>Oyun Bitti!</h2>
            <div style={{ fontSize: 18, color: '#543847', marginBottom: 20 }}>
              Skor: <span style={{ fontWeight: 'bold', fontSize: 24 }}>{score}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); resetGame(); }} style={{ background: '#f45c42', color: 'white', border: '2px solid #000', padding: '10px 20px', borderRadius: 8, fontSize: 18, fontWeight: 'bold' }}>
              Tekrar Oyna
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
