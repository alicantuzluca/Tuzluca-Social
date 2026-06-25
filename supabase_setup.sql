-- ═══════════════════════════════════════════════════════════════════════════
-- Tuzluca Social Phone — Supabase SQL Setup
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  avatar_color TEXT DEFAULT '#667eea',
  bio TEXT DEFAULT '',
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'tr',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Calls ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  status TEXT DEFAULT 'ringing',  -- ringing | active | ended | missed | rejected
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ── Social Posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Post Likes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ── Post Comments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Follows ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ── Notifications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,  -- call_incoming | message | like | comment | follow
  payload JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Game Scores ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- '2048' | 'flappy'
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Enable Realtime on all tables
-- ═══════════════════════════════════════════════════════════════════════════
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE calls;
-- ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE social_likes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE social_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE game_scores;

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — Herkese okuma, sadece sahibine yazma
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, user can update own
CREATE POLICY "Profiles visible to all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
-- INSERT yetkisi RLS'den KALDIRILDI! Sadece aşağıdaki RPC (register_profile) üzerinden eklenebilir.

-- Messages: sender & receiver can read
CREATE POLICY "Message participants read" ON messages FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = sender_id OR id = receiver_id
  ));
CREATE POLICY "Authenticated users send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = sender_id));
CREATE POLICY "Receivers can update messages" ON messages FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = receiver_id));

-- Calls: participants can read & write
CREATE POLICY "Call participants access" ON calls FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = caller_id OR id = callee_id
  ));

-- Social Posts: everyone can read, author writes
CREATE POLICY "Posts readable by all" ON social_posts FOR SELECT USING (true);
CREATE POLICY "Authors insert posts" ON social_posts FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = author_id));
CREATE POLICY "Authors update posts" ON social_posts FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = author_id));
CREATE POLICY "Authors delete posts" ON social_posts FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = author_id));

-- Likes: everyone reads, user manages own
CREATE POLICY "Likes readable by all" ON social_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON social_likes FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = social_likes.user_id));

-- Comments: everyone reads, author writes
CREATE POLICY "Comments readable by all" ON social_comments FOR SELECT USING (true);
CREATE POLICY "Authors write comments" ON social_comments FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = author_id));

-- Follows: everyone reads, user manages own
CREATE POLICY "Follows readable by all" ON follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON follows FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = follower_id));

-- Notifications: recipient reads own
CREATE POLICY "Own notifications" ON notifications FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = recipient_id));
CREATE POLICY "Insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Receivers update notifications" ON notifications FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = recipient_id));

-- Game Scores: everyone reads, user inserts own
CREATE POLICY "Scores readable by all" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Users insert own scores" ON game_scores FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = game_scores.user_id));

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper Function: likes_count auto-update
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON social_likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper Function: comments_count auto-update
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON social_comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ═══════════════════════════════════════════════════════════════════════════
-- Secure Registration RPC Function
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION register_profile(
  p_user_id UUID,
  p_username TEXT,
  p_display_name TEXT,
  p_phone TEXT,
  p_avatar TEXT,
  p_theme TEXT,
  p_language TEXT,
  p_invite_code TEXT
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1) Davet Kodu Kontrolü (BANKA TİPİ GÜVENLİK)
  IF p_invite_code != 'TUZLUCA2026' THEN
    RAISE EXCEPTION 'Geçersiz veya hatalı davet kodu!';
  END IF;

  -- 2) Profili Ekle (SECURITY DEFINER olduğu için RLS'yi aşar)
  INSERT INTO profiles (user_id, username, display_name, phone_number, avatar_color, theme, language)
  VALUES (p_user_id, p_username, p_display_name, p_phone, p_avatar, p_theme, p_language);

  RETURN json_build_object('success', true);
END;
$$;
