import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDemoAuth } from '../contexts/DemoAuthContext'
import { isSupabaseConfigured } from '../config/supabase'
import { AuthModal } from './AuthModal'
import { UploadSection } from './UploadSection'
import { InstagramGallery } from './InstagramGallery'
import { MediaModal } from './MediaModal'
import { ProfileHeader } from './ProfileHeader'
import { StoriesBar } from './StoriesBar'
import { StoriesViewer } from './StoriesViewer'
import { StoryUploadModal } from './StoryUploadModal'
import { TabNavigation } from './TabNavigation'
import { LiveUserIndicator } from './LiveUserIndicator'
import { SpotifyCallback } from './SpotifyCallback'
import { MusicWishlist } from './MusicWishlist'
import { UserSpecificTimeline } from './UserSpecificTimeline'
import { PostWeddingRecap } from './PostWeddingRecap'
import { PublicRecapPage } from './PublicRecapPage'
import { useDarkMode } from '../hooks/useDarkMode'
import { Sun, Moon, User, LogOut, Settings } from 'lucide-react'
import { MediaItem, Comment, Like } from '../types'
import { UserGalleryAdmin } from './UserGalleryAdmin'
import * as mediaService from '../services/mediaService'

// Convert Supabase media to MediaItem format
const convertSupabaseToMediaItem = (media: any): MediaItem => ({
  id: media.id,
  name: media.file_name || 'untitled',
  url: media.url,
  uploadedBy: 'Current User', // Will be replaced with actual user name
  uploadedAt: media.created_at,
  deviceId: 'supabase',
  type: media.media_type,
  noteText: media.caption || undefined
})

export const AuthenticatedApp: React.FC = () => {
  // Use Supabase auth if configured, otherwise fall back to demo auth
  const supabaseAuth = useAuth()
  const demoAuth = useDemoAuth()
  
  const auth = isSupabaseConfigured ? supabaseAuth : demoAuth
  const { user, loading, signOut, updateProfile } = auth
  
  // Create unified user interface
  const unifiedUser = user ? {
    id: user.id,
    display_name: 'display_name' in user ? user.display_name : user.email?.split('@')[0] || 'User',
    email: user.email || '',
    dark_mode: 'dark_mode' in user ? user.dark_mode : false
  } : null
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [status, setStatus] = useState('')
  const [showStoriesViewer, setShowStoriesViewer] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [showStoryUpload, setShowStoryUpload] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery')
  const [stories, setStories] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [likes, setLikes] = useState<any[]>([])
  const [userProfileData, setUserProfileData] = useState<any>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)

  // Check if we're on special routes
  const isSpotifyCallback = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('code') && urlParams.has('state')
  }

  const isPublicRecap = () => {
    return window.location.pathname === '/recap'
  }

  const isPostWeddingRecap = () => {
    return window.location.pathname === '/admin/post-wedding-recap'
  }

  // Load user's media from database on component mount
  useEffect(() => {
    if (unifiedUser) {
      // Load media from database
      const unsubscribeMedia = mediaService.loadGallery(setMediaItems)
      
      // Load comments from database
      const unsubscribeComments = mediaService.loadComments(setComments)
      
      // Load likes from database
      const unsubscribeLikes = mediaService.loadLikes(setLikes)
      
      const userProfile = JSON.parse(localStorage.getItem(`profile_${unifiedUser.id}`) || '{}')
      setUserProfileData(userProfile)

      return () => {
        unsubscribeMedia()
        unsubscribeComments()
        unsubscribeLikes()
      }
    }
  }, [unifiedUser])

  // Update profile dark mode when toggled
  useEffect(() => {
    if (unifiedUser && unifiedUser.dark_mode !== isDarkMode) {
      updateProfile({ dark_mode: isDarkMode })
    }
  }, [isDarkMode, unifiedUser, updateProfile])

  // Upload files using user-specific Firebase Storage
  const handleUpload = async (files: FileList) => {
    if (!unifiedUser) return
    
    setIsUploading(true)
    setStatus('⏳ Files being processed...')
    
    try {
      const uploadedItems = await mediaService.uploadFiles(
        files,
        unifiedUser.display_name,
        'web-client',
        unifiedUser.id,
        (progress) => {
          setStatus(`⏳ Uploading... ${Math.round(progress)}%`)
        }
      )
      
      setMediaItems(prev => [...prev, ...uploadedItems])
      setStatus(`✅ ${uploadedItems.length} file(s) uploaded successfully`)
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus('❌ Upload failed. Please try again.')
      console.error('Upload error:', error)
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleVideoUpload = async (videoBlob: Blob) => {
    if (!unifiedUser) return
    
    setIsUploading(true)
    setStatus('⏳ Video being processed...')
    
    try {
      const uploadedVideo = await mediaService.uploadVideoBlob(
        videoBlob,
        unifiedUser.display_name,
        'web-client',
        unifiedUser.id,
        (progress) => {
          setStatus(`⏳ Uploading video... ${Math.round(progress)}%`)
        }
      )
      
      if (uploadedVideo) {
        setMediaItems(prev => [uploadedVideo, ...prev])
        setStatus('✅ Video uploaded successfully!')
      } else {
        setStatus('❌ Video upload failed. Please try again.')
      }
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus('❌ Video upload failed. Please try again.')
      console.error('Video upload error:', error)
      setTimeout(() => setStatus(''), 5000)
      setIsUploading(false)
    }
  }

  const handleNoteSubmit = async (note: string) => {
    if (!unifiedUser || !note.trim()) return
    
    setIsUploading(true)
    setStatus('⏳ Publishing note...')
    
    try {
      const newNote = await mediaService.addNote(
        note,
        unifiedUser.display_name,
        'web-client'
      )
      
      if (newNote) {
        setMediaItems(prev => [newNote, ...prev])
        setStatus('✅ Note published successfully!')
      } else {
        setStatus('❌ Failed to publish note. Please try again.')
      }
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus('❌ Failed to publish note. Please try again.')
      console.error('Note submission error:', error)
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleStoryUpload = async (file: File) => {
    if (!unifiedUser) return

    setIsUploading(true)
    setStatus('⏳ Story being uploaded...')

    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      const { storage, db } = await import('../config/firebase')
      
      // Create unique filename for story
      const fileName = `story_${Date.now()}_${file.name}`
      const storageRef = ref(storage, `stories/${unifiedUser.id}/${fileName}`)
      
      // Upload story file
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      // Save story metadata to Firestore
      await addDoc(collection(db, 'stories'), {
        url: downloadURL,
        fileName: fileName,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        uploadedBy: unifiedUser.display_name,
        uploadedAt: serverTimestamp(),
        deviceId: unifiedUser.id,
        userId: unifiedUser.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
      
      setStatus('✅ Story uploaded successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error('Story upload error:', error)
      setStatus('❌ Story upload failed. Please try again.')
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setShowAuthModal(false)
  }

  // Handle media deletion
  const handleDeleteMedia = async (item: MediaItem) => {
    if (!unifiedUser) return
    
    try {
      // Remove from local storage
      const userMedia = JSON.parse(localStorage.getItem(`media_${unifiedUser.id}`) || '[]')
      const updatedMedia = userMedia.filter((media: MediaItem) => media.id !== item.id)
      localStorage.setItem(`media_${unifiedUser.id}`, JSON.stringify(updatedMedia))
      
      // Update state
      setMediaItems(prev => prev.filter(media => media.id !== item.id))
      
      setStatus('✅ Media deleted successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error('Media deletion error:', error)
      setStatus('❌ Failed to delete media. Please try again.')
      setTimeout(() => setStatus(''), 5000)
    }
  }

  // Handle note editing
  const handleEditNote = async (item: MediaItem, newText: string) => {
    if (!unifiedUser) return
    
    try {
      const userMedia = JSON.parse(localStorage.getItem(`media_${unifiedUser.id}`) || '[]')
      const updatedMedia = userMedia.map((media: MediaItem) => 
        media.id === item.id ? { ...media, noteText: newText } : media
      )
      localStorage.setItem(`media_${unifiedUser.id}`, JSON.stringify(updatedMedia))
      
      setMediaItems(prev => prev.map(media => 
        media.id === item.id ? { ...media, noteText: newText } : media
      ))
      
      setStatus('✅ Note updated successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error('Note edit error:', error)
      setStatus('❌ Failed to update note. Please try again.')
      setTimeout(() => setStatus(''), 5000)
    }
  }

  // Clear all user data
  const handleClearAllData = async () => {
    if (!unifiedUser) return
    
    if (!confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      return
    }
    
    try {
      // Clear all user-specific data from localStorage
      localStorage.removeItem(`media_${unifiedUser.id}`)
      localStorage.removeItem(`stories_${unifiedUser.id}`)
      localStorage.removeItem(`timeline_${unifiedUser.id}`)
      localStorage.removeItem(`profile_${unifiedUser.id}`)
      localStorage.removeItem(`spotify_${unifiedUser.id}`)
      
      // Reset state
      setMediaItems([])
      setStories([])
      
      setStatus('✅ All data cleared successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error('Data clearing error:', error)
      setStatus('❌ Failed to clear data. Please try again.')
      setTimeout(() => setStatus(''), 5000)
    }
  }

  // Handle profile updates (bio and profile image)
  const handleProfileUpdate = async (updates: { bio?: string; profile_image?: string }) => {
    if (!unifiedUser) return
    
    try {
      // Update user profile data
      if (isSupabaseConfigured && supabaseAuth.updateProfile) {
        await supabaseAuth.updateProfile(updates)
      } else if (!isSupabaseConfigured && demoAuth.updateProfile) {
        await demoAuth.updateProfile(updates)
      }
      
      // Store in localStorage for immediate persistence
      const userProfileKey = `profile_${unifiedUser.id}`
      const existingProfile = JSON.parse(localStorage.getItem(userProfileKey) || '{}')
      const updatedProfile = { ...existingProfile, ...updates }
      localStorage.setItem(userProfileKey, JSON.stringify(updatedProfile))
      
      // Update local state immediately
      setUserProfileData(updatedProfile)
      
      setStatus('✅ Profile updated successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error('Profile update error:', error)
      setStatus('❌ Failed to update profile. Please try again.')
      setTimeout(() => setStatus(''), 5000)
    }
  }

  // Show special routes
  if (isSpotifyCallback()) {
    return <SpotifyCallback isDarkMode={isDarkMode} />
  }

  if (isPublicRecap()) {
    return <PublicRecapPage isDarkMode={isDarkMode} />
  }

  if (isPostWeddingRecap()) {
    return <PostWeddingRecap 
      isDarkMode={isDarkMode} 
      mediaItems={mediaItems}
      isAdmin={true}
      userName={unifiedUser?.display_name || 'Admin'}
    />
  }

  // Show loading screen
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className={`mt-4 text-lg transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Loading your gallery...
          </p>
        </div>
      </div>
    )
  }

  // Show auth modal if not logged in
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-6">💕</div>
          <h1 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to Your Gallery
          </h1>
          <p className={`text-lg mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Create your own event page to share memories with loved ones
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </button>
          
          {/* Dark mode toggle */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          isDarkMode={isDarkMode}
          initialMode="register"
        />
      </div>
    )
  }

  // Main authenticated app
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">💕</div>
            <div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {unifiedUser?.display_name}'s Gallery
              </h1>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LiveUserIndicator currentUser={unifiedUser?.display_name || 'User'} isDarkMode={isDarkMode} />
            
            <button
              onClick={handleClearAllData}
              title="Clear all data"
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-red-400 hover:bg-gray-700' 
                  : 'text-red-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-yellow-400 hover:bg-gray-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Status message */}
        {status && (
          <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ${
            status.includes('❌') 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
          }`}>
            {status}
          </div>
        )}

        {/* Stories Bar */}
        <StoriesBar
          stories={stories}
          currentUser={unifiedUser?.display_name || 'User'}
          onAddStory={() => setShowStoryUpload(true)}
          onViewStory={(index) => {
            setCurrentStoryIndex(index)
            setShowStoriesViewer(true)
          }}
          isDarkMode={isDarkMode}
        />

        {/* Profile Header */}
        <ProfileHeader 
          isDarkMode={isDarkMode} 
          isOwner={true}
          profileData={userProfileData}
          onProfileUpdate={handleProfileUpdate}
          onClearAllData={handleClearAllData}
        />

        {/* Upload Section */}
        <UploadSection
          onUpload={handleUpload}
          onVideoUpload={handleVideoUpload}
          onNoteSubmit={handleNoteSubmit}
          onAddStory={() => setShowStoryUpload(true)}
          isUploading={isUploading}
          progress={uploadProgress}
          isDarkMode={isDarkMode}
        />

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDarkMode={isDarkMode}
        />

        {/* Tab Content */}
        {activeTab === 'gallery' && (
          <InstagramGallery
            items={mediaItems}
            onItemClick={(index) => {
              setCurrentImageIndex(index)
              setModalOpen(true)
            }}
            onDelete={handleDeleteMedia}
            onEditNote={handleEditNote}
            isAdmin={true}
            comments={comments}
            likes={likes}
            onAddComment={(mediaId: string, text: string) => {
              if (unifiedUser) {
                mediaService.addComment(mediaId, text, unifiedUser.display_name, 'web-client')
              }
            }}
            onDeleteComment={(commentId: string) => {
              mediaService.deleteComment(commentId)
            }}
            onToggleLike={(mediaId: string) => {
              if (unifiedUser) {
                mediaService.toggleLike(mediaId, unifiedUser.display_name, 'web-client')
              }
            }}
            userName={unifiedUser?.display_name || 'User'}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'music' && (
          <MusicWishlist isDarkMode={isDarkMode} />
        )}

        {activeTab === 'timeline' && (
          <UserSpecificTimeline 
            isDarkMode={isDarkMode} 
            userName={unifiedUser?.display_name || 'User'}
            isAdmin={true}
          />
        )}
      </div>

      {/* Modals */}
      <MediaModal
        isOpen={modalOpen}
        items={mediaItems}
        currentIndex={currentImageIndex}
        onClose={() => setModalOpen(false)}
        onNext={() => setCurrentImageIndex(prev => 
          prev === mediaItems.length - 1 ? 0 : prev + 1
        )}
        onPrev={() => setCurrentImageIndex(prev => 
          prev === 0 ? mediaItems.length - 1 : prev - 1
        )}
        comments={comments}
        likes={likes}
        onAddComment={(mediaId: string, text: string) => {
          if (unifiedUser) {
            mediaService.addComment(mediaId, text, unifiedUser.display_name, 'web-client')
          }
        }}
        onDeleteComment={(commentId: string) => {
          mediaService.deleteComment(commentId)
        }}
        onToggleLike={(mediaId: string) => {
          if (unifiedUser) {
            mediaService.toggleLike(mediaId, unifiedUser.display_name, 'web-client')
          }
        }}
        userName={unifiedUser?.display_name || 'User'}
        isAdmin={false}
        isDarkMode={isDarkMode}
      />

      <StoriesViewer
        isOpen={showStoriesViewer}
        stories={stories}
        initialStoryIndex={currentStoryIndex}
        currentUser={unifiedUser?.display_name || 'User'}
        onClose={() => setShowStoriesViewer(false)}
        onStoryViewed={() => {}} // TODO: Implement
        onDeleteStory={() => {}} // TODO: Implement
        isAdmin={false}
        isDarkMode={isDarkMode}
      />

      <StoryUploadModal
        isOpen={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        onUpload={handleStoryUpload}
        isDarkMode={isDarkMode}
      />

      {/* User Gallery Admin Panel */}
      <UserGalleryAdmin
        isDarkMode={isDarkMode}
        isAdmin={isAdminMode}
        onToggleAdmin={setIsAdminMode}
        mediaItems={mediaItems}
        onClearAllData={handleClearAllData}
      />
    </div>
  )
}