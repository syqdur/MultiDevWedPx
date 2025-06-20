import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Story {
  id: string;
  url: string;
  fileName: string;
  mediaType: 'image' | 'video';
  uploadedBy: string;
  uploadedAt: any;
  deviceId: string;
  userId: string;
  expiresAt: Date;
  storagePath: string;
}

export interface UserStory {
  userName: string;
  stories: Story[];
  latestStory: Story;
  hasUnviewed: boolean;
}

export const loadStories = (callback: (stories: Story[]) => void): (() => void) => {
  const storiesQuery = query(
    collection(db, 'stories'),
    orderBy('uploadedAt', 'desc')
  );
  
  return onSnapshot(storiesQuery, (snapshot) => {
    const stories: Story[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Story));
    
    // Filter out expired stories
    const activeStories = stories.filter(story => {
      const expiresAt = story.expiresAt instanceof Date ? story.expiresAt : new Date(story.expiresAt);
      return expiresAt > new Date();
    });
    
    console.log(`📚 Loaded ${activeStories.length} active stories (${stories.length - activeStories.length} expired)`);
    callback(activeStories);
    
  }, (error) => {
    console.error('❌ Error loading stories:', error);
    callback([]);
  });
};

export const loadUserStories = (userId: string, callback: (stories: Story[]) => void): (() => void) => {
  const userStoriesQuery = query(
    collection(db, 'stories'),
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  
  return onSnapshot(userStoriesQuery, (snapshot) => {
    const stories: Story[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Story));
    
    // Filter out expired stories
    const activeStories = stories.filter(story => {
      const expiresAt = story.expiresAt instanceof Date ? story.expiresAt : new Date(story.expiresAt);
      return expiresAt > new Date();
    });
    
    console.log(`📚 Loaded ${activeStories.length} stories for user ${userId}`);
    callback(activeStories);
    
  }, (error) => {
    console.error('❌ Error loading user stories:', error);
    callback([]);
  });
};

export const groupStoriesByUser = (stories: Story[]): UserStory[] => {
  const userGroups: { [userName: string]: Story[] } = {};
  
  // Group stories by user
  stories.forEach(story => {
    if (!userGroups[story.uploadedBy]) {
      userGroups[story.uploadedBy] = [];
    }
    userGroups[story.uploadedBy].push(story);
  });
  
  // Convert to UserStory format
  return Object.entries(userGroups).map(([userName, userStories]) => {
    const sortedStories = userStories.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
    return {
      userName,
      stories: sortedStories,
      latestStory: sortedStories[0],
      hasUnviewed: true // TODO: Implement viewed tracking
    };
  });
};

export const uploadStory = async (
  file: File,
  userName: string,
  userId: string
): Promise<Story> => {
  console.log(`📤 === STORY UPLOAD START ===`);
  console.log(`👤 User: ${userName} (${userId})`);
  console.log(`📁 File: ${file.name} (${file.size} bytes)`);
  
  // Create unique filename
  const timestamp = Date.now();
  const cleanUserName = userName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileExtension = file.name.split('.').pop() || 'unknown';
  const fileName = `STORY_${timestamp}_${cleanUserName}.${fileExtension}`;
  
  console.log(`✅ Generated filename: ${fileName}`);
  
  // Upload to Firebase Storage using galleries path for consistent permissions
  const storageRef = ref(storage, `galleries/${userId}/${fileName}`);
  
  try {
    console.log(`📤 Uploading to: galleries/${userId}/${fileName}`);
    const uploadResult = await uploadBytes(storageRef, file);
    console.log(`✅ Upload completed successfully`);
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`🔗 Got download URL: ${downloadURL.substring(0, 80)}...`);
    
    // Save story metadata to Firestore
    const storyData = {
      url: downloadURL,
      fileName: fileName,
      mediaType: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      uploadedBy: userName,
      uploadedAt: serverTimestamp(),
      deviceId: userId,
      userId: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      storagePath: `galleries/${userId}/${fileName}`
    };
    
    const storyDoc = await addDoc(collection(db, 'stories'), storyData);
    console.log(`✅ Story metadata saved to Firestore with ID: ${storyDoc.id}`);
    
    return {
      id: storyDoc.id,
      ...storyData,
      uploadedAt: new Date()
    } as Story;
    
  } catch (error: any) {
    console.error('❌ Story upload failed:', error);
    
    // Clean up uploaded file on error
    try {
      await deleteObject(storageRef);
      console.log(`🧹 Cleaned up uploaded file after error`);
    } catch (cleanupError) {
      console.warn(`⚠️ Could not clean up uploaded file:`, cleanupError);
    }
    
    // Provide user-friendly error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Keine Berechtigung zum Hochladen. Lade die Seite neu und versuche es erneut.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Speicherplatz voll. Kontaktiere den Administrator.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload wurde abgebrochen.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Netzwerkfehler. Prüfe deine Internetverbindung und versuche es erneut.');
    } else {
      throw new Error(`Upload-Fehler: ${error.message || 'Unbekannter Fehler'}`);
    }
  }
};

export const deleteStory = async (story: Story): Promise<void> => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'stories', story.id));
    
    // Delete from Storage
    const storageRef = ref(storage, story.storagePath);
    await deleteObject(storageRef);
    
    console.log(`✅ Story ${story.id} deleted successfully`);
  } catch (error) {
    console.error('❌ Error deleting story:', error);
    throw error;
  }
};