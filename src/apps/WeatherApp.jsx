import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake, HelpCircle, Trash2, Plus, Map, List, Navigation } from 'lucide-react';
import { idbStorage } from '../storage';

// Hava durumu kodlarını Apple stili ikonlar ve arka planlarla eşleştir
const WEATHER_MAP = {
  0:  { label: 'Açık', icon: <Sun color="#FFD60A" fill="#FFD60A" />, bg: 'linear-gradient(to bottom, #2b8ce9, #5ac8fa)' },
  1:  { label: 'Çoğunlukla Açık', icon: <CloudSun color="#FFD60A" fill="white" />, bg: 'linear-gradient(to bottom, #4a90e2, #7ebcf2)' },
  2:  { label: 'Parçalı Bulutlu', icon: <CloudSun color="#FFD60A" />, bg: 'linear-gradient(to bottom, #698cae, #92b6d5)' },
  3:  { label: 'Bulutlu', icon: <Cloud color="white" fill="rgba(255,255,255,0.5)" />, bg: 'linear-gradient(to bottom, #6d7782, #98a5b3)' },
  45: { label: 'Sisli', icon: <CloudFog color="white" />, bg: 'linear-gradient(to bottom, #8e9eab, #c8d1d8)' },
  48: { label: 'Kırağılı Sis', icon: <CloudFog color="white" />, bg: 'linear-gradient(to bottom, #8e9eab, #c8d1d8)' },
  51: { label: 'Hafif Çiseleme', icon: <CloudDrizzle color="#5AC8FA" />, bg: 'linear-gradient(to bottom, #43515f, #7a8d9f)' },
  53: { label: 'Çiseleme', icon: <CloudDrizzle color="#5AC8FA" />, bg: 'linear-gradient(to bottom, #43515f, #7a8d9f)' },
  55: { label: 'Yoğun Çiseleme', icon: <CloudDrizzle color="#5AC8FA" />, bg: 'linear-gradient(to bottom, #43515f, #7a8d9f)' },
  61: { label: 'Hafif Yağmur', icon: <CloudRain color="#5AC8FA" />, bg: 'linear-gradient(to bottom, #2b4162, #566c82)' },
  63: { label: 'Yağmur', icon: <CloudRain color="#5AC8FA" fill="rgba(90,200,250,0.3)" />, bg: 'linear-gradient(to bottom, #2b4162, #566c82)' },
  65: { label: 'Şiddetli Yağmur', icon: <CloudRain color="#007AFF" />, bg: 'linear-gradient(to bottom, #1b2838, #3b5068)' },
  71: { label: 'Hafif Kar', icon: <Snowflake color="white" />, bg: 'linear-gradient(to bottom, #758eb7, #b2cced)' },
  73: { label: 'Kar', icon: <Snowflake color="white" fill="white" />, bg: 'linear-gradient(to bottom, #758eb7, #b2cced)' },
  75: { label: 'Yoğun Kar', icon: <Snowflake color="white" fill="white" />, bg: 'linear-gradient(to bottom, #597399, #9eb6d6)' },
  95: { label: 'Fırtına', icon: <CloudLightning color="#FFCC00" />, bg: 'linear-gradient(to bottom, #141e30, #364e6b)' },
  96: { label: 'Dolu Fırtınası', icon: <CloudLightning color="#FFCC00" />, bg: 'linear-gradient(to bottom, #141e30, #364e6b)' },
  99: { label: 'Şiddetli Dolu', icon: <CloudLightning color="#FFCC00" />, bg: 'linear-gradient(to bottom, #141e30, #364e6b)' }
};

const getWeatherData = (code) => WEATHER_MAP[code] || { label: 'Bilinmiyor', icon: <HelpCircle />, bg: 'linear-gradient(to bottom, #1c1c1e, #000)' };

export default function WeatherApp() {
  const [cities, setCities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved cities from idbStorage
  useEffect(() => {
    async function loadCities() {
      const saved = await idbStorage.getItem('weatherCities');
      if (saved && saved.length > 0) {
        setCities(saved);
        setLoading(false);
      } else {
        // Default city: Istanbul
        addCity({ name: 'Istanbul', latitude: 41.0138, longitude: 28.9497, country: 'Turkey' });
      }
    }
    loadCities();
  }, []);

  const addCity = async (cityData) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cityData.latitude}&longitude=${cityData.longitude}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
      const weather = await res.json();
      
      if (weather.error) throw new Error(weather.reason);

      const newCity = {
        id: cityData.id || Date.now(),
        name: cityData.name,
        lat: cityData.latitude,
        lon: cityData.longitude,
        country: cityData.country,
        weather: weather
      };

      const newCities = [...cities.filter(c => c.name !== newCity.name), newCity];
      setCities(newCities);
      await idbStorage.setItem('weatherCities', newCities);
      setCurrentIndex(newCities.length - 1);
      setSearchQuery('');
    } catch (e) {
      alert('Hava durumu verisi alınamadı!');
      console.error(e);
    }
  };

  const removeCity = async (indexToRemove) => {
    if (cities.length <= 1) {
      alert('En az bir şehir kalmalı!');
      return;
    }
    const newCities = cities.filter((_, i) => i !== indexToRemove);
    setCities(newCities);
    await idbStorage.setItem('weatherCities', newCities);
    if (currentIndex >= newCities.length) setCurrentIndex(Math.max(0, newCities.length - 1));
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 3) { setSearchResults([]); return; }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5&language=tr&format=json`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      addCity(searchResults[0]);
    }
  };

  if (loading && cities.length === 0) {
    return <div style={{ width: '100%', height: '100%', background: '#1c1c1e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>;
  }

  // --- City List / Search View ---
  if (showList) {
    return (
      <div style={{ width: '100%', height: '100%', background: 'black', color: 'white', display: 'flex', flexDirection: 'column', paddingTop: '50px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        
        <div style={{ fontSize: '32px', fontWeight: 'bold', padding: '0 20px', marginBottom: '10px', letterSpacing: '0.5px' }}>Hava Durumu</div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Şehir veya havalimanı ara"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', background: '#1c1c1e', border: 'none', padding: '10px 10px 10px 36px', borderRadius: '10px', color: 'white', fontSize: '16px', outline: 'none' }}
            />
          </div>
          <button onClick={() => { setShowList(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#0A84FF', fontSize: '17px', cursor: 'pointer', padding: 0 }}>Vazgeç</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {searchQuery.length > 0 ? (
            // Search Results
            searchResults.map((res, i) => (
              <div key={i} onClick={() => { addCity(res); setShowList(false); }} style={{ padding: '16px 0', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '500' }}>{res.name}</div>
                  <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>{res.admin1 ? res.admin1 + ', ' : ''}{res.country}</div>
                </div>
                <Plus color="#0A84FF" />
              </div>
            ))
          ) : (
            // Saved Cities List
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cities.map((city, i) => {
                const w = city.weather.current;
                const d = getWeatherData(w.weather_code);
                return (
                  <div key={i} onClick={() => { setCurrentIndex(i); setShowList(false); }} style={{ position:'relative', borderRadius: '20px', background: d.bg, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '80px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}>{city.name}</div>
                      <div style={{ fontSize: '15px', fontWeight: '500', textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}>{d.label}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '80px' }}>
                      <div style={{ fontSize: '50px', fontWeight: '200', lineHeight: '1', textShadow: '0 1px 5px rgba(0,0,0,0.3)', marginRight: '-4px' }}>{Math.round(w.temperature_2m)}°</div>
                      <div style={{ fontSize: '13px', fontWeight: '500', textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}>
                        Y:{Math.round(city.weather.daily.temperature_2m_max[0])}° &nbsp; D:{Math.round(city.weather.daily.temperature_2m_min[0])}°
                      </div>
                    </div>
                    
                    {/* Delete Badge */}
                    <button onClick={(e) => { e.stopPropagation(); removeCity(i); }} style={{ position: 'absolute', top: '-6px', left: '-6px', background: '#FF3B30', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                      <Plus size={16} strokeWidth={3} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentCity = cities[currentIndex];
  if (!currentCity || !currentCity.weather) return null;

  const currentW = currentCity.weather.current;
  const wData = getWeatherData(currentW.weather_code);

  return (
    <div style={{ width: '100%', height: '100%', background: wData.bg, color: 'white', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '70px 20px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Main Header */}
        <h1 style={{ fontSize: '36px', fontWeight: '400', margin: '0', textShadow: '0 2px 10px rgba(0,0,0,0.2)', textAlign: 'center' }}>{currentCity.name}</h1>
        <div style={{ fontSize: '100px', fontWeight: '200', lineHeight: '1', textShadow: '0 2px 15px rgba(0,0,0,0.2)', marginLeft: '15px' }}>{Math.round(currentW.temperature_2m)}°</div>
        <div style={{ fontSize: '22px', fontWeight: '500', margin: '0px 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{wData.label}</div>
        <div style={{ fontSize: '20px', fontWeight: '500', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          Y: {Math.round(currentCity.weather.daily.temperature_2m_max[0])}° &nbsp;&nbsp; D: {Math.round(currentCity.weather.daily.temperature_2m_min[0])}°
        </div>

        {/* Hourly Forecast (Horizontal Scroll) */}
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: '22px', marginTop: '45px', padding: '16px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '0.5px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', borderBottom: '0.5px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '14px', letterSpacing: '0.5px' }}>
            SAATLİK TAHMİN
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '22px', paddingBottom: '5px', scrollbarWidth: 'none' }}>
            {currentCity.weather.hourly.time.slice(0, 24).map((time, i) => {
              const date = new Date(time);
              const hour = date.getHours();
              // Her 2 saatte bir göster
              if (i % 2 !== 0 && i !== 0) return null;
              const hData = getWeatherData(currentCity.weather.hourly.weather_code[i]);
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '44px' }}>
                  <span style={{ fontSize: '15px', fontWeight: i === 0 ? '600' : '500' }}>{i === 0 ? 'Şimdi' : `${hour}:00`}</span>
                  <span style={{ fontSize: '24px', margin: '12px 0' }}>{hData.icon}</span>
                  <span style={{ fontSize: '18px', fontWeight: '500' }}>{Math.round(currentCity.weather.hourly.temperature_2m[i])}°</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Forecast */}
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: '22px', marginTop: '12px', padding: '16px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '0.5px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', borderBottom: '0.5px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '8px', letterSpacing: '0.5px' }}>
            7 GÜNLÜK TAHMİN
          </div>
          {currentCity.weather.daily.time.map((time, i) => {
            const date = new Date(time);
            const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
            const dayName = i === 0 ? 'Bugün' : days[date.getDay()];
            const dData = getWeatherData(currentCity.weather.daily.weather_code[i]);
            
            const minT = Math.round(currentCity.weather.daily.temperature_2m_min[i]);
            const maxT = Math.round(currentCity.weather.daily.temperature_2m_max[i]);
            
            // Generate a simple position based on temps for the bar
            const lowestWeek = Math.min(...currentCity.weather.daily.temperature_2m_min);
            const highestWeek = Math.max(...currentCity.weather.daily.temperature_2m_max);
            const range = highestWeek - lowestWeek;
            
            const leftPct = ((minT - lowestWeek) / range) * 100;
            const rightPct = 100 - (((maxT - lowestWeek) / range) * 100);

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === 6 ? 'none' : '0.5px solid rgba(255,255,255,0.15)' }}>
                <span style={{ width: '45px', fontSize: '18px', fontWeight: '500' }}>{dayName}</span>
                <span style={{ width: '30px', textAlign: 'center' }}>{dData.icon}</span>
                
                <span style={{ width: '30px', color: 'rgba(255,255,255,0.5)', fontWeight: '500', fontSize: '18px', textAlign: 'right' }}>{minT}°</span>
                
                <div style={{ flex: 1, margin: '0 12px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: `${leftPct}%`, right: `${rightPct}%`, height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #5AC8FA, #FFCC00)' }} />
                </div>
                
                <span style={{ width: '30px', fontWeight: '500', fontSize: '18px', textAlign: 'right' }}>{maxT}°</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom Toolbar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'transparent', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '15px 25px 0' }}>
        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Map size={24} strokeWidth={1.5} />
        </button>
        
        {/* Page Dots */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {cities.map((_, i) => (
            <div key={i} onClick={() => setCurrentIndex(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === currentIndex ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
          ))}
        </div>

        <button onClick={() => setShowList(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <List size={26} strokeWidth={1.5} />
        </button>
      </div>

    </div>
  );
}
