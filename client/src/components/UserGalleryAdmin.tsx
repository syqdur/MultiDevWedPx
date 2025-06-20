import React, { useState } from 'react';
import { Download, Users, Music, Code, Lock, Unlock, Sparkles } from 'lucide-react';
import { downloadAllMedia } from '../services/downloadService';
import { MediaItem } from '../types';
import { UserManagementModal } from './UserManagementModal';
import { SpotifyAdmin } from './SpotifyAdmin';
import { ShowcaseModal } from './ShowcaseModal';

interface UserGalleryAdminProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  mediaItems: MediaItem[];
  onClearAllData: () => Promise<void>;
}

export const UserGalleryAdmin: React.FC<UserGalleryAdminProps> = ({ 
  isDarkMode, 
  isAdmin, 
  onToggleAdmin,
  mediaItems,
  onClearAllData
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSpotifyAdmin, setShowSpotifyAdmin] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);

  const handleAdminToggle = () => {
    onToggleAdmin(!isAdmin);
  };

  const handleDownloadAll = async () => {
    const downloadableItems = mediaItems.filter(item => item.type !== 'note');
    
    if (downloadableItems.length === 0) {
      alert('Keine Medien zum Herunterladen vorhanden.');
      return;
    }

    if (!confirm(`${downloadableItems.length} Medien als ZIP herunterladen?`)) {
      return;
    }

    setIsDownloading(true);
    
    try {
      await downloadAllMedia(mediaItems);
      
      alert(`✅ Download erfolgreich!\n\n📊 Heruntergeladen:\n- ${mediaItems.filter(item => item.type === 'image').length} Bilder\n- ${mediaItems.filter(item => item.type === 'video').length} Videos\n- ${mediaItems.filter(item => item.type === 'note').length} Notizen`);
    } catch (error) {
      console.error('Download error:', error);
      alert(`❌ Download-Fehler:\n${error}\n\nVersuche es erneut oder verwende einen anderen Browser.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getDownloadButtonText = () => {
    const imageCount = mediaItems.filter(item => item.type === 'image').length;
    const videoCount = mediaItems.filter(item => item.type === 'video').length;
    const noteCount = mediaItems.filter(item => item.type === 'note').length;
    
    if (mediaItems.length === 0) return 'Keine Medien';
    
    const parts = [];
    if (imageCount > 0) parts.push(`${imageCount} Bild${imageCount > 1 ? 'er' : ''}`);
    if (videoCount > 0) parts.push(`${videoCount} Video${videoCount > 1 ? 's' : ''}`);
    if (noteCount > 0) parts.push(`${noteCount} Notiz${noteCount > 1 ? 'en' : ''}`);
    
    return parts.join(', ') + ' als ZIP';
  };

  return (
    <>
      {/* Main Admin Toggle Button */}
      <button
        onClick={handleAdminToggle}
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg transition-colors duration-300 z-40 ${
          isDarkMode
            ? isAdmin
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : isAdmin
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}
        title={isAdmin ? "Admin-Modus verlassen" : "Admin-Modus aktivieren"}
      >
        {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
      </button>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="fixed bottom-16 left-4 flex gap-2 z-40">
          {/* User Management Button */}
          <button
            onClick={() => setShowUserManagement(true)}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
            title="👥 User Management - Alle Benutzer verwalten"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Spotify Admin Button */}
          <button
            onClick={() => setShowSpotifyAdmin(true)}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title="🎵 Spotify Admin - Account verwalten"
          >
            <Music className="w-5 h-5" />
          </button>

          {/* Showcase Button */}
          <button
            onClick={() => setShowShowcase(true)}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
            title="🎯 WeddingPix Showcase"
          >
            <Code className="w-5 h-5" />
          </button>
          
          {/* ZIP Download Button */}
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading || mediaItems.length === 0}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDownloading || mediaItems.length === 0
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
            title={getDownloadButtonText()}
          >
            <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      )}

      {/* User Management Modal */}
      <UserManagementModal 
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
        isDarkMode={isDarkMode}
      />

      {/* Spotify Admin Modal */}
      {showSpotifyAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🎵 Spotify Admin Panel
              </h3>
              <button
                onClick={() => setShowSpotifyAdmin(false)}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                ✕
              </button>
            </div>
            
            <SpotifyAdmin isDarkMode={isDarkMode} />
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowSpotifyAdmin(false)}
                className={`py-3 px-6 rounded-xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Showcase Modal */}
      <ShowcaseModal
        isOpen={showShowcase}
        onClose={() => setShowShowcase(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};