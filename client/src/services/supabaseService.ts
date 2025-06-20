import { supabase, Profile, GalleryMedia, TimelineItem, MusicWishlistItem, Story } from '../config/supabase'

// Profile operations
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Gallery media operations
export const getGalleryMedia = async (userId: string): Promise<GalleryMedia[]> => {
  const { data, error } = await supabase
    .from('gallery_media')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching gallery media:', error)
    return []
  }
  return data || []
}

export const addGalleryMedia = async (
  userId: string, 
  url: string, 
  mediaType: 'image' | 'video',
  caption?: string,
  fileName?: string
): Promise<GalleryMedia> => {
  const { data, error } = await supabase
    .from('gallery_media')
    .insert([{
      user_id: userId,
      url,
      media_type: mediaType,
      caption,
      file_name: fileName
    }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const updateGalleryMedia = async (
  mediaId: string,
  updates: { caption?: string }
): Promise<GalleryMedia> => {
  const { data, error } = await supabase
    .from('gallery_media')
    .update(updates)
    .eq('id', mediaId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const deleteGalleryMedia = async (mediaId: string): Promise<void> => {
  const { error } = await supabase
    .from('gallery_media')
    .delete()
    .eq('id', mediaId)

  if (error) {
    throw new Error(error.message)
  }
}

// Timeline operations
export const getTimelineItems = async (userId: string): Promise<TimelineItem[]> => {
  const { data, error } = await supabase
    .from('timeline_items')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching timeline items:', error)
    return []
  }
  return data || []
}

export const addTimelineItem = async (
  userId: string,
  item: Omit<TimelineItem, 'id' | 'user_id' | 'created_at'>
): Promise<TimelineItem> => {
  const { data, error } = await supabase
    .from('timeline_items')
    .insert([{
      user_id: userId,
      ...item
    }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const updateTimelineItem = async (
  itemId: string,
  updates: Partial<Omit<TimelineItem, 'id' | 'user_id' | 'created_at'>>
): Promise<TimelineItem> => {
  const { data, error } = await supabase
    .from('timeline_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const deleteTimelineItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('timeline_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw new Error(error.message)
  }
}

// Music wishlist operations
export const getMusicWishlist = async (userId: string): Promise<MusicWishlistItem[]> => {
  const { data, error } = await supabase
    .from('music_wishlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching music wishlist:', error)
    return []
  }
  return data || []
}

export const addMusicWishlistItem = async (
  userId: string,
  item: Omit<MusicWishlistItem, 'id' | 'user_id' | 'created_at'>
): Promise<MusicWishlistItem> => {
  const { data, error } = await supabase
    .from('music_wishlist')
    .insert([{
      user_id: userId,
      ...item
    }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const deleteMusicWishlistItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('music_wishlist')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw new Error(error.message)
  }
}

// Stories operations
export const getStories = async (userId: string): Promise<Story[]> => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stories:', error)
    return []
  }
  return data || []
}

export const addStory = async (
  userId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video',
  fileName?: string
): Promise<Story> => {
  const { data, error } = await supabase
    .from('stories')
    .insert([{
      user_id: userId,
      media_url: mediaUrl,
      media_type: mediaType,
      file_name: fileName
    }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const markStoryAsViewed = async (storyId: string, userId: string): Promise<void> => {
  // First get the current story to get viewed_by array
  const { data: story, error: fetchError } = await supabase
    .from('stories')
    .select('viewed_by')
    .eq('id', storyId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const viewedBy = story?.viewed_by || []
  if (!viewedBy.includes(userId)) {
    const { error } = await supabase
      .from('stories')
      .update({ viewed_by: [...viewedBy, userId] })
      .eq('id', storyId)

    if (error) {
      throw new Error(error.message)
    }
  }
}

export const deleteStory = async (storyId: string): Promise<void> => {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)

  if (error) {
    throw new Error(error.message)
  }
}

export const cleanupExpiredStories = async (): Promise<void> => {
  const { error } = await supabase
    .from('stories')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error cleaning up expired stories:', error)
  }
}

// Comments operations
export const getComments = async (mediaId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        display_name,
        profile_image
      )
    `)
    .eq('media_id', mediaId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }
  return data || []
}

export const addComment = async (
  mediaId: string,
  userId: string,
  text: string
) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([{
      media_id: mediaId,
      user_id: userId,
      text
    }])
    .select(`
      *,
      profiles:user_id (
        display_name,
        profile_image
      )
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    throw new Error(error.message)
  }
}

// Likes operations
export const getLikes = async (mediaId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .eq('media_id', mediaId)

  if (error) {
    console.error('Error fetching likes:', error)
    return []
  }
  return data || []
}

export const toggleLike = async (mediaId: string, userId: string) => {
  // Check if like exists
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('media_id', mediaId)
    .eq('user_id', userId)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      throw new Error(error.message)
    }
    return false
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert([{
        media_id: mediaId,
        user_id: userId
      }])

    if (error) {
      throw new Error(error.message)
    }
    return true
  }
}

// Real-time subscriptions
export const subscribeToGalleryMedia = (userId: string, callback: (media: GalleryMedia[]) => void) => {
  const subscription = supabase
    .channel('gallery_media_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'gallery_media',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        const media = await getGalleryMedia(userId)
        callback(media)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}

export const subscribeToTimelineItems = (userId: string, callback: (items: TimelineItem[]) => void) => {
  const subscription = supabase
    .channel('timeline_items_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'timeline_items',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        const items = await getTimelineItems(userId)
        callback(items)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}

export const subscribeToStories = (userId: string, callback: (stories: Story[]) => void) => {
  const subscription = supabase
    .channel('stories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        const stories = await getStories(userId)
        callback(stories)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}