import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Heart, MessageCircle, Repeat, Globe, Home, Search, Bell, User, Plus, ChevronLeft, ArrowUp, Image as ImageIcon, X } from 'lucide-react';
import { playClick } from '../audio';
import { enqueueOfflineAction } from '../storage';

export default function SocialApp({ myProfile, isActiveApp }) {
  const [tab, setTab] = useState('feed');  // feed | explore | notifications | profile
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [viewingPost, setViewingPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [viewProfile, setViewProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostText, setEditingPostText] = useState('');
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!myProfile) return;
    loadPosts();
    loadLikes();
    loadFollowing();
    loadNotifications();
    setupRealtimeSubscription();
    return () => subscriptionRef.current?.unsubscribe();
  }, [myProfile]);

  useEffect(() => {
    if (isActiveApp) {
      const pending = localStorage.getItem('pendingShare');
      if (pending) {
        try {
          const data = JSON.parse(pending);
          if (data.type === 'image') {
            setNewPostImage(data.data);
            setNewPostText(data.title || '');
          } else if (data.type === 'text') {
            setNewPostText(data.data);
          }
          setShowCompose(true);
          localStorage.removeItem('pendingShare');
        } catch (e) {}
      }
    }
  }, [isActiveApp]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('social_posts')
      .select('*, author:profiles!social_posts_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data);
  };

  const loadLikes = async () => {
    if (!myProfile) return;
    const { data } = await supabase.from('social_likes').select('post_id').eq('user_id', myProfile.id);
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
  };

  const loadFollowing = async () => {
    if (!myProfile) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', myProfile.id);
    if (data) setFollowing(new Set(data.map(f => f.following_id)));
  };

  const loadNotifications = async () => {
    if (!myProfile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, sender:profiles!notifications_sender_id_fkey(*)')
      .eq('recipient_id', myProfile.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
  };

  const setupRealtimeSubscription = () => {
    subscriptionRef.current = supabase.channel('social-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_posts' }, () => loadPosts())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'social_posts' }, () => loadPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `recipient_id=eq.${myProfile?.id}` }, () => loadNotifications())
      .subscribe();
  };

  const createPost = async () => {
    if ((!newPostText.trim() && !newPostImage) || !myProfile || posting) return;
    setPosting(true);

    const postPayload = {
      author_id: myProfile.id,
      content: newPostText.trim(),
      image_url: newPostImage
    };

    if (!navigator.onLine) {
      await enqueueOfflineAction({ type: 'SOCIAL_POST', payload: postPayload });
      setNewPostText(''); 
      setNewPostImage(null);
      setShowCompose(false); 
      alert('İnternet bağlantınız yok. Gönderi kuyruğa eklendi ve bağlantı geldiğinde paylaşılacak.');
      setPosting(false);
      return;
    }

    const { error } = await supabase.from('social_posts').insert([postPayload]);
    if (!error) { 
      setNewPostText(''); 
      setNewPostImage(null);
      setShowCompose(false); 
      loadPosts(); 
    } else {
      alert('Paylaşım yapılamadı: ' + error.message);
    }
    setPosting(false);
  };

  const deletePost = async (post) => {
    if (window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) {
      await supabase.from('social_posts').delete().eq('id', post.id);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      if (viewingPost?.id === post.id) setViewingPost(null);
      if (viewProfile) {
        setProfilePosts(prev => prev.filter(p => p.id !== post.id));
      }
    }
  };

  const saveEditPost = async (post) => {
    if (!editingPostText.trim()) return;
    await supabase.from('social_posts').update({ content: editingPostText.trim() }).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: editingPostText.trim() } : p));
    if (viewingPost?.id === post.id) setViewingPost(prev => ({ ...prev, content: editingPostText.trim() }));
    if (viewProfile) {
      setProfilePosts(prev => prev.map(p => p.id === post.id ? { ...p, content: editingPostText.trim() } : p));
    }
    setEditingPostId(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // Compress image to max 800px width/height
        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setNewPostImage(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleLike = async (post) => {
    if (!myProfile) return;
    playClick();
    const isLiked = likedPosts.has(post.id);
    setLikedPosts(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(post.id) : next.add(post.id);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p));

    if (isLiked) {
      await supabase.from('social_likes').delete().eq('post_id', post.id).eq('user_id', myProfile.id);
    } else {
      await supabase.from('social_likes').insert([{ post_id: post.id, user_id: myProfile.id }]);
      if (post.author_id !== myProfile.id) {
        await supabase.from('notifications').insert([{ recipient_id: post.author_id, sender_id: myProfile.id, type: 'like', payload: { post_id: post.id } }]);
      }
    }
  };

  const openPost = async (post) => {
    setViewingPost(post);
    const { data } = await supabase
      .from('social_comments')
      .select('*, author:profiles!social_comments_author_id_fkey(*)')
      .eq('post_id', post.id)
      .order('created_at');
    if (data) setComments(data);
  };

  const sendComment = async () => {
    if (!commentText.trim() || !myProfile || !viewingPost) return;
    const text = commentText.trim();
    setCommentText('');
    const { data, error } = await supabase.from('social_comments').insert([{
      post_id: viewingPost.id, author_id: myProfile.id, content: text
    }]).select('*, author:profiles!social_comments_author_id_fkey(*)').single();
    if (data) setComments(prev => [...prev, data]);
    if (viewingPost.author_id !== myProfile.id) {
      await supabase.from('notifications').insert([{ recipient_id: viewingPost.author_id, sender_id: myProfile.id, type: 'comment', payload: { post_id: viewingPost.id, text } }]);
    }
  };

  const openUserProfile = async (profile) => {
    setViewProfile(profile);
    const { data } = await supabase.from('social_posts').select('*').eq('author_id', profile.id).order('created_at', { ascending: false });
    if (data) setProfilePosts(data);
  };

  const toggleFollow = async (targetId) => {
    if (!myProfile) return;
    playClick();
    const isFollowing = following.has(targetId);
    setFollowing(prev => {
      const next = new Set(prev); isFollowing ? next.delete(targetId) : next.add(targetId); return next;
    });
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', myProfile.id).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert([{ follower_id: myProfile.id, following_id: targetId }]);
      await supabase.from('notifications').insert([{ recipient_id: targetId, sender_id: myProfile.id, type: 'follow', payload: {} }]);
    }
  };

  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const colors = { bg: '#000', card: '#1c1c1e', border: 'rgba(255,255,255,0.1)', text: 'white', sub: '#8e8e93' };

  const timeAgo = (ts) => {
    const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs/60)}dk`;
    if (secs < 86400) return `${Math.floor(secs/3600)}s`;
    return `${Math.floor(secs/86400)}g`;
  };

  const renderPostCard = (post, compact) => (
    <motion.div whileTap={compact ? { scale: 0.99 } : undefined} onClick={() => compact && openPost(post)}
      style={{ padding: compact ? '14px 16px' : '16px', borderBottom: `0.5px solid ${colors.border}`, cursor: compact ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div onClick={e => { e.stopPropagation(); openUserProfile(post.author); }}
          style={{ width: '42px', height: '42px', borderRadius: '50%', background: post.author?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', fontWeight: '700', flexShrink: 0, cursor: 'pointer' }}>
          {(post.author?.display_name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span onClick={e => { e.stopPropagation(); openUserProfile(post.author); }}
                style={{ color: colors.text, fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>{post.author?.display_name}</span>
              <span style={{ color: colors.sub, fontSize: '13px' }}>@{post.author?.username}</span>
              <span style={{ color: colors.sub, fontSize: '13px' }}>· {timeAgo(post.created_at)}</span>
            </div>
            
            {/* Edit / Delete for my posts */}
            {post.author_id === myProfile?.id && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <span onClick={(e) => { e.stopPropagation(); setEditingPostId(post.id); setEditingPostText(post.content); }} style={{ color: '#007AFF', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Düzenle</span>
                <span onClick={(e) => { e.stopPropagation(); deletePost(post); }} style={{ color: '#FF3B30', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Sil</span>
              </div>
            )}
          </div>
          
          {editingPostId === post.id ? (
            <div style={{ marginBottom: '12px' }} onClick={e => e.stopPropagation()}>
              <textarea
                value={editingPostText}
                onChange={e => setEditingPostText(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', color: 'white', fontSize: '15px', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditingPostId(null)} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${colors.sub}`, color: colors.sub, borderRadius: '14px', cursor: 'pointer', fontSize: '13px' }}>İptal</button>
                <button onClick={() => saveEditPost(post)} style={{ padding: '6px 12px', background: '#007AFF', border: 'none', color: 'white', borderRadius: '14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Kaydet</button>
              </div>
            </div>
          ) : (
            <p style={{ color: colors.text, fontSize: '16px', lineHeight: '1.5', margin: '0 0 12px', wordBreak: 'break-word' }}>{post.content}</p>
          )}

          {post.image_url && <img src={post.image_url} style={{ width: '100%', borderRadius: '14px', marginBottom: '12px' }} alt="post" />}
          <div style={{ display: 'flex', gap: '24px', color: colors.sub }}>
            <motion.div whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); toggleLike(post); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: likedPosts.has(post.id) ? '#FF2D55' : colors.sub }}>
              <Heart size={20} fill={likedPosts.has(post.id) ? '#FF2D55' : 'transparent'} strokeWidth={1.5} />
              <span style={{ fontSize: '14px' }}>{post.likes_count || 0}</span>
            </motion.div>
            <div onClick={e => { e.stopPropagation(); openPost(post); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <MessageCircle size={20} strokeWidth={1.5} />
              <span style={{ fontSize: '14px' }}>{post.comments_count || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Repeat size={20} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Post detail view */}
      <AnimatePresence>
        {viewingPost && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
            style={{ position: 'absolute', inset: 0, zIndex: 100, backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '55px 16px 12px', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button onClick={() => setViewingPost(null)} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={20} /> Geri
              </button>
              <span style={{ color: colors.text, fontSize: '18px', fontWeight: '600', paddingBottom: '2px' }}>Post</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderPostCard(viewingPost, false)}
              <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${colors.border}` }}>
                <p style={{ color: colors.sub, fontSize: '14px', margin: 0 }}>{comments.length} yorum</p>
              </div>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: `0.5px solid ${colors.border}` }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.author?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                    {(c.author?.display_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ color: colors.text, fontSize: '14px', fontWeight: '600' }}>{c.author?.display_name}</span>
                      <span style={{ color: colors.sub, fontSize: '12px' }}>· {timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ color: colors.text, fontSize: '15px', margin: 0 }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 12px 30px', borderTop: `0.5px solid ${colors.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: myProfile?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                {(myProfile?.display_name || '?').charAt(0).toUpperCase()}
              </div>
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendComment(); }}
                placeholder="Yorum ekle..." style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '10px 16px', color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={sendComment} style={{ background: commentText.trim() ? '#007AFF' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User profile view */}
      <AnimatePresence>
        {viewProfile && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
            style={{ position: 'absolute', inset: 0, zIndex: 100, backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '55px 16px 12px', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setViewProfile(null); setTab('feed'); }} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={20} /> Geri
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '20px 16px', borderBottom: `0.5px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: viewProfile.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: 'white', fontWeight: '700' }}>
                    {(viewProfile.display_name || '?').charAt(0).toUpperCase()}
                  </div>
                  {viewProfile.id !== myProfile?.id && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleFollow(viewProfile.id)}
                      style={{ padding: '8px 20px', borderRadius: '20px', border: following.has(viewProfile.id) ? '1px solid rgba(255,255,255,0.3)' : 'none', background: following.has(viewProfile.id) ? 'transparent' : '#007AFF', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                      {following.has(viewProfile.id) ? 'Takip Ediliyor' : 'Takip Et'}
                    </motion.button>
                  )}
                </div>
                <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>{viewProfile.display_name}</h2>
                <p style={{ color: colors.sub, fontSize: '15px', margin: '0 0 12px' }}>@{viewProfile.username}</p>
                {viewProfile.bio && <p style={{ color: colors.text, fontSize: '15px', margin: '0 0 12px' }}>{viewProfile.bio}</p>}
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ color: colors.text, fontSize: '15px' }}><strong>{profilePosts.length}</strong> <span style={{ color: colors.sub }}>Gönderi</span></span>
                </div>
              </div>
              {profilePosts.map(p => (
                <div key={p.id} style={{ padding: '14px 16px', borderBottom: `0.5px solid ${colors.border}` }}>
                  <p style={{ color: colors.text, fontSize: '15px', margin: 0, lineHeight: 1.5 }}>{p.content}</p>
                  <p style={{ color: colors.sub, fontSize: '13px', margin: '6px 0 0' }}>{timeAgo(p.created_at)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Header */}
      {(tab === 'feed' || tab === 'explore') && (
        <div style={{ padding: '55px 16px 10px', backgroundColor: colors.bg, borderBottom: `0.5px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: myProfile?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              onClick={() => openUserProfile(myProfile)}>
              {(myProfile?.display_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '3px' }}>
              {['Takipler', 'Keşfet'].map((t, i) => (
                <div key={t} onClick={() => setTab(i === 0 ? 'feed' : 'explore')}
                  style={{ padding: '6px 16px', borderRadius: '10px', background: (i === 0 ? tab === 'feed' : tab === 'explore') ? 'rgba(255,255,255,0.12)' : 'none', color: colors.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {t}
                </div>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); playClick(); setShowCompose(true); }}
              style={{ background: '#007AFF', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 100 }}>
              <Plus size={20} />
            </motion.button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div style={{ padding: '55px 16px 10px', backgroundColor: colors.bg, borderBottom: `0.5px solid ${colors.border}` }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '700' }}>Bildirimler</h2>
        </div>
      )}

      {/* Dynamic Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {(tab === 'feed' || tab === 'explore') && (
          posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.sub, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '16px' }}><Globe size={64} strokeWidth={1} /></div>
              <p style={{ fontSize: '17px' }}>Henüz paylaşım yok</p>
              <p style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} /> ikonuna tıklayarak ilk paylaşımı yapın!</p>
            </div>
          ) : posts.map(post => (
            <React.Fragment key={post.id}>
              {renderPostCard(post, true)}
            </React.Fragment>
          ))
        )}

        {tab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: colors.sub }}>
                <Bell size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Henüz bildirim yok</p>
              </div>
            ) : notifications.map(notif => (
              <div key={notif.id} style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: `0.5px solid ${colors.border}` }}>
                 <div onClick={() => openUserProfile(notif.sender)} style={{ width: '42px', height: '42px', borderRadius: '50%', background: notif.sender?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', fontWeight: '700', flexShrink: 0, cursor: 'pointer' }}>
                    {(notif.sender?.display_name || '?').charAt(0).toUpperCase()}
                 </div>
                 <div style={{ flex: 1 }}>
                   <p style={{ margin: 0, color: 'white', fontSize: '15px' }}>
                     <strong onClick={() => openUserProfile(notif.sender)} style={{ cursor: 'pointer' }}>{notif.sender?.display_name}</strong> {
                       notif.type === 'like' ? 'fotoğrafını beğendi.' :
                       notif.type === 'comment' ? `yorum yaptı: "${notif.payload?.text || ''}"` :
                       notif.type === 'follow' ? 'seni takip etmeye başladı.' :
                       'yeni bir bildirim var.'
                     }
                   </p>
                   <span style={{ fontSize: '13px', color: colors.sub }}>{timeAgo(notif.created_at)}</span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{ position: 'absolute', inset: 0, zIndex: 999, backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '55px 16px 12px', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <button onClick={() => { setShowCompose(false); setNewPostText(''); setNewPostImage(null); }} style={{ background: 'none', border: 'none', color: '#8e8e93', fontSize: '17px', cursor: 'pointer' }}>İptal</button>
              <span style={{ color: colors.text, fontSize: '18px', fontWeight: '700' }}>Yeni Gönderi</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={createPost} disabled={(!newPostText.trim() && !newPostImage) || posting}
                style={{ background: (newPostText.trim() || newPostImage) ? '#007AFF' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '20px', padding: '7px 18px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                {posting ? '...' : 'Paylaş'}
              </motion.button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', padding: '16px', flex: 1, overflowY: 'auto' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: myProfile?.avatar_color || '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                {(myProfile?.display_name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  autoFocus value={newPostText} onChange={e => setNewPostText(e.target.value)}
                  placeholder="Ne düşünüyorsunuz?"
                  style={{ width: '100%', background: 'none', border: 'none', color: 'white', fontSize: '18px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5', minHeight: '120px' }}
                />
                
                {/* Selected Image Preview */}
                {newPostImage && (
                  <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '100%' }}>
                    <img src={newPostImage} style={{ width: '100%', borderRadius: '12px', objectFit: 'contain' }} alt="preview" />
                    <button onClick={() => setNewPostImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '12px 16px 30px', borderTop: `0.5px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <input type="file" id="postImageUpload" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                <label htmlFor="postImageUpload" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#007AFF', cursor: 'pointer', fontWeight: '500' }}>
                  <ImageIcon size={22} />
                  <span>Fotoğraf Ekle</span>
                </label>
              </div>
              <span style={{ color: colors.sub, fontSize: '14px' }}>{280 - newPostText.length} karakter</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <div style={{ height: '83px', backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderTop: `0.5px solid ${colors.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: '10px' }}>
        {[
          { id: 'feed', icon: <Home size={24} />, label: 'Ana Sayfa' },
          { id: 'explore', icon: <Search size={24} />, label: 'Keşfet' },
          { id: 'notifications', icon: <Bell size={24} />, label: 'Bildirimler', badge: unreadNotifs },
          { id: 'profile', icon: <User size={24} />, label: 'Profil' },
        ].map(t => (
          <div key={t.id} onClick={() => { playClick(); setTab(t.id); if (t.id === 'notifications') { setNotifications(prev => prev.map(n => ({...n, is_read: true}))); supabase.from('notifications').update({ is_read: true }).eq('recipient_id', myProfile?.id).eq('is_read', false).then(()=>loadNotifications()); } if (t.id === 'profile' && myProfile) openUserProfile(myProfile); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', position: 'relative', minWidth: '60px' }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', color: tab === t.id ? '#007AFF' : '#8e8e93' }}>{t.icon}</span>
            {t.badge > 0 && <div style={{ position: 'absolute', top: '-4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: '700' }}>{t.badge}</div>}
            <span style={{ fontSize: '10px', color: tab === t.id ? '#007AFF' : '#8e8e93', fontWeight: '500' }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
