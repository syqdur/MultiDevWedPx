import React, { useState, useRef } from 'react';
import { Settings, UserPlus, Camera, Edit2, Save, X, Trash2, Database, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoAuth } from '../contexts/DemoAuthContext';

interface ProfileHeaderProps {
  isDarkMode: boolean;
  isOwner?: boolean; // Whether current user is viewing their own profile
  profileData?: {
    display_name: string;
    bio: string;
    profile_image: string | null;
    followerCount?: number;
  };
  onProfileUpdate?: (updates: { bio?: string; profile_image?: string }) => Promise<void>;
  onClearAllData?: () => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  isDarkMode, 
  isOwner = false, 
  profileData, 
  onProfileUpdate,
  onClearAllData 
}) => {
  const { user: supabaseUser, profile: supabaseProfile } = useAuth();
  const { user: demoUser } = useDemoAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use provided profileData or fall back to current user data
  const currentUser = supabaseUser || demoUser;
  
  // Get user display name safely
  const getUserDisplayName = () => {
    if (supabaseProfile?.display_name) return supabaseProfile.display_name;
    if (demoUser?.display_name) return demoUser.display_name;
    if (supabaseUser?.email) return supabaseUser.email.split('@')[0];
    return 'User';
  };

  // Get user profile image safely
  const getUserProfileImage = () => {
    if (supabaseProfile?.profile_image) return supabaseProfile.profile_image;
    if (demoUser && 'profile_image' in demoUser) return (demoUser as any).profile_image;
    return null;
  };

  const currentProfile = profileData || {
    display_name: getUserDisplayName(),
    bio: supabaseProfile?.bio || 'Welcome to my wedding gallery!',
    profile_image: getUserProfileImage(),
    followerCount: 0
  };

  // Ensure bio is always a string
  if (currentProfile && !currentProfile.bio) {
    currentProfile.bio = 'Welcome to my wedding gallery!';
  }

  // Default to Kristin & Maurizio profile if no user data (preserves original)
  const displayProfile = currentUser ? {
    ...currentProfile,
    bio: currentProfile.bio || 'Welcome to my wedding gallery!'
  } : {
    display_name: 'kristinundmauro.de',
    bio: 'Wir sagen JA! ✨\n12.07.2025 - Der schönste Tag unseres Lebens 💍\nTeilt eure Lieblingsmomente mit uns! 📸\n#MaurizioUndKristin #Hochzeit2025 #FürImmer',
    profile_image: 'https://i.ibb.co/PvXjwss4/profil.jpg',
    followerCount: Infinity
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onProfileUpdate || !isOwner) return;

    setIsUploading(true);
    try {
      // Create a blob URL for immediate preview
      const imageUrl = URL.createObjectURL(file);
      await onProfileUpdate({ profile_image: imageUrl });
    } catch (error) {
      console.error('Failed to upload profile image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBioEdit = () => {
    setBioText(displayProfile.bio);
    setIsEditingBio(true);
  };

  const handleBioSave = async () => {
    if (!onProfileUpdate || !isOwner) return;
    
    try {
      await onProfileUpdate({ bio: bioText });
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to update bio:', error);
    }
  };

  const handleBioCancel = () => {
    setBioText('');
    setIsEditingBio(false);
  };

  const handleClearSpotifyData = () => {
    const currentUser = supabaseUser || demoUser;
    if (currentUser) {
      localStorage.removeItem(`spotify_${currentUser.id}`);
      alert('Spotify data cleared successfully!');
    }
  };

  const handleClearTimeline = () => {
    const currentUser = supabaseUser || demoUser;
    if (currentUser) {
      localStorage.removeItem(`timeline_${currentUser.id}`);
      alert('Timeline data cleared successfully!');
    }
  };

  const handleClearAllUserData = async () => {
    if (onClearAllData) {
      await onClearAllData();
      setShowAdminPanel(false);
    }
  };

  return (
    <div className={`p-4 border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
          <img 
            src={displayProfile.profile_image || 'https://via.placeholder.com/80x80?text=👤'} 
            alt={`${displayProfile.display_name} Profile`}
            className="w-full h-full object-cover"
          />
          {isOwner && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${
                isUploading ? 'opacity-100 cursor-wait' : 'cursor-pointer'
              }`}
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <h2 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {displayProfile.display_name}
          </h2>
          <div className={`flex gap-6 mt-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <span>
              <strong>{displayProfile.followerCount === Infinity ? '∞' : displayProfile.followerCount}</strong> Follower
            </span>
          </div>
        </div>
      </div>
     
      <div className="space-y-2">
        {isEditingBio ? (
          <div className="space-y-2">
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className={`w-full p-2 border rounded-md resize-none transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={4}
              placeholder="Tell your story..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleBioSave}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Save className="w-3 h-3 inline mr-1" />
                Save
              </button>
              <button
                onClick={handleBioCancel}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                <X className="w-3 h-3 inline mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {(displayProfile.bio || '').split('\n').map((line, index) => (
                <span key={index}>
                  {line}
                  {index < (displayProfile.bio || '').split('\n').length - 1 && <br />}
                </span>
              ))}
              {!currentUser && (
                <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  💻 coded by Mauro
                </span>
              )}
            </div>
            {isOwner && (
              <button
                onClick={handleBioEdit}
                className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <button className={`p-1.5 rounded-md transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
        }`}>
          <UserPlus className={`w-4 h-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`} />
        </button>
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`p-1.5 rounded-md transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Settings className={`w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </button>
            
            {showAdminPanel && (
              <div className={`absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg border z-50 ${
                isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  <h3 className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Admin Controls
                  </h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={handleClearSpotifyData}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'text-blue-400 hover:bg-gray-700' 
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Music className="w-4 h-4" />
                      Disconnect Spotify
                    </button>
                    
                    <button
                      onClick={handleClearTimeline}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'text-yellow-400 hover:bg-gray-700' 
                          : 'text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      Clear Timeline
                    </button>
                    
                    <button
                      onClick={handleClearAllUserData}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-gray-700' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowAdminPanel(false)}
                    className={`mt-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
