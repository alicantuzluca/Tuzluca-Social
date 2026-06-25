import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { playClick } from '../audio';

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const formatDisplay = (numStr) => {
    if (numStr === 'Error') return 'Hata';
    const num = parseFloat(numStr);
    if (isNaN(num)) return '0';
    let formatted = num.toLocaleString('tr-TR', { maximumFractionDigits: 8 });
    if (numStr.endsWith(',')) formatted += ',';
    else if (numStr.includes(',') && numStr.endsWith('0')) {
       // A bit tricky to handle exact trailing zeroes in JS locale string, but good enough for simple UI
    }
    return formatted.replace('.', ',');
  };

  const handleNum = (n) => {
    playClick();
    if (waitingForNewValue) {
      setDisplay(String(n));
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? String(n) : display + String(n));
    }
  };

  const handleComma = () => {
    playClick();
    if (waitingForNewValue) {
      setDisplay('0,');
      setWaitingForNewValue(false);
    } else if (!display.includes(',')) {
      setDisplay(display + ',');
    }
  };

  const handleClear = () => {
    playClick();
    setDisplay('0');
    setPrevVal(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleToggleSign = () => {
    playClick();
    if (display === '0') return;
    setDisplay(String(parseFloat(display.replace(',', '.')) * -1).replace('.', ','));
  };

  const handlePercent = () => {
    playClick();
    setDisplay(String(parseFloat(display.replace(',', '.')) / 100).replace('.', ','));
  };

  const calculate = (a, b, op) => {
    a = parseFloat(String(a).replace(',', '.'));
    b = parseFloat(String(b).replace(',', '.'));
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return b === 0 ? 'Error' : a / b;
    return b;
  };

  const handleOp = (op) => {
    playClick();
    if (operator && !waitingForNewValue) {
      const result = calculate(prevVal, display, operator);
      setDisplay(String(result).replace('.', ','));
      setPrevVal(String(result).replace('.', ','));
    } else {
      setPrevVal(display);
    }
    setOperator(op);
    setWaitingForNewValue(true);
  };

  const handleEqual = () => {
    playClick();
    if (!operator || !prevVal) return;
    const result = calculate(prevVal, display, operator);
    setDisplay(String(result).replace('.', ','));
    setPrevVal(null);
    setOperator(null);
    setWaitingForNewValue(true);
  };

  const btnProps = {
    whileTap: { scale: 0.9 },
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  };

  const btnStyle = (bg, color, isZero = false) => ({
    background: bg,
    color: color,
    height: '75px',
    width: isZero ? '165px' : '75px',
    borderRadius: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isZero ? 'flex-start' : 'center',
    paddingLeft: isZero ? '28px' : '0',
    fontSize: '36px',
    fontWeight: '400',
    cursor: 'pointer',
    userSelect: 'none',
  });

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      
      {/* Display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 24px 10px', fontSize: display.length > 8 ? '54px' : '80px', fontWeight: '300', wordBreak: 'break-all', lineHeight: 1 }}>
        {formatDisplay(display)}
      </div>

      {/* Keypad */}
      <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <motion.div {...btnProps} onClick={handleClear} style={btnStyle('#a5a5a5', '#000')}>{display === '0' ? 'AC' : 'C'}</motion.div>
          <motion.div {...btnProps} onClick={handleToggleSign} style={btnStyle('#a5a5a5', '#000')}>⁺∕₋</motion.div>
          <motion.div {...btnProps} onClick={handlePercent} style={btnStyle('#a5a5a5', '#000')}>%</motion.div>
          <motion.div {...btnProps} onClick={() => handleOp('÷')} style={btnStyle(operator==='÷'&&waitingForNewValue?'#fff':'#ff9f0a', operator==='÷'&&waitingForNewValue?'#ff9f0a':'#fff')}>÷</motion.div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <motion.div {...btnProps} onClick={() => handleNum(7)} style={btnStyle('#333333', '#fff')}>7</motion.div>
          <motion.div {...btnProps} onClick={() => handleNum(8)} style={btnStyle('#333333', '#fff')}>8</motion.div>
          <motion.div {...btnProps} onClick={() => handleNum(9)} style={btnStyle('#333333', '#fff')}>9</motion.div>
          <motion.div {...btnProps} onClick={() => handleOp('×')} style={btnStyle(operator==='×'&&waitingForNewValue?'#fff':'#ff9f0a', operator==='×'&&waitingForNewValue?'#ff9f0a':'#fff')}>×</motion.div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <motion.div {...btnProps} onClick={() => handleNum(4)} style={btnStyle('#333333', '#fff')}>4</motion.div>
          <motion.div {...btnProps} onClick={() => handleNum(5)} style={btnStyle('#333333', '#fff')}>5</motion.div>
          <motion.div {...btnProps} onClick={() => handleNum(6)} style={btnStyle('#333333', '#fff')}>6</motion.div>
          <motion.div {...btnProps} onClick={() => handleOp('-')} style={btnStyle(operator==='-'&&waitingForNewValue?'#fff':'#ff9f0a', operator==='-'&&waitingForNewValue?'#ff9f0a':'#fff')}>−</motion.div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <motion.div {...btnProps} onClick={() => handleNum(1)} style={btnStyle('#333333', '#fff')}>1</motion.div>
          <motion.div {...btnProps} onClick={() => handleNum(2)} style={btnStyle('#333333', '#fff')}>2</motion.div>
          <motion.div {...btnProps} onClick={() => handleNum(3)} style={btnStyle('#333333', '#fff')}>3</motion.div>
          <motion.div {...btnProps} onClick={() => handleOp('+')} style={btnStyle(operator==='+'&&waitingForNewValue?'#fff':'#ff9f0a', operator==='+'&&waitingForNewValue?'#ff9f0a':'#fff')}>+</motion.div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <motion.div {...btnProps} onClick={() => handleNum(0)} style={btnStyle('#333333', '#fff', true)}>0</motion.div>
          <motion.div {...btnProps} onClick={handleComma} style={btnStyle('#333333', '#fff')}>,</motion.div>
          <motion.div {...btnProps} onClick={handleEqual} style={btnStyle('#ff9f0a', '#fff')}>=</motion.div>
        </div>
      </div>

    </div>
  );
}
