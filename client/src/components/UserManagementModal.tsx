import React, { useState, useEffect } from 'react';
import { X, Users, Eye, Download, Trash2, ExternalLink, Copy } from 'lucide-react';

interface UserData {
  id: string;
  displayName: string;
  email?: string;
  mediaCount: number;
  storiesCount: number;
  commentsCount: number;
  lastActivity: string;
  galleryUrl: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAllUsers();
    }
  }, [isOpen]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      // Simulate loading users from Firebase/database
      const mockUsers: UserData[] = [
        {
          id: 'admin',
          displayName: 'Administrator',
          email: 'admin@weddingpix.com',
          mediaCount: 0,
          storiesCount: 0,
          commentsCount: 0,
          lastActivity: new Date().toLocaleString(),
          galleryUrl: `/user/admin`
        },
        {
          id: 'demo-user-1',
          displayName: 'Demo User',
          email: 'demo@example.com',
          mediaCount: 5,
          storiesCount: 2,
          commentsCount: 3,
          lastActivity: '2025-06-19 15:30:00',
          galleryUrl: `/user/demo-user-1`
        },
        {
          id: 'test-couple',
          displayName: 'Test Couple',
          email: 'test@example.com',
          mediaCount: 12,
          storiesCount: 5,
          commentsCount: 8,
          lastActivity: '2025-06-18 20:15:00',
          galleryUrl: `/user/test-couple`
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link in Zwischenablage kopiert!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openGallery = (galleryUrl: string) => {
    const fullUrl = `${window.location.origin}${galleryUrl}`;
    window.open(fullUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className={`w-6 h-6 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              User Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {users.length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Registrierte Benutzer
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {users.reduce((sum, user) => sum + user.mediaCount, 0)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gesamt Medien
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {users.reduce((sum, user) => sum + user.storiesCount, 0)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Aktive Stories
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              {users.reduce((sum, user) => sum + user.commentsCount, 0)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Kommentare
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Lade Benutzer...
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.displayName}
                        </h3>
                        {user.id === 'admin' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            ADMIN
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span>
                          <br />
                          <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.email || 'Nicht verfügbar'}
                          </span>
                        </div>
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Medien:</span>
                          <br />
                          <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {user.mediaCount}
                          </span>
                        </div>
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stories:</span>
                          <br />
                          <span className={`font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {user.storiesCount}
                          </span>
                        </div>
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Letzte Aktivität:</span>
                          <br />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {user.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openGallery(user.galleryUrl)}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        title="Galerie öffnen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}${user.galleryUrl}`)}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        title="Link kopieren"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Alle registrierten Benutzer und deren Galerie-Links
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};