import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick } from '../audio';
import { PenBox, ChevronLeft, Share, Trash2, Search, Folder, MoreHorizontal, CheckCircle2, ChevronRight } from 'lucide-react';
import { idbStorage } from '../storage';

export default function NotesApp({ onShare }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('folders'); // folders | list | editor

  useEffect(() => {
    async function loadNotes() {
      const saved = await idbStorage.getItem('notesData');
      if (saved) setNotes(saved);
      else {
        const initial = [
          { id: 1, title: 'Hoş Geldiniz', content: 'Hoş Geldiniz\n\nBu sizin yeni not defteriniz.', date: new Date().toISOString() },
          { id: 2, title: 'Alışveriş Listesi', content: 'Alışveriş Listesi\n\n- Süt\n- Ekmek\n- Yumurta', date: new Date().toISOString() }
        ];
        setNotes(initial);
        await idbStorage.setItem('notesData', initial);
      }
    }
    loadNotes();
  }, []);

  const saveNotes = async (newNotes) => {
    setNotes(newNotes);
    await idbStorage.setItem('notesData', newNotes);
  };

  const createNote = () => {
    playClick();
    const newNote = { id: Date.now(), title: '', content: '', date: new Date().toISOString() };
    saveNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setView('editor');
  };

  const deleteNote = (id) => {
    playClick();
    saveNotes(notes.filter(n => n.id !== id));
    setActiveNote(null);
    setView('list');
  };

  const updateNote = (text) => {
    if (!activeNote) return;
    const lines = text.split('\n');
    const title = lines[0] || 'Yeni Not';
    const updated = { ...activeNote, title, content: text, date: new Date().toISOString() };
    setActiveNote(updated);
    saveNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  const isDark = document.body.style.backgroundColor === 'black' || !!localStorage.getItem('phoneDarkMode');
  const bg = isDark ? '#000000' : '#f2f2f7';
  const card = isDark ? '#1c1c1e' : '#ffffff';
  const textDark = isDark ? '#ffffff' : '#000000';
  const textSub = '#8e8e93';
  const accent = '#E0B036'; // iOS Notes yellow

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: textDark, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      
      <AnimatePresence mode="wait">
        {/* FOLDERS VIEW */}
        {view === 'folders' && (
          <motion.div key="folders" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '60px 20px 10px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ color: accent, fontSize: '17px', cursor: 'pointer', fontWeight: '500' }}>Düzenle</span>
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: '700', margin: '0 20px 16px', letterSpacing: '-0.5px' }}>Klasörler</h1>
            
            <div style={{ padding: '0 20px' }}>
              <div style={{ background: card, borderRadius: '12px', overflow: 'hidden' }}>
                <div onClick={() => { playClick(); setView('list'); }} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Folder size={24} color={accent} fill={accent} style={{ marginRight: '16px' }} />
                  <div style={{ flex: 1, fontSize: '17px', fontWeight: '500' }}>Tüm iCloud</div>
                  <div style={{ fontSize: '17px', color: textSub, display: 'flex', alignItems: 'center' }}>
                    {notes.length} <ChevronRight size={20} color="#c6c6c8" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '30px 0 10px', letterSpacing: '-0.5px' }}>iCloud</h2>
              <div style={{ background: card, borderRadius: '12px', overflow: 'hidden' }}>
                <div onClick={() => { playClick(); setView('list'); }} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer', borderBottom: `0.5px solid ${isDark ? '#333' : '#e5e5ea'}` }}>
                  <Folder size={24} color={accent} fill={accent} style={{ marginRight: '16px' }} />
                  <div style={{ flex: 1, fontSize: '17px', fontWeight: '500' }}>Notlar</div>
                  <div style={{ fontSize: '17px', color: textSub, display: 'flex', alignItems: 'center' }}>
                    {notes.length} <ChevronRight size={20} color="#c6c6c8" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Trash2 size={24} color={accent} style={{ marginRight: '16px' }} />
                  <div style={{ flex: 1, fontSize: '17px', fontWeight: '500' }}>Son Silinenler</div>
                  <div style={{ fontSize: '17px', color: textSub, display: 'flex', alignItems: 'center' }}>
                    0 <ChevronRight size={20} color="#c6c6c8" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', height: '60px', borderTop: `0.5px solid ${isDark ? '#333' : '#c6c6c8'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: bg }}>
              <div style={{ color: accent, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Folder size={24} style={{ marginRight: '6px' }} />
              </div>
              <motion.div whileTap={{ scale: 0.9 }} onClick={createNote} style={{ color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <PenBox size={24} />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '50px 10px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div onClick={() => { playClick(); setView('folders'); }} style={{ color: accent, fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={24} style={{ marginRight: '2px' }} /> Klasörler
              </div>
              <div style={{ color: accent, display: 'flex', alignItems: 'center', cursor: 'pointer' }}><MoreHorizontal size={24} /></div>
            </div>
            
            <h1 style={{ fontSize: '34px', fontWeight: '700', margin: '0 20px 10px', letterSpacing: '-0.5px' }}>Notlar</h1>
            
            <div style={{ padding: '0 20px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: isDark ? '#1c1c1e' : '#e3e3e8', borderRadius: '10px', padding: '8px 12px' }}>
                <Search size={18} color="#8e8e93" style={{ marginRight: '8px' }} />
                <input placeholder="Ara" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '17px', color: textDark }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
              <div style={{ background: card, borderRadius: '12px', overflow: 'hidden' }}>
                {filteredNotes.map((n, i) => {
                  const contentLines = n.content.split('\n');
                  const title = contentLines[0] || 'Yeni Not';
                  const body = contentLines.slice(1).join(' ').trim() || 'Ek metin yok';
                  return (
                    <div key={n.id} onClick={() => { playClick(); setActiveNote(n); setView('editor'); }}
                      style={{ padding: '12px 16px', borderBottom: i === filteredNotes.length - 1 ? 'none' : `0.5px solid ${isDark ? '#333' : '#e5e5ea'}`, cursor: 'pointer' }}>
                      <div style={{ fontSize: '17px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '15px', color: textSub, display: 'flex', gap: '10px' }}>
                        <span>{formatDate(n.date)}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {body}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {filteredNotes.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: textSub }}>Not bulunamadı.</div>}
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div style={{ height: '60px', background: bg, borderTop: `0.5px solid ${isDark ? '#333' : '#c6c6c8'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
              <div style={{ width: '24px' }} />
              <div style={{ fontSize: '12px', color: textDark, fontWeight: '500' }}>{filteredNotes.length} Not</div>
              <motion.div whileTap={{ scale: 0.9 }} onClick={createNote} style={{ color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <PenBox size={24} />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && activeNote && (
          <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: bg }}>
            <div style={{ padding: '50px 10px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div onClick={() => { playClick(); setView('list'); }} style={{ color: accent, fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={24} style={{ marginRight: '2px' }} /> Notlar
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div onClick={() => { if(window.confirm('Bu notu silmek istediğinize emin misiniz?')) deleteNote(activeNote.id); }} style={{ color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={22} /></div>
                <div onClick={() => onShare && onShare({ type: 'text', data: activeNote.content, title: activeNote.title })} style={{ color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Share size={22} /></div>
                <div style={{ color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><MoreHorizontal size={24} /></div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '12px', color: textSub, marginBottom: '20px' }}>
              {formatDate(activeNote.date)}
            </div>
            
            <textarea
              autoFocus
              value={activeNote.content}
              onChange={(e) => updateNote(e.target.value)}
              style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none', padding: '0 20px 20px', fontSize: '17px', lineHeight: '1.5', fontFamily: 'inherit', color: textDark, background: 'transparent' }}
              placeholder="Bir şeyler yazın..."
            />

            {/* Bottom Toolbar */}
            <div style={{ height: '60px', background: bg, borderTop: `0.5px solid ${isDark ? '#333' : '#c6c6c8'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
              <div style={{ color: accent, cursor: 'pointer' }}><CheckCircle2 size={24} /></div>
              <motion.div whileTap={{ scale: 0.9 }} onClick={createNote} style={{ color: accent, cursor: 'pointer' }}>
                <PenBox size={24} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
