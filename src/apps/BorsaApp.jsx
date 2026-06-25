import React, { useState, useEffect } from 'react';

export default function BorsaApp() {
  const [rates, setRates] = useState([
    { symbol: 'USD/TRY', name: 'Amerikan Doları', rawPrice: 0, price: '...', change: '0.00', isPositive: true, format: 'fiat' },
    { symbol: 'EUR/TRY', name: 'Euro', rawPrice: 0, price: '...', change: '0.00', isPositive: true, format: 'fiat' },
    { symbol: 'GLD/TRY', name: 'Gram Altın', rawPrice: 0, price: '...', change: '0.00', isPositive: true, format: 'fiat' },
    { symbol: 'BIST100', name: 'Borsa İstanbul', rawPrice: 0, price: '...', change: '0.00', isPositive: true, format: 'fiat' },
    { symbol: 'BTC/TRY', name: 'Bitcoin', rawPrice: 0, price: '...', change: '0.00', isPositive: true, format: 'crypto' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        
        const usdToTry = data.rates.TRY;
        const usdToEur = data.rates.EUR;
        const eurToTry = usdToTry / usdToEur;
        
        const gldToTry = usdToTry * 77.5; 

        const generateChange = () => {
          const change = (Math.random() * 3) - 1.2; 
          return {
            val: Math.abs(change).toFixed(2),
            isPositive: change >= 0
          };
        };

        const cUsd = generateChange();
        const cEur = generateChange();
        const cGld = generateChange();
        const cBist = generateChange();
        const cBtc = generateChange();

        setRates([
          { symbol: 'USD/TRY', name: 'Amerikan Doları', rawPrice: usdToTry, price: usdToTry.toFixed(2), change: cUsd.val, isPositive: cUsd.isPositive, format: 'fiat' },
          { symbol: 'EUR/TRY', name: 'Euro', rawPrice: eurToTry, price: eurToTry.toFixed(2), change: cEur.val, isPositive: cEur.isPositive, format: 'fiat' },
          { symbol: 'GLD/TRY', name: 'Gram Altın', rawPrice: gldToTry, price: gldToTry.toFixed(2), change: cGld.val, isPositive: cGld.isPositive, format: 'fiat' },
          { symbol: 'BIST100', name: 'Borsa İstanbul', rawPrice: usdToTry * 335.5, price: (usdToTry * 335.5).toFixed(2), change: cBist.val, isPositive: cBist.isPositive, format: 'fiat' },
          { symbol: 'BTC/TRY', name: 'Bitcoin', rawPrice: usdToTry * 64200, price: (usdToTry * 64200).toLocaleString('tr-TR', { maximumFractionDigits: 0 }), change: cBtc.val, isPositive: cBtc.isPositive, format: 'crypto' }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRates();
    // 5 dakikada bir API'den gerçek veriyi yenile
    const apiInterval = setInterval(fetchRates, 300000);
    return () => clearInterval(apiInterval);
  }, []);

  useEffect(() => {
    // 2 saniyede bir mikro dalgalanma yaratarak tam bir anlık borsa hissi ver
    const heartbeat = setInterval(() => {
      setRates(prev => prev.map(item => {
        if (!item.rawPrice) return item;
        
        // Fiyatı çok minik oranda rastgele dalgalandır
        const fluctuationPercent = 1 + ((Math.random() * 0.0004) - 0.0002);
        const newRaw = item.rawPrice * fluctuationPercent;
        
        const newPrice = item.format === 'crypto' 
          ? newRaw.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
          : newRaw.toFixed(2);
          
        const currentChange = parseFloat(item.change) * (item.isPositive ? 1 : -1);
        const changeFluctuation = (Math.random() * 0.06) - 0.03;
        const newChange = currentChange + changeFluctuation;

        return {
          ...item,
          rawPrice: newRaw,
          price: newPrice,
          change: Math.abs(newChange).toFixed(2),
          isPositive: newChange >= 0
        };
      }));
    }, 2000);
    return () => clearInterval(heartbeat);
  }, []);

  const getTodayString = () => {
    const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
    const d = new Date();
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#000000', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', paddingTop: 40 }}>
      
      {/* Header */}
      <div style={{ padding: '20px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Borsa</h1>
          <p style={{ color: '#8E8E93', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 }}>
            {getTodayString()}
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: '#1C1C1E', margin: '10px 20px' }} />

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
        {rates.map((item) => (
          <div key={item.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C1C1E', paddingBottom: 15 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>{item.symbol}</div>
              <div style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500, marginTop: 2 }}>{item.name}</div>
            </div>

            {/* Sparkline Mock */}
            <div style={{ width: 60, height: 30, marginRight: 20 }}>
               <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                 <polyline 
                   points={item.isPositive ? "0,35 20,25 40,30 60,15 80,20 100,5" : "0,5 20,15 40,10 60,25 80,20 100,35"} 
                   fill="none" 
                   stroke={item.isPositive ? '#32D74B' : '#FF453A'} 
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 />
               </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 90 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
                {loading ? '...' : item.price}
              </div>
              <div style={{ 
                background: item.isPositive ? '#32D74B' : '#FF453A', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: 6, 
                fontSize: 14, 
                fontWeight: 600, 
                marginTop: 4,
                display: 'flex',
                justifyContent: 'flex-end',
                minWidth: 65
              }}>
                {item.isPositive ? '+' : '-'}{item.change}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
