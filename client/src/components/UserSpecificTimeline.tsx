import React, { useState, useEffect, useRef } from 'react';
import { Heart, Calendar, MapPin, Camera, Plus, Edit3, Trash2, Save, X, Image, Video, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoAuth } from '../contexts/DemoAuthContext';
import { isSupabaseConfigured } from '../config/supabase';

interface TimelineEvent {
  id: string;
  title: string;
  customEventName?: string;
  date: string;
  description: string;
  location?: string;
  type: 'first_date' | 'first_kiss' | 'first_vacation' | 'engagement' | 'moving_together' | 'anniversary' | 'custom' | 'other';
  createdBy: string;
  createdAt: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
}

interface TimelineProps {
  isDarkMode: boolean;
  userName: string;
  isAdmin: boolean;
}

const eventTypes = [
  { value: 'first_date', label: '💕 Erstes Date', icon: '💕', color: 'pink' },
  { value: 'first_kiss', label: '💋 Erster Kuss', icon: '💋', color: 'red' },
  { value: 'first_vacation', label: '✈️ Erster Urlaub', icon: '✈️', color: 'blue' },
  { value: 'moving_together', label: '🏠 Zusammengezogen', icon: '🏠', color: 'green' },
  { value: 'engagement', label: '💍 Verlobung', icon: '💍', color: 'yellow' },
  { value: 'anniversary', label: '🎉 Jahrestag', icon: '🎉', color: 'purple' },
  { value: 'custom', label: '✨ Eigenes Event', icon: '✨', color: 'indigo' },
  { value: 'other', label: '❤️ Sonstiges', icon: '❤️', color: 'gray' }
];

export const UserSpecificTimeline: React.FC<TimelineProps> = ({ isDarkMode, userName, isAdmin }) => {
  const supabaseAuth = useAuth();
  const demoAuth = useDemoAuth();
  const auth = isSupabaseConfigured ? supabaseAuth : demoAuth;
  const { user } = auth;
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    customEventName: '',
    date: '',
    description: '',
    location: '',
    type: 'first_date' as TimelineEvent['type']
  });

  // Get current user ID for localStorage key
  const getCurrentUserId = () => {
    if (!user) return 'anonymous';
    return user.id;
  };

  // Load events from localStorage on component mount
  useEffect(() => {
    const userId = getCurrentUserId();
    const savedEvents = localStorage.getItem(`timeline_${userId}`);
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        const sortedEvents = parsedEvents.sort((a: TimelineEvent, b: TimelineEvent) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Error loading timeline events:', error);
        setEvents([]);
      }
    }
  }, [user]);

  // Save events to localStorage
  const saveEventsToStorage = (eventsToSave: TimelineEvent[]) => {
    const userId = getCurrentUserId();
    localStorage.setItem(`timeline_${userId}`, JSON.stringify(eventsToSave));
  };

  // Handle media upload
  const handleMediaUpload = async (files: FileList) => {
    if (!files.length) return [];

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mediaUrl = URL.createObjectURL(file);
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        
        mediaUrls.push(mediaUrl);
        mediaTypes.push(mediaType);
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      return { mediaUrls, mediaTypes };
    } catch (error) {
      console.error('Media upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.date) {
      alert('Bitte fülle mindestens Titel und Datum aus.');
      return;
    }

    try {
      let mediaUrls: string[] = [];
      let mediaTypes: string[] = [];

      // Handle media upload if files are selected
      if (fileInputRef.current?.files?.length) {
        const uploadResult = await handleMediaUpload(fileInputRef.current.files);
        if (uploadResult && 'mediaUrls' in uploadResult) {
          mediaUrls = uploadResult.mediaUrls;
          mediaTypes = uploadResult.mediaTypes;
        }
      }

      const eventData: TimelineEvent = {
        id: editingEvent?.id || `timeline_${Date.now()}_${Math.random()}`,
        title: formData.title.trim(),
        customEventName: formData.type === 'custom' ? formData.customEventName.trim() : undefined,
        date: formData.date,
        description: formData.description.trim(),
        location: formData.location.trim() || undefined,
        type: formData.type,
        createdBy: userName,
        createdAt: editingEvent?.createdAt || new Date().toISOString(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : editingEvent?.mediaUrls,
        mediaTypes: mediaTypes.length > 0 ? mediaTypes : editingEvent?.mediaTypes
      };

      let updatedEvents: TimelineEvent[];
      if (editingEvent) {
        // Update existing event
        updatedEvents = events.map(event => 
          event.id === editingEvent.id ? eventData : event
        );
      } else {
        // Add new event
        updatedEvents = [eventData, ...events];
      }

      // Sort by date
      updatedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);

      // Reset form
      setFormData({
        title: '',
        customEventName: '',
        date: '',
        description: '',
        location: '',
        type: 'first_date'
      });
      setShowAddForm(false);
      setEditingEvent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error saving timeline event:', error);
      alert('Fehler beim Speichern des Events. Bitte versuche es erneut.');
    }
  };

  // Handle edit
  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      customEventName: event.customEventName || '',
      date: event.date,
      description: event.description,
      location: event.location || '',
      type: event.type
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (event: TimelineEvent) => {
    if (!confirm(`Event "${event.title}" wirklich löschen?`)) {
      return;
    }

    try {
      const updatedEvents = events.filter(e => e.id !== event.id);
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      alert('Fehler beim Löschen des Events.');
    }
  };

  // Get event type info
  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(et => et.value === type) || eventTypes[eventTypes.length - 1];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`p-6 rounded-lg transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className={`w-6 h-6 transition-colors duration-300 ${
            isDarkMode ? 'text-pink-400' : 'text-pink-500'
          }`} />
          <h3 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Unsere Timeline
          </h3>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Event hinzufügen
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={`mb-6 p-4 rounded-lg border transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Event-Typ
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEvent['type'] })}
                  className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-600 border-gray-500 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Datum
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-600 border-gray-500 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
            </div>

            {formData.type === 'custom' && (
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Event-Name
                </label>
                <input
                  type="text"
                  value={formData.customEventName}
                  onChange={(e) => setFormData({ ...formData, customEventName: e.target.value })}
                  placeholder="Eigener Event-Name"
                  className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Titel
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event-Titel"
                className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreibung des Events..."
                rows={3}
                className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Ort (optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ort des Events"
                className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Bilder/Videos (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-pink-600 hover:bg-pink-700 text-white disabled:bg-gray-600'
                    : 'bg-pink-500 hover:bg-pink-600 text-white disabled:bg-gray-400'
                }`}
              >
                <Save className="w-4 h-4" />
                {editingEvent ? 'Aktualisieren' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEvent(null);
                  setFormData({
                    title: '',
                    customEventName: '',
                    date: '',
                    description: '',
                    location: '',
                    type: 'first_date'
                  });
                }}
                className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                <X className="w-4 h-4" />
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline Events */}
      <div className="space-y-6">
        {events.length === 0 ? (
          <div className={`text-center py-12 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Noch keine Timeline-Events erstellt.</p>
            {isAdmin && (
              <p className="mt-2">Klicke auf "Event hinzufügen" um zu starten!</p>
            )}
          </div>
        ) : (
          events.map((event, index) => {
            const typeInfo = getEventTypeInfo(event.type);
            return (
              <div
                key={event.id}
                className={`relative pl-8 pb-8 transition-colors duration-300 ${
                  index !== events.length - 1 ? 'border-l-2' : ''
                } ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 top-0 w-4 h-4 rounded-full transform -translate-x-2 transition-colors duration-300 ${
                  isDarkMode ? 'bg-pink-500' : 'bg-pink-400'
                }`} />

                {/* Event content */}
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <div>
                        <h4 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {event.title}
                        </h4>
                        <div className={`flex items-center gap-4 text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.date)}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(event)}
                          className={`p-1 rounded transition-colors duration-300 ${
                            isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className={`p-1 rounded transition-colors duration-300 ${
                            isDarkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className={`mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {event.description}
                    </p>
                  )}

                  {/* Media */}
                  {event.mediaUrls && event.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                      {event.mediaUrls.map((url, mediaIndex) => (
                        <div key={mediaIndex} className="relative group">
                          {event.mediaTypes?.[mediaIndex] === 'video' ? (
                            <video
                              src={url}
                              className="w-full h-24 object-cover rounded"
                              controls
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Event media ${mediaIndex + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`mt-3 text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Erstellt von {event.createdBy}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};