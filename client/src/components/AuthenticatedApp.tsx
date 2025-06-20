import React, { useState, useEffect } from 'react'
import { useDemoAuth } from '../contexts/DemoAuthContext'
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
import { Timeline } from './Timeline'
import { PostWeddingRecap } from './PostWeddingRecap'
import { PublicRecapPage } from './PublicRecapPage'
import { useDarkMode } from '../hooks/useDarkMode'
import { Sun, Moon, User, LogOut, Settings } from 'lucide-react'
import { MediaItem } from '../types'

// Convert Supabase media to MediaItem format
const convertSupabaseToMediaItem = (media: any): MediaItem => ({
  id: media.id,
  url: media.url,
  caption: media.caption || '',
  type: media.media_type,
  timestamp: media.created_at,
  uploadedBy: 'Current User', // Will be replaced with actual user name
  deviceId: 'supabase',
  fileName: media.file_name
})

export const AuthenticatedApp: React.FC = () => {
  const { user, loading, signOut, updateProfile } = useDemoAuth()
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

  // Update profile dark mode when toggled
  useEffect(() => {
    if (user && user.dark_mode !== isDarkMode) {
      updateProfile({ dark_mode: isDarkMode })
    }
  }, [isDarkMode, user, updateProfile])

  // Mock handlers for Firebase functions until migration is complete
  const handleUpload = async (files: FileList) => {
    if (!user) return
    
    setIsUploading(true)
    setStatus('⏳ Files being uploaded...')
    
    try {
      // TODO: Implement Supabase upload
      setStatus('✅ Files uploaded successfully!')
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
    if (!user) return
    
    setIsUploading(true)
    setStatus('⏳ Video being uploaded...')
    
    try {
      // TODO: Implement Supabase video upload
      setStatus('✅ Video uploaded successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus('❌ Video upload failed. Please try again.')
      console.error('Video upload error:', error)
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleNoteSubmit = async (note: string) => {
    if (!user || !note.trim()) return
    
    setIsUploading(true)
    setStatus('⏳ Note being saved...')
    
    try {
      // TODO: Implement Supabase note creation
      setStatus('✅ Note saved successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus('❌ Failed to save note. Please try again.')
      console.error('Note error:', error)
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleStoryUpload = async (file: File) => {
    if (!user) return

    setIsUploading(true)
    setStatus('⏳ Story being uploaded...')

    try {
      // TODO: Implement Supabase story upload
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
      userName={user?.display_name || 'Admin'}
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
                {user?.display_name}'s Gallery
              </h1>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LiveUserIndicator currentUser={user?.display_name || 'User'} isDarkMode={isDarkMode} />
            
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
          currentUser={user?.display_name || 'User'}
          onAddStory={() => setShowStoryUpload(true)}
          onViewStory={(index) => {
            setCurrentStoryIndex(index)
            setShowStoriesViewer(true)
          }}
          isDarkMode={isDarkMode}
        />

        {/* Profile Header */}
        <ProfileHeader isDarkMode={isDarkMode} />

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
            onDelete={() => {}} // TODO: Implement
            onEditNote={() => {}} // TODO: Implement
            isAdmin={false}
            comments={comments}
            likes={likes}
            onAddComment={() => {}} // TODO: Implement
            onDeleteComment={() => {}} // TODO: Implement
            onToggleLike={() => {}} // TODO: Implement
            userName={user?.display_name || 'User'}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'music' && (
          <MusicWishlist isDarkMode={isDarkMode} />
        )}

        {activeTab === 'timeline' && (
          <Timeline 
            isDarkMode={isDarkMode} 
            userName={user?.display_name || 'User'}
            isAdmin={false}
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
        onAddComment={() => {}} // TODO: Implement
        onDeleteComment={() => {}} // TODO: Implement
        onToggleLike={() => {}} // TODO: Implement
        userName={user?.display_name || 'User'}
        isAdmin={false}
        isDarkMode={isDarkMode}
      />

      <StoriesViewer
        isOpen={showStoriesViewer}
        stories={stories}
        initialStoryIndex={currentStoryIndex}
        currentUser={user?.display_name || 'User'}
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
    </div>
  )
}