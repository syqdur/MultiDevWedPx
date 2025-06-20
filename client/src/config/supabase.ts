import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return url.startsWith('https://') && url.includes('supabase.co')
  } catch {
    return false
  }
}

// Temporarily force demo mode until environment variables load properly
export const isSupabaseConfigured = false

// Check if Supabase is properly configured (disabled for now)
const _isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) &&
  supabaseUrl !== 'your-supabase-url' && 
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  supabaseAnonKey.length > 20
)

// Demo mode active - all features available

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

// Supabase configuration message removed - running in demo mode

// Database types for TypeScript
export interface Profile {
  id: string
  email: string
  display_name: string | null
  profile_image: string | null
  bio: string | null
  spotify_url: string | null
  dark_mode: boolean
  audio_enabled: boolean
  created_at: string
  updated_at: string
}

export interface GalleryMedia {
  id: string
  user_id: string
  url: string
  caption: string | null
  media_type: 'image' | 'video'
  created_at: string
}

export interface TimelineItem {
  id: string
  user_id: string
  title: string
  custom_event_name: string | null
  date: string
  description: string
  location: string | null
  type: 'first_date' | 'first_kiss' | 'first_vacation' | 'engagement' | 'moving_together' | 'anniversary' | 'custom' | 'other'
  media_urls: string[] | null
  media_types: string[] | null
  created_at: string
}

export interface MusicWishlistItem {
  id: string
  user_id: string
  song_title: string
  artist: string
  spotify_id: string | null
  created_at: string
}

export interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  created_at: string
  expires_at: string
  viewed_by: string[]
}