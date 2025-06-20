import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, ExternalLink, Calendar, Image, FolderOpen } from 'lucide-react';

interface FirebaseUser {
  uid: string;
  displayName?: string;
  email?: string;
  createdAt?: string;
  lastLoginAt?: string;
  mediaCount: number;
  galleryUrl: string;
}

interface FirebaseUserManagementProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export const FirebaseUserManagement: React.FC<FirebaseUserManagementProps> = ({
  isDarkMode,
  onClose
}) => {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all unique users from media collection
      const mediaQuery = query(collection(db, 'media'));
      const mediaSnapshot = await getDocs(mediaQuery);
      const userMap = new Map<string, any>();

      // Extract unique users from media uploads
      mediaSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.uploadedBy || data.userName || 'Unknown';
        const deviceId = data.deviceId || data.uid;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            displayName: userId,
            mediaCount: 0,
            deviceId: deviceId,
            firstUpload: data.uploadedAt || data.createdAt,
            lastUpload: data.uploadedAt || data.createdAt
          });
        }
        
        const user = userMap.get(userId);
        user.mediaCount++;
        
        // Update last upload time
        const uploadTime = data.uploadedAt || data.createdAt;
        if (uploadTime && (!user.lastUpload || uploadTime > user.lastUpload)) {
          user.lastUpload = uploadTime;
        }
      });

      // Convert to FirebaseUser format
      const userData: FirebaseUser[] = Array.from(userMap.entries()).map(([userName, userData]) => ({
        uid: userData.deviceId || userName,
        displayName: userName,
        email: undefined,
        createdAt: userData.firstUpload,
        lastLoginAt: userData.lastUpload,
        mediaCount: userData.mediaCount,
        galleryUrl: `${window.location.origin}/g/${userData.deviceId || userName}`
      }));

      // Sort by media count descending
      userData.sort((a, b) => b.mediaCount - a.mediaCount);

      setUsers(userData);
    } catch (err) {
      console.error('Fehler beim Laden der Benutzer:', err);
      setError('Fehler beim Laden der Benutzerdaten');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unbekannt';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Ungültiges Datum';
    }
  };

  const openGallery = (uid: string) => {
    window.open(`/g/${uid}`, '_blank');
  };

  const openFirebaseStorage = (uid: string) => {
    // Firebase Console Storage URL for this user's folder
    const projectId = 'dev1-b3973'; // From your Firebase config
    const storageUrl = `https://console.firebase.google.com/project/${projectId}/storage/dev1-b3973.firebasestorage.app/files/galleries~2F${uid}`;
    window.open(storageUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Benutzer-Verwaltung
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Alle registrierten Benutzer und deren Galerien
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Schließen
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Lade Benutzerdaten...
              </div>
            </div>
          ) : error ? (
            <div className={`text-center py-12 text-red-500`}>
              {error}
              <button
                onClick={loadUsers}
                className={`block mx-auto mt-4 px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Erneut versuchen
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Keine Benutzer gefunden
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistics */}
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {users.length}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Registrierte Benutzer
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {users.reduce((sum, user) => sum + user.mediaCount, 0)}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Gesamt Medien
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {Math.round(users.reduce((sum, user) => sum + user.mediaCount, 0) / users.length)}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Ø Medien pro Benutzer
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className={`rounded-lg border overflow-hidden ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`grid grid-cols-12 gap-4 p-4 font-semibold text-sm ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'
                }`}>
                  <div className="col-span-3">Benutzer</div>
                  <div className="col-span-2">UID</div>
                  <div className="col-span-1">Medien</div>
                  <div className="col-span-2">Erstellt</div>
                  <div className="col-span-2">Letzter Login</div>
                  <div className="col-span-2">Aktionen</div>
                </div>

                {users.map((user, index) => (
                  <div
                    key={user.uid}
                    className={`grid grid-cols-12 gap-4 p-4 border-t items-center ${
                      isDarkMode 
                        ? 'border-gray-700 hover:bg-gray-750' 
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-750' : 'bg-gray-50')}`}
                  >
                    {/* User Info */}
                    <div className="col-span-3">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.displayName}
                      </div>
                      {user.email && (
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.email}
                        </div>
                      )}
                    </div>

                    {/* UID */}
                    <div className="col-span-2">
                      <code className={`text-xs p-1 rounded ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.uid.substring(0, 8)}...
                      </code>
                    </div>

                    {/* Media Count */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        <span className={`font-medium ${
                          user.mediaCount > 0 
                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                        }`}>
                          {user.mediaCount}
                        </span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Last Login */}
                    <div className="col-span-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatDate(user.lastLoginAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => openGallery(user.uid)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'hover:bg-blue-600 text-blue-400'
                            : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        title="Galerie öffnen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openFirebaseStorage(user.uid)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'hover:bg-orange-600 text-orange-400'
                            : 'hover:bg-orange-100 text-orange-600'
                        }`}
                        title="Firebase Storage öffnen"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};