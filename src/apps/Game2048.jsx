import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';

const COLORS = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

const getTextColor = val => (val <= 4 ? '#776e65' : '#f9f6f2');

const initializeGrid = () => {
  let grid = Array(4).fill(null).map(() => Array(4).fill(0));
  return addRandomTile(addRandomTile(grid));
};

const addRandomTile = (grid) => {
  let emptyCells = [];
  for (let r=0; r<4; r++) {
    for (let c=0; c<4; c++) {
      if (grid[r][c] === 0) emptyCells.push({r,c});
    }
  }
  if (emptyCells.length === 0) return grid;
  
  const {r,c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const slideAndMerge = (row, setScore) => {
  let arr = row.filter(val => val !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      setScore(s => s + arr[i]);
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < 4) arr.push(0);
  return arr;
};

export default function Game2048({ onBack, onSaveScore }) {
  const [grid, setGrid] = useState(initializeGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const move = useCallback((direction) => {
    if (gameOver) return;
    let newGrid = JSON.parse(JSON.stringify(grid));
    let moved = false;

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r=0; r<4; r++) {
        let row = newGrid[r];
        if (direction === 'RIGHT') row.reverse();
        let newRow = slideAndMerge(row, setScore);
        if (direction === 'RIGHT') newRow.reverse();
        if (newGrid[r].join(',') !== newRow.join(',')) moved = true;
        newGrid[r] = newRow;
      }
    } else {
      for (let c=0; c<4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        if (direction === 'DOWN') col.reverse();
        let newCol = slideAndMerge(col, setScore);
        if (direction === 'DOWN') newCol.reverse();
        for (let r=0; r<4; r++) {
          if (newGrid[r][c] !== newCol[r]) moved = true;
          newGrid[r][c] = newCol[r];
        }
      }
    }

    if (moved) {
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      checkGameOver(newGrid);
    }
  });

  const checkGameOver = (g) => {
    for (let r=0; r<4; r++) {
      for (let c=0; c<4; c++) {
        if (g[r][c] === 0) return;
        if (r<3 && g[r][c] === g[r+1][c]) return;
        if (c<3 && g[r][c] === g[r][c+1]) return;
      }
    }
    setGameOver(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowUp': move('UP'); break;
        case 'ArrowDown': move('DOWN'); break;
        case 'ArrowLeft': move('LEFT'); break;
        case 'ArrowRight': move('RIGHT'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch & Mouse handling
  const [touchStart, setTouchStart] = useState(null);
  const handlePointerDown = e => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setTouchStart({ x: clientX, y: clientY });
  };
  const handlePointerUp = e => {
    if (!touchStart) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const dx = clientX - touchStart.x;
    const dy = clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) move(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      if (Math.abs(dy) > 30) move(dy > 0 ? 'DOWN' : 'UP');
    }
    setTouchStart(null);
  };

  const handleGameOverSave = async () => {
    if (scoreSaved || score === 0) return;
    setScoreSaved(true);
    await onSaveScore(score);
  };

  useEffect(() => {
    if (gameOver) handleGameOverSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#faf8ef', color: '#776e65', fontFamily: '"Clear Sans", "Helvetica Neue", Arial, sans-serif', position: 'relative' }}
      onTouchStart={handlePointerDown} onTouchEnd={handlePointerUp} onMouseDown={handlePointerDown} onMouseUp={handlePointerUp}>
      
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '40px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', fontSize: 16, color: '#776e65', fontWeight: 'bold' }}>
          <ChevronLeft /> Geri
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#bbada0', padding: '5px 15px', borderRadius: 6, color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>Skor</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{score}</div>
          </div>
          <button onClick={() => { setGrid(initializeGrid()); setScore(0); setGameOver(false); setScoreSaved(false); }} 
            style={{ background: '#8f7a66', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 6, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <div style={{ background: '#bbada0', padding: 10, borderRadius: 8, position: 'relative' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {grid.map((row, r) => row.map((val, c) => (
              <div key={`${r}-${c}`} style={{ width: 70, height: 70, background: val ? (COLORS[val] || '#3c3a32') : 'rgba(238, 228, 218, 0.35)', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: val > 1000 ? 24 : 30, fontWeight: 'bold', color: getTextColor(val), transition: 'background 0.15s' }}>
                {val !== 0 ? val : ''}
              </div>
            )))}
          </div>

          {gameOver && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(238, 228, 218, 0.73)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              <h2 style={{ fontSize: 36, fontWeight: 'bold', margin: '0 0 10px' }}>Oyun Bitti!</h2>
              <p style={{ fontSize: 18, fontWeight: 'bold', margin: '0 0 20px' }}>Skorun: {score}</p>
              {scoreSaved && <p style={{ color: '#007AFF', fontWeight: 'bold', marginBottom: 15 }}>Skor Kaydedildi!</p>}
              <button onClick={() => { setGrid(initializeGrid()); setScore(0); setGameOver(false); setScoreSaved(false); }}
                style={{ background: '#8f7a66', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, fontSize: 18, fontWeight: 'bold' }}>
                Tekrar Oyna
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
