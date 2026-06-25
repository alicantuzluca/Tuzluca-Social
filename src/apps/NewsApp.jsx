import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share, Bookmark, Newspaper, Loader2 } from 'lucide-react';
import { playClick } from '../audio';

export default function NewsApp() {
  const [activeTab, setActiveTab] = useState('Tümü');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['Tümü', 'Teknoloji', 'Dünya', 'Spor'];

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let rssFeedUrl = 'https://www.ntv.com.tr/gundem.rss';
        if (activeTab === 'Teknoloji') rssFeedUrl = 'https://www.ntv.com.tr/teknoloji.rss';
        else if (activeTab === 'Dünya') rssFeedUrl = 'https://www.ntv.com.tr/dunya.rss';
        else if (activeTab === 'Spor') rssFeedUrl = 'https://www.ntv.com.tr/sporskor.rss';

        // Add a random timestamp to the RSS URL to bypass rss2json caching if possible, 
        // and also pass a cache-busting parameter to the api request itself
        const timestamp = new Date().getTime();
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl + '?t=' + timestamp)}&_=${timestamp}`;
        
        // Using rss2json API to easily convert RSS XML to JSON without CORS issues
        const res = await fetch(apiUrl, { cache: 'no-store' });
        const data = await res.json();
        
        if (data.status === 'ok') {
          const formattedNews = data.items.map((item, index) => {
            // Text preview from description
            const textDiv = document.createElement('div');
            textDiv.innerHTML = item.description || item.content || "";
            const textContent = textDiv.textContent || textDiv.innerText || "";
            
            // Extract image from full HTML content (merge both content and description just in case)
            const htmlDiv = document.createElement('div');
            htmlDiv.innerHTML = (item.content || "") + " " + (item.description || "");
            const contentImg = htmlDiv.querySelector('img');
            
            // Try to extract a clean image
            let img = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop';
            
            let extractedSrc = null;
            if (contentImg) {
               // Some sites use data-src for lazy loading
               extractedSrc = contentImg.getAttribute('data-src') || contentImg.getAttribute('src');
               if (extractedSrc) extractedSrc = extractedSrc.replace(/&amp;/g, '&');
            }

            if (item.thumbnail && item.thumbnail.length > 5) {
              img = item.thumbnail;
            } else if (extractedSrc && extractedSrc.length > 5) {
              img = extractedSrc;
            } else if (item.enclosure && item.enclosure.link) {
              img = item.enclosure.link;
            }

            return {
              id: item.guid || String(index),
              category: activeTab === 'Tümü' ? (item.categories?.[0] || 'Gündem') : activeTab,
              title: item.title,
              source: 'NTV Haber',
              time: new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              image: img,
              content: textContent,
              htmlContent: item.content || item.description // raw html for reader view
            };
          });
          setNewsData(formattedNews);
        }
      } catch (e) {
        console.error("Haberler çekilirken hata oluştu", e);
      }
      setLoading(false);
    };

    fetchNews();
  }, [activeTab]);

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000000' : '#F2F2F7';
  const text = isDark ? '#FFFFFF' : '#000000';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const secondaryText = isDark ? '#8E8E93' : '#8E8E93';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: text, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Global CSS for this component's rich text (to make images responsive) */}
      <style>{`
        .news-reader-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        .news-reader-content p {
          margin-bottom: 15px;
        }
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, paddingLeft: 20 }}>
        <div style={{ fontSize: 13, color: '#FF2D55', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Canlı Akış</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Newspaper color="#FF2D55" size={32} /> Haberler
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {tabs.map(tab => (
          <div 
            key={tab} 
            onClick={() => { playClick(); setActiveTab(tab); }}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 20, 
              background: activeTab === tab ? '#FF2D55' : (isDark ? '#2C2C2E' : '#E5E5EA'),
              color: activeTab === tab ? '#FFF' : text,
              fontSize: 15, 
              fontWeight: 600, 
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, flexDirection: 'column', gap: 10, color: secondaryText }}>
            <Loader2 className="spinner" size={32} color="#FF2D55" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Haberler güncelleniyor...</span>
          </div>
        ) : newsData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, flexDirection: 'column', gap: 10, color: secondaryText }}>
            <Newspaper size={48} color="#FF2D55" opacity={0.5} />
            <span style={{ fontSize: 15, fontWeight: 500 }}>Haberler yüklenemedi.</span>
            <span style={{ fontSize: 13, textAlign: 'center' }}>Lütfen internet bağlantınızı kontrol edip tekrar deneyin.</span>
          </div>
        ) : (
          newsData.map(news => (
            <motion.div 
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { playClick(); setSelectedArticle(news); }}
              style={{ flexShrink: 0, background: cardBg, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)' }}
            >
              <div style={{ width: '100%', height: 200, backgroundImage: `url(${news.image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#333' }} />
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: '#FF2D55', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>{news.category}</div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{news.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: secondaryText, fontWeight: 500 }}>
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Reader View */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'absolute', inset: 0, background: bg, zIndex: 100, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ paddingTop: 50, paddingBottom: 10, paddingHorizontal: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
              <button onClick={() => { playClick(); setSelectedArticle(null); }} style={{ background: 'transparent', border: 'none', color: '#FF2D55', display: 'flex', alignItems: 'center', gap: 5, fontSize: 17, fontWeight: 600, cursor: 'pointer', padding: '10px 0' }}>
                <ChevronLeft size={24} style={{ marginLeft: -8 }} /> Geri
              </button>
              <div style={{ display: 'flex', gap: 15 }}>
                <Bookmark size={22} color="#FF2D55" />
                <Share size={22} color="#FF2D55" />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
              <img src={selectedArticle.image} alt={selectedArticle.title} style={{ width: '100%', height: 250, objectFit: 'cover' }} />
              
              <div style={{ padding: 25 }}>
                <div style={{ fontSize: 13, color: '#FF2D55', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>{selectedArticle.category}</div>
                <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 20, marginTop: 0 }}>{selectedArticle.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30, fontSize: 14, color: secondaryText }}>
                  <span style={{ fontWeight: 600, color: text }}>{selectedArticle.source}</span>
                  <span>•</span>
                  <span>{selectedArticle.time}</span>
                </div>

                <div 
                  className="news-reader-content"
                  style={{ fontSize: 18, lineHeight: 1.6, color: isDark ? '#D1D1D6' : '#3A3A3C', paddingBottom: 40 }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.htmlContent }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
