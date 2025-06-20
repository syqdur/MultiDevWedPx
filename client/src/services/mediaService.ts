import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { MediaItem } from '@/types';

// Check if Firebase is configured
const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

// Generate user-specific storage path
const getUserStoragePath = (userUID: string, mediaType: 'images' | 'videos' | 'audio', fileName: string): string => {
  return `galleries/${userUID}/${mediaType}/${fileName}`;
};

// Upload files with user isolation
export const uploadFiles = async (
  files: FileList, 
  userName: string, 
  deviceId: string,
  userUID: string,
  onProgress: (progress: number) => void
): Promise<MediaItem[]> => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage is not configured');
  }

  const uploadedItems: MediaItem[] = [];
  let uploaded = 0;

  for (const file of Array.from(files)) {
    // Determine media type and folder
    const mediaType = file.type.startsWith('image/') ? 'images' : 
                     file.type.startsWith('video/') ? 'videos' : 'audio';
    
    const fileName = `${Date.now()}-${file.name}`;
    const storagePath = getUserStoragePath(userUID, mediaType, fileName);
    const storageRef = ref(storage, storagePath);
    
    // Upload file to Firebase Storage
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Create media item for database
    const mediaItem: Partial<MediaItem> = {
      name: fileName,
      url: downloadURL,
      uploadedBy: userName,
      deviceId: deviceId,
      type: mediaType === 'videos' ? 'video' : mediaType === 'audio' ? 'audio' : 'image'
    };
    
    // Save to PostgreSQL database via API
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mediaItem),
    });
    
    if (response.ok) {
      const savedItem = await response.json();
      uploadedItems.push(savedItem);
    }
    
    uploaded++;
    onProgress((uploaded / files.length) * 100);
  }
  
  return uploadedItems;
};

// Upload video blob with user isolation
export const uploadVideoBlob = async (
  videoBlob: Blob,
  userName: string,
  deviceId: string,
  userUID: string,
  onProgress: (progress: number) => void
): Promise<MediaItem | null> => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage is not configured');
  }

  const fileName = `${Date.now()}-recorded-video.webm`;
  const storagePath = getUserStoragePath(userUID, 'videos', fileName);
  const storageRef = ref(storage, storagePath);
  
  onProgress(50);
  
  await uploadBytes(storageRef, videoBlob);
  const downloadURL = await getDownloadURL(storageRef);
  
  // Create media item for database
  const mediaItem: Partial<MediaItem> = {
    name: fileName,
    url: downloadURL,
    uploadedBy: userName,
    deviceId: deviceId,
    type: 'video'
  };
  
  // Save to PostgreSQL database via API
  const response = await fetch('/api/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mediaItem),
  });
  
  onProgress(100);
  
  if (response.ok) {
    return await response.json();
  }
  
  return null;
};

// Add note to database
export const addNote = async (
  noteText: string,
  userName: string,
  deviceId: string
): Promise<MediaItem | null> => {
  // Create note media item for database
  const mediaItem: Partial<MediaItem> = {
    name: `note-${Date.now()}`,
    url: '', // Notes don't have URLs
    uploadedBy: userName,
    deviceId: deviceId,
    type: 'note',
    noteText: noteText
  };
  
  // Save to PostgreSQL database via API
  const response = await fetch('/api/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mediaItem),
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  return null;
};

// Edit note
export const editNote = async (
  noteId: string,
  newText: string
): Promise<void> => {
  // Update note via API
  await fetch(`/api/media/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      noteText: newText
    }),
  });
};

// Delete media item with user isolation
export const deleteMediaItem = async (item: MediaItem, userUID: string): Promise<void> => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage is not configured');
  }

  try {
    // Delete from Firebase Storage if it has a URL
    if (item.url && item.type !== 'note') {
      let fileName = item.name;
      
      // Try to extract filename from Firebase Storage URL
      try {
        const url = new URL(item.url);
        const pathParts = url.pathname.split('/');
        const encodedFileName = pathParts[pathParts.length - 1];
        fileName = decodeURIComponent(encodedFileName);
        fileName = fileName.split('?')[0];
      } catch (pathError) {
        console.warn('Could not parse URL, using item.name:', pathError);
        fileName = item.name;
      }
      
      // Determine media type folder
      const mediaType = item.type === 'image' ? 'images' : 
                       item.type === 'video' ? 'videos' : 'audio';
      
      // Use user-specific path
      const storagePath = getUserStoragePath(userUID, mediaType, fileName);
      
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
        console.log(`Successfully deleted from storage: ${storagePath}`);
      } catch (error) {
        console.warn(`Could not delete file from storage path ${storagePath}:`, error);
      }
    }

    // Delete from PostgreSQL database via API
    await fetch(`/api/media/${item.id}`, {
      method: 'DELETE'
    });
    
    console.log(`Media item ${item.id} deleted successfully`);
  } catch (error) {
    console.error('Error deleting media item:', error);
    throw error;
  }
};

// Load gallery from database
export const loadGallery = (callback: (items: MediaItem[]) => void): () => void => {
  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const items = await response.json();
        callback(items);
      } else {
        console.warn('Failed to load gallery:', response.status);
        callback([]);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      callback([]);
    }
  };

  fetchMedia();
  
  // Set up polling for real-time updates (reduced frequency)
  const interval = setInterval(fetchMedia, 30000);
  
  return () => clearInterval(interval);
};

// Comments API functions
export const loadComments = (callback: (comments: any[]) => void): () => void => {
  const fetchComments = async () => {
    try {
      const response = await fetch('/api/comments');
      if (response.ok) {
        const comments = await response.json();
        callback(comments);
      } else {
        console.warn('Failed to load comments:', response.status);
        callback([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      callback([]);
    }
  };

  fetchComments();
  const interval = setInterval(fetchComments, 30000);
  return () => clearInterval(interval);
};

export const addComment = async (
  mediaId: string,
  text: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const comment = {
    mediaId,
    text,
    userName,
    deviceId
  };

  await fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(comment),
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE'
  });
};

// Likes API functions
export const loadLikes = (callback: (likes: any[]) => void): () => void => {
  const fetchLikes = async () => {
    try {
      const response = await fetch('/api/likes');
      if (response.ok) {
        const likes = await response.json();
        callback(likes);
      } else {
        console.warn('Failed to load likes:', response.status);
        callback([]);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
      callback([]);
    }
  };

  fetchLikes();
  const interval = setInterval(fetchLikes, 30000);
  return () => clearInterval(interval);
};

export const toggleLike = async (
  mediaId: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  // Check if like exists
  const response = await fetch('/api/likes');
  const likes = await response.json();
  
  const existingLike = likes.find((like: any) => 
    like.mediaId === mediaId && like.userName === userName && like.deviceId === deviceId
  );

  if (existingLike) {
    // Remove like
    await fetch(`/api/likes/${existingLike.id}`, {
      method: 'DELETE'
    });
  } else {
    // Add like
    const like = {
      mediaId,
      userName,
      deviceId
    };

    await fetch('/api/likes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(like),
    });
  }
};