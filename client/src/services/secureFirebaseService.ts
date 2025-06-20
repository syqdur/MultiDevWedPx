import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { MediaItem, Comment, Like } from '../types';

/**
 * SICHERE FIREBASE SERVICE MIT BENUTZER-ISOLATION
 * Alle Operationen werden mit userId-Filterung durchgeführt
 */

// Benutzer-isolierte Collection-Pfade
const getUserCollection = (userId: string, collectionName: string) => {
  return collection(db, 'users', userId, collectionName);
};

// Sichere Storage-Pfade
const getSecureStoragePath = (userId: string, category: string, fileName: string): string => {
  return `users/${userId}/${category}/${fileName}`;
};

// Validierung der Benutzer-ID
const validateUserId = (userId: string): void => {
  if (!userId || userId.trim() === '') {
    throw new Error('Invalid userId: Benutzer-ID ist erforderlich');
  }
};

/**
 * MEDIA OPERATIONS - Benutzer-isoliert
 */
export const loadUserMedia = (userId: string, callback: (media: MediaItem[]) => void): (() => void) => {
  validateUserId(userId);
  
  console.log(`🔒 Loading media for user: ${userId}`);
  
  const mediaQuery = query(
    getUserCollection(userId, 'media'),
    orderBy('uploadedAt', 'desc')
  );
  
  return onSnapshot(mediaQuery, (snapshot) => {
    const media: MediaItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MediaItem));
    
    console.log(`🔒 Loaded ${media.length} media items for user ${userId}`);
    callback(media);
    
  }, (error) => {
    console.error(`❌ Error loading media for user ${userId}:`, error);
    callback([]);
  });
};

export const uploadUserMedia = async (
  userId: string,
  file: File,
  mediaType: 'image' | 'video' | 'audio',
  uploadedBy: string
): Promise<MediaItem> => {
  validateUserId(userId);
  
  console.log(`🔒 Uploading ${mediaType} for user: ${userId}`);
  
  // Sicherer Storage-Pfad
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = getSecureStoragePath(userId, 'media', fileName);
  const storageRef = ref(storage, storagePath);
  
  try {
    // Upload zu Firebase Storage
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Metadaten in benutzer-isolierter Collection speichern
    const mediaData = {
      name: file.name,
      url: downloadURL,
      type: mediaType,
      uploadedBy: uploadedBy,
      uploadedAt: serverTimestamp(),
      deviceId: userId,
      userId: userId, // Explizite userId für zusätzliche Sicherheit
      storagePath: storagePath,
      fileName: fileName,
      size: file.size,
      isUnavailable: false
    };
    
    const docRef = await addDoc(getUserCollection(userId, 'media'), mediaData);
    
    console.log(`🔒 Media uploaded successfully for user ${userId}: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...mediaData,
      uploadedAt: new Date().toISOString()
    } as MediaItem;
    
  } catch (error: any) {
    console.error(`❌ Upload failed for user ${userId}:`, error);
    
    // Cleanup bei Fehler
    try {
      await deleteObject(storageRef);
    } catch (cleanupError) {
      console.warn('Could not cleanup failed upload:', cleanupError);
    }
    
    throw new Error(`Upload fehlgeschlagen: ${error.message}`);
  }
};

export const deleteUserMedia = async (userId: string, mediaItem: MediaItem): Promise<void> => {
  validateUserId(userId);
  
  // Sicherheitscheck: Nur eigene Medien löschen
  if (mediaItem.userId !== userId) {
    throw new Error('Unauthorized: Sie können nur Ihre eigenen Medien löschen');
  }
  
  console.log(`🔒 Deleting media for user ${userId}: ${mediaItem.id}`);
  
  try {
    // Aus Storage löschen
    if (mediaItem.storagePath) {
      const storageRef = ref(storage, mediaItem.storagePath);
      await deleteObject(storageRef);
    }
    
    // Aus Firestore löschen
    await deleteDoc(doc(getUserCollection(userId, 'media'), mediaItem.id));
    
    // Zugehörige Kommentare löschen
    const commentsSnapshot = await getDocs(
      query(getUserCollection(userId, 'comments'), where('mediaId', '==', mediaItem.id))
    );
    const deleteCommentPromises = commentsSnapshot.docs.map(commentDoc => 
      deleteDoc(commentDoc.ref)
    );
    
    // Zugehörige Likes löschen
    const likesSnapshot = await getDocs(
      query(getUserCollection(userId, 'likes'), where('mediaId', '==', mediaItem.id))
    );
    const deleteLikePromises = likesSnapshot.docs.map(likeDoc => 
      deleteDoc(likeDoc.ref)
    );
    
    await Promise.all([...deleteCommentPromises, ...deleteLikePromises]);
    
    console.log(`🔒 Media deleted successfully for user ${userId}: ${mediaItem.id}`);
    
  } catch (error: any) {
    console.error(`❌ Delete failed for user ${userId}:`, error);
    throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  }
};

/**
 * COMMENTS OPERATIONS - Benutzer-isoliert
 */
export const loadUserComments = (userId: string, callback: (comments: Comment[]) => void): (() => void) => {
  validateUserId(userId);
  
  console.log(`🔒 Loading comments for user: ${userId}`);
  
  const commentsQuery = query(
    getUserCollection(userId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(commentsQuery, (snapshot) => {
    const comments: Comment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
    
    console.log(`🔒 Loaded ${comments.length} comments for user ${userId}`);
    callback(comments);
    
  }, (error) => {
    console.error(`❌ Error loading comments for user ${userId}:`, error);
    callback([]);
  });
};

export const addUserComment = async (
  userId: string,
  mediaId: string,
  text: string,
  userName: string
): Promise<void> => {
  validateUserId(userId);
  
  console.log(`🔒 Adding comment for user ${userId} on media ${mediaId}`);
  
  await addDoc(getUserCollection(userId, 'comments'), {
    mediaId,
    text,
    userName,
    userId,
    createdAt: serverTimestamp()
  });
};

export const deleteUserComment = async (userId: string, commentId: string): Promise<void> => {
  validateUserId(userId);
  
  console.log(`🔒 Deleting comment for user ${userId}: ${commentId}`);
  
  await deleteDoc(doc(getUserCollection(userId, 'comments'), commentId));
};

/**
 * LIKES OPERATIONS - Benutzer-isoliert
 */
export const loadUserLikes = (userId: string, callback: (likes: Like[]) => void): (() => void) => {
  validateUserId(userId);
  
  console.log(`🔒 Loading likes for user: ${userId}`);
  
  const likesQuery = query(
    getUserCollection(userId, 'likes'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(likesQuery, (snapshot) => {
    const likes: Like[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Like));
    
    console.log(`🔒 Loaded ${likes.length} likes for user ${userId}`);
    callback(likes);
    
  }, (error) => {
    console.error(`❌ Error loading likes for user ${userId}:`, error);
    callback([]);
  });
};

export const toggleUserLike = async (
  userId: string,
  mediaId: string,
  userName: string
): Promise<void> => {
  validateUserId(userId);
  
  console.log(`🔒 Toggling like for user ${userId} on media ${mediaId}`);
  
  // Check if like exists
  const existingLikes = await getDocs(
    query(
      getUserCollection(userId, 'likes'),
      where('mediaId', '==', mediaId),
      where('userName', '==', userName)
    )
  );
  
  if (existingLikes.empty) {
    // Add like
    await addDoc(getUserCollection(userId, 'likes'), {
      mediaId,
      userName,
      userId,
      createdAt: serverTimestamp()
    });
  } else {
    // Remove like
    await deleteDoc(existingLikes.docs[0].ref);
  }
};

/**
 * STORIES OPERATIONS - Benutzer-isoliert
 */
export interface SecureStory {
  id: string;
  url: string;
  fileName: string;
  mediaType: 'image' | 'video';
  uploadedBy: string;
  uploadedAt: any;
  userId: string;
  expiresAt: Date;
  storagePath: string;
}

export const loadUserStories = (userId: string, callback: (stories: SecureStory[]) => void): (() => void) => {
  validateUserId(userId);
  
  console.log(`🔒 Loading stories for user: ${userId}`);
  
  const storiesQuery = query(
    getUserCollection(userId, 'stories'),
    orderBy('uploadedAt', 'desc')
  );
  
  return onSnapshot(storiesQuery, (snapshot) => {
    const stories: SecureStory[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SecureStory));
    
    // Filter expired stories
    const activeStories = stories.filter(story => {
      const expiresAt = story.expiresAt instanceof Date ? story.expiresAt : new Date(story.expiresAt);
      return expiresAt > new Date();
    });
    
    console.log(`🔒 Loaded ${activeStories.length} active stories for user ${userId}`);
    callback(activeStories);
    
  }, (error) => {
    console.error(`❌ Error loading stories for user ${userId}:`, error);
    callback([]);
  });
};

export const uploadUserStory = async (
  userId: string,
  file: File,
  uploadedBy: string
): Promise<SecureStory> => {
  validateUserId(userId);
  
  console.log(`🔒 Uploading story for user: ${userId}`);
  
  // Sicherer Storage-Pfad für Stories
  const fileName = `story_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = getSecureStoragePath(userId, 'stories', fileName);
  const storageRef = ref(storage, storagePath);
  
  try {
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    const storyData = {
      url: downloadURL,
      fileName: fileName,
      mediaType: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      uploadedBy: uploadedBy,
      uploadedAt: serverTimestamp(),
      userId: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      storagePath: storagePath
    };
    
    const docRef = await addDoc(getUserCollection(userId, 'stories'), storyData);
    
    console.log(`🔒 Story uploaded successfully for user ${userId}: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...storyData,
      uploadedAt: new Date()
    } as SecureStory;
    
  } catch (error: any) {
    // Cleanup on error
    try {
      await deleteObject(storageRef);
    } catch (cleanupError) {
      console.warn('Could not cleanup failed story upload:', cleanupError);
    }
    
    throw new Error(`Story-Upload fehlgeschlagen: ${error.message}`);
  }
};

/**
 * USER PROFILE OPERATIONS - Benutzer-isoliert
 */
export interface UserProfile {
  userId: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  darkMode: boolean;
  audioEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  validateUserId(userId);
  
  console.log(`🔒 Loading profile for user: ${userId}`);
  
  try {
    const profileDoc = doc(db, 'users', userId, 'profile', 'data');
    const snapshot = await getDocs(query(collection(db, 'users', userId, 'profile')));
    
    if (snapshot.empty) {
      return null;
    }
    
    const profileData = snapshot.docs[0].data() as UserProfile;
    console.log(`🔒 Profile loaded for user ${userId}`);
    
    return profileData;
  } catch (error) {
    console.error(`❌ Error loading profile for user ${userId}:`, error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  validateUserId(userId);
  
  console.log(`🔒 Updating profile for user: ${userId}`);
  
  const profileData = {
    ...updates,
    userId,
    updatedAt: new Date().toISOString()
  };
  
  const profileRef = doc(getUserCollection(userId, 'profile'), 'data');
  await updateDoc(profileRef, profileData);
  
  console.log(`🔒 Profile updated for user ${userId}`);
};