-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  profile_image TEXT,
  bio TEXT,
  spotify_url TEXT,
  dark_mode BOOLEAN DEFAULT false,
  audio_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create gallery_media table
CREATE TABLE gallery_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_items table
CREATE TABLE timeline_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  custom_event_name TEXT,
  date TIMESTAMPTZ NOT NULL,
  description TEXT,
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('first_date', 'first_kiss', 'first_vacation', 'engagement', 'moving_together', 'anniversary', 'custom', 'other')),
  media_urls TEXT[],
  media_types TEXT[],
  media_file_names TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create music_wishlist table
CREATE TABLE music_wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  spotify_id TEXT,
  spotify_url TEXT,
  preview_url TEXT,
  album_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stories table
CREATE TABLE stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_name TEXT,
  viewed_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  media_id UUID REFERENCES gallery_media(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  media_id UUID REFERENCES gallery_media(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

-- Create site_status table (for admin management)
CREATE TABLE site_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_under_construction BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Insert default site status
INSERT INTO site_status (is_under_construction) VALUES (false);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_status ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Gallery media policies
CREATE POLICY "Users can view their own media" ON gallery_media
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON gallery_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON gallery_media
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON gallery_media
  FOR DELETE USING (auth.uid() = user_id);

-- Timeline items policies
CREATE POLICY "Users can view their own timeline items" ON timeline_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline items" ON timeline_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline items" ON timeline_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline items" ON timeline_items
  FOR DELETE USING (auth.uid() = user_id);

-- Music wishlist policies
CREATE POLICY "Users can view their own music wishlist" ON music_wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music wishlist items" ON music_wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music wishlist items" ON music_wishlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music wishlist items" ON music_wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Stories policies
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on their media" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gallery_media 
      WHERE gallery_media.id = comments.media_id 
      AND gallery_media.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments on their media" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gallery_media 
      WHERE gallery_media.id = comments.media_id 
      AND gallery_media.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can view likes on their media" ON likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gallery_media 
      WHERE gallery_media.id = likes.media_id 
      AND gallery_media.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can like media on their galleries" ON likes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gallery_media 
      WHERE gallery_media.id = likes.media_id 
      AND gallery_media.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlike media" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Site status policies (read-only for regular users)
CREATE POLICY "Everyone can view site status" ON site_status
  FOR SELECT USING (true);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_gallery_media_user_id ON gallery_media(user_id);
CREATE INDEX idx_gallery_media_created_at ON gallery_media(created_at DESC);
CREATE INDEX idx_timeline_items_user_id ON timeline_items(user_id);
CREATE INDEX idx_timeline_items_date ON timeline_items(date);
CREATE INDEX idx_music_wishlist_user_id ON music_wishlist(user_id);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_comments_media_id ON comments(media_id);
CREATE INDEX idx_likes_media_id ON likes(media_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);