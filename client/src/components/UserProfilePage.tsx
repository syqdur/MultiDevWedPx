import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoAuth } from '../contexts/DemoAuthContext';
import { isSupabaseConfigured } from '../config/supabase';
import { ProfileHeader } from './ProfileHeader';
import { UploadSection } from './UploadSection';
import { InstagramGallery } from './InstagramGallery';
import { MediaModal } from './MediaModal';
import { StoriesBar } from './StoriesBar';
import { StoriesViewer } from './StoriesViewer';
import { StoryUploadModal } from './StoryUploadModal';
import { TabNavigation } from './TabNavigation';
import { MusicWishlist } from './MusicWishlist';
import { Timeline } from './Timeline';
import { MediaItem } from '../types';

interface UserProfilePageProps {
  username?: string; // For viewing other users' profiles
  isDarkMode: boolean;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ username, isDarkMode }) => {
  const supabaseAuth = useAuth();
  const demoAuth = useDemoAuth();
  const auth = isSupabaseConfigured ? supabaseAuth : demoAuth;
  const { user } = auth;

  const [profileData, setProfileData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery');
  const [status, setStatus] = useState('');

  // Determine if current user is viewing their own profile
  const isOwner = !username || (user && (
    'display_name' in user ? user.display_name === username : 
    user.email?.split('@')[0] === username
  )) || false;

  // Create unified user for current logged-in user
  const unifiedUser = user ? {
    id: user.id,
    display_name: 'display_name' in user ? user.display_name : user.email?.split('@')[0] || 'User',
    email: user.email || '',
  } : null;

  // Load profile data and media for the user being viewed
  useEffect(() => {
    const loadUserData = () => {
      if (!username && !user) return;

      const targetUserId = username || unifiedUser?.id;
      if (!targetUserId) return;

      // Load profile data from localStorage (in production, this would be from database)
      const storedProfile = localStorage.getItem(`profile_${targetUserId}`);
      if (storedProfile) {
        setProfileData(JSON.parse(storedProfile));
      }

      // Load user's media from localStorage
      const userMedia = JSON.parse(localStorage.getItem(`media_${targetUserId}`) || '[]');
      setMediaItems(userMedia);

      // Load user's stories (if applicable)
      const userStories = JSON.parse(localStorage.getItem(`stories_${targetUserId}`) || '[]');
      setStories(userStories);
    };

    loadUserData();
  }, [username, user, unifiedUser?.id]);

  // Handle profile updates (only for profile owner)
  const handleProfileUpdate = async (updates: { bio?: string; profile_image?: string }) => {
    if (!isOwner || !unifiedUser) return;
    
    try {
      // Update user profile data
      if (isSupabaseConfigured && supabaseAuth.updateProfile) {
        await supabaseAuth.updateProfile(updates);
      } else if (!isSupabaseConfigured && demoAuth.updateProfile) {
        await demoAuth.updateProfile(updates);
      }
      
      // Store in localStorage for immediate persistence
      const userProfileKey = `profile_${unifiedUser.id}`;
      const existingProfile = JSON.parse(localStorage.getItem(userProfileKey) || '{}');
      const updatedProfile = { ...existingProfile, ...updates };
      localStorage.setItem(userProfileKey, JSON.stringify(updatedProfile));
      setProfileData(updatedProfile);
      
      setStatus('✅ Profile updated successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setStatus('❌ Failed to update profile. Please try again.');
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // Handle file uploads (only for profile owner)
  const handleUpload = async (files: FileList) => {
    if (!isOwner || !unifiedUser) return;
    
    setIsUploading(true);
    setStatus('⏳ Uploading files...');

    try {
      const newItems: MediaItem[] = [];
      
      for (const file of Array.from(files)) {
        const fileUrl = URL.createObjectURL(file);
        const newItem: MediaItem = {
          id: `${Date.now()}_${Math.random()}`,
          name: file.name,
          url: fileUrl,
          uploadedBy: unifiedUser.display_name,
          uploadedAt: new Date().toISOString(),
          deviceId: unifiedUser.id,
          type: file.type.startsWith('video/') ? 'video' : 'image',
        };
        newItems.push(newItem);
      }
      
      // Store in localStorage for persistence
      const userMedia = JSON.parse(localStorage.getItem(`media_${unifiedUser.id}`) || '[]');
      const updatedMedia = [...newItems, ...userMedia];
      localStorage.setItem(`media_${unifiedUser.id}`, JSON.stringify(updatedMedia));
      
      setMediaItems(updatedMedia);
      setStatus('✅ Files uploaded successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Upload failed. Please try again.');
      console.error('Upload error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (videoBlob: Blob) => {
    if (!isOwner || !unifiedUser) return;
    
    const videoFile = new File([videoBlob], `video_${Date.now()}.webm`, { type: 'video/webm' });
    const files = new DataTransfer();
    files.items.add(videoFile);
    await handleUpload(files.files);
  };

  const handleNoteSubmit = async (note: string) => {
    if (!isOwner || !unifiedUser) return;
    
    setIsUploading(true);
    setStatus('⏳ Publishing note...');

    try {
      const newNote: MediaItem = {
        id: `note_${Date.now()}_${Math.random()}`,
        name: 'Text Note',
        url: '',
        uploadedBy: unifiedUser.display_name,
        uploadedAt: new Date().toISOString(),
        deviceId: unifiedUser.id,
        type: 'note' as const,
        noteText: note
      };
      
      const userMedia = JSON.parse(localStorage.getItem(`media_${unifiedUser.id}`) || '[]');
      userMedia.unshift(newNote);
      localStorage.setItem(`media_${unifiedUser.id}`, JSON.stringify(userMedia));
      
      setMediaItems(prev => [newNote, ...prev]);
      setStatus('✅ Note published successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Failed to publish note. Please try again.');
      console.error('Note submission error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStoryUpload = async (file: File) => {
    if (!isOwner || !unifiedUser) return;

    setIsUploading(true);
    setStatus('⏳ Story being uploaded...');

    try {
      const storyUrl = URL.createObjectURL(file);
      const newStory = {
        id: `story_${Date.now()}_${Math.random()}`,
        url: storyUrl,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        uploadedBy: unifiedUser.display_name,
        uploadedAt: new Date().toISOString(),
        deviceId: unifiedUser.id,
        userId: unifiedUser.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      const userStories = JSON.parse(localStorage.getItem(`stories_${unifiedUser.id}`) || '[]');
      userStories.unshift(newStory);
      localStorage.setItem(`stories_${unifiedUser.id}`, JSON.stringify(userStories));
      
      setStories(prev => [newStory, ...prev]);
      setStatus('✅ Story uploaded successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Story upload error:', error);
      setStatus('❌ Story upload failed. Please try again.');
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
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
          onAddStory={() => isOwner && setShowStoryUpload(true)}
          onViewStory={(index) => {
            setCurrentStoryIndex(index);
            setShowStoriesViewer(true);
          }}
          isDarkMode={isDarkMode}
        />

        {/* Profile Header */}
        <ProfileHeader 
          isDarkMode={isDarkMode} 
          isOwner={isOwner || false}
          profileData={profileData}
          onProfileUpdate={isOwner ? handleProfileUpdate : undefined}
        />

        {/* Upload Section - Only show for profile owner */}
        {isOwner && (
          <UploadSection
            onUpload={handleUpload}
            onVideoUpload={handleVideoUpload}
            onNoteSubmit={handleNoteSubmit}
            onAddStory={() => setShowStoryUpload(true)}
            isUploading={isUploading}
            progress={uploadProgress}
            isDarkMode={isDarkMode}
          />
        )}

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
              setCurrentImageIndex(index);
              setModalOpen(true);
            }}
            onDelete={() => {}} // TODO: Implement delete functionality
            onEditNote={() => {}} // TODO: Implement edit functionality
            isAdmin={isOwner || false}
            comments={comments}
            likes={likes}
            onAddComment={() => {}} // TODO: Implement comments
            onDeleteComment={() => {}} // TODO: Implement comment deletion
            onToggleLike={() => {}} // TODO: Implement likes
            userName={unifiedUser?.display_name || 'User'}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'music' && (
          <MusicWishlist isDarkMode={isDarkMode} />
        )}

        {activeTab === 'timeline' && (
          <Timeline 
            isDarkMode={isDarkMode} 
            userName={unifiedUser?.display_name || 'User'}
            isAdmin={isOwner}
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
        onAddComment={() => {}}
        onDeleteComment={() => {}}
        onToggleLike={() => {}}
        userName={unifiedUser?.display_name || 'User'}
        isAdmin={isOwner}
        isDarkMode={isDarkMode}
      />

      <StoriesViewer
        isOpen={showStoriesViewer}
        stories={stories}
        initialStoryIndex={currentStoryIndex}
        currentUser={unifiedUser?.display_name || 'User'}
        onClose={() => setShowStoriesViewer(false)}
        onStoryViewed={() => {}}
        onDeleteStory={() => {}}
        isAdmin={isOwner}
        isDarkMode={isDarkMode}
      />

      <StoryUploadModal
        isOpen={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        onUpload={handleStoryUpload}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};