import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { MediaItem, Comment, Like } from '../types';

/**
 * DATENMIGRATIONS-SERVICE
 * Migriert Daten von globalen Collections zu benutzer-isolierten Collections
 */

interface MigrationStats {
  mediaItemsMigrated: number;
  commentsMigrated: number;
  likesMigrated: number;
  storiesMigrated: number;
  errors: string[];
}

// Benutzer-isolierte Collection-Pfade
const getUserCollection = (userId: string, collectionName: string) => {
  return collection(db, 'users', userId, collectionName);
};

/**
 * HAUPT-MIGRATIONSFUNKTION
 */
export const migrateUserDataToSecureStructure = async (userId: string): Promise<MigrationStats> => {
  console.log(`🔄 === STARTING DATA MIGRATION FOR USER: ${userId} ===`);
  
  const stats: MigrationStats = {
    mediaItemsMigrated: 0,
    commentsMigrated: 0,
    likesMigrated: 0,
    storiesMigrated: 0,
    errors: []
  };

  try {
    // Migration 1: Media Items
    console.log(`📁 Migrating media items...`);
    await migrateMediaItems(userId, stats);
    
    // Migration 2: Comments
    console.log(`💬 Migrating comments...`);
    await migrateComments(userId, stats);
    
    // Migration 3: Likes
    console.log(`❤️ Migrating likes...`);
    await migrateLikes(userId, stats);
    
    // Migration 4: Stories
    console.log(`📚 Migrating stories...`);
    await migrateStories(userId, stats);
    
    console.log(`✅ === MIGRATION COMPLETED FOR USER: ${userId} ===`);
    console.log(`📊 Stats:`, stats);
    
    return stats;
    
  } catch (error) {
    console.error(`❌ Migration failed for user ${userId}:`, error);
    stats.errors.push(`Migration failed: ${error.message}`);
    return stats;
  }
};

/**
 * MIGRATION: MEDIA ITEMS
 */
const migrateMediaItems = async (userId: string, stats: MigrationStats): Promise<void> => {
  try {
    // Lade alle Media Items aus globaler Collection
    const globalMediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
    const globalMediaSnapshot = await getDocs(globalMediaQuery);
    
    for (const mediaDoc of globalMediaSnapshot.docs) {
      const mediaData = mediaDoc.data() as MediaItem;
      
      // Prüfe ob Media Item zu diesem Benutzer gehört
      if (mediaData.deviceId === userId || 
          mediaData.uploadedBy === userId ||
          (mediaData.userId && mediaData.userId === userId)) {
        
        try {
          // Migriere zu benutzer-isolierter Collection
          const secureMediaData = {
            ...mediaData,
            userId: userId, // Explizite userId setzen
            migratedAt: serverTimestamp(),
            originalId: mediaDoc.id // Referenz zur Original-ID
          };
          
          // In sichere Collection speichern
          await addDoc(getUserCollection(userId, 'media'), secureMediaData);
          
          // Optional: Original löschen (nach erfolgreicher Migration)
          // await deleteDoc(mediaDoc.ref);
          
          stats.mediaItemsMigrated++;
          console.log(`✅ Media migrated: ${mediaData.name}`);
          
        } catch (itemError) {
          const errorMsg = `Failed to migrate media ${mediaData.name}: ${itemError.message}`;
          stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }
    
  } catch (error) {
    const errorMsg = `Media migration failed: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
};

/**
 * MIGRATION: COMMENTS
 */
const migrateComments = async (userId: string, stats: MigrationStats): Promise<void> => {
  try {
    const globalCommentsQuery = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
    const globalCommentsSnapshot = await getDocs(globalCommentsQuery);
    
    for (const commentDoc of globalCommentsSnapshot.docs) {
      const commentData = commentDoc.data() as Comment;
      
      // Prüfe ob Comment zu diesem Benutzer gehört
      if (commentData.deviceId === userId || commentData.userName === userId) {
        
        try {
          const secureCommentData = {
            ...commentData,
            userId: userId,
            migratedAt: serverTimestamp(),
            originalId: commentDoc.id
          };
          
          await addDoc(getUserCollection(userId, 'comments'), secureCommentData);
          stats.commentsMigrated++;
          console.log(`✅ Comment migrated: ${commentData.text.substring(0, 50)}...`);
          
        } catch (itemError) {
          const errorMsg = `Failed to migrate comment: ${itemError.message}`;
          stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }
    
  } catch (error) {
    const errorMsg = `Comments migration failed: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
};

/**
 * MIGRATION: LIKES
 */
const migrateLikes = async (userId: string, stats: MigrationStats): Promise<void> => {
  try {
    const globalLikesQuery = query(collection(db, 'likes'), orderBy('createdAt', 'desc'));
    const globalLikesSnapshot = await getDocs(globalLikesQuery);
    
    for (const likeDoc of globalLikesSnapshot.docs) {
      const likeData = likeDoc.data() as Like;
      
      // Prüfe ob Like zu diesem Benutzer gehört
      if (likeData.deviceId === userId || likeData.userName === userId) {
        
        try {
          const secureLikeData = {
            ...likeData,
            userId: userId,
            migratedAt: serverTimestamp(),
            originalId: likeDoc.id
          };
          
          await addDoc(getUserCollection(userId, 'likes'), secureLikeData);
          stats.likesMigrated++;
          console.log(`✅ Like migrated for media: ${likeData.mediaId}`);
          
        } catch (itemError) {
          const errorMsg = `Failed to migrate like: ${itemError.message}`;
          stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }
    
  } catch (error) {
    const errorMsg = `Likes migration failed: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
};

/**
 * MIGRATION: STORIES
 */
const migrateStories = async (userId: string, stats: MigrationStats): Promise<void> => {
  try {
    const globalStoriesQuery = query(collection(db, 'stories'), orderBy('uploadedAt', 'desc'));
    const globalStoriesSnapshot = await getDocs(globalStoriesQuery);
    
    for (const storyDoc of globalStoriesSnapshot.docs) {
      const storyData = storyDoc.data();
      
      // Prüfe ob Story zu diesem Benutzer gehört
      if (storyData.deviceId === userId || 
          storyData.uploadedBy === userId ||
          storyData.userId === userId) {
        
        try {
          const secureStoryData = {
            ...storyData,
            userId: userId,
            migratedAt: serverTimestamp(),
            originalId: storyDoc.id
          };
          
          await addDoc(getUserCollection(userId, 'stories'), secureStoryData);
          stats.storiesMigrated++;
          console.log(`✅ Story migrated: ${storyData.fileName || 'Unknown'}`);
          
        } catch (itemError) {
          const errorMsg = `Failed to migrate story: ${itemError.message}`;
          stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }
    
  } catch (error) {
    const errorMsg = `Stories migration failed: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
};

/**
 * STORAGE-MIGRATION
 * Migriert Dateien von galleries/ zu users/ Pfadstruktur
 */
export const migrateStorageToSecureStructure = async (userId: string): Promise<void> => {
  console.log(`📁 === STARTING STORAGE MIGRATION FOR USER: ${userId} ===`);
  
  try {
    // Diese Funktion würde alle Dateien von galleries/{userId}/ nach users/{userId}/ verschieben
    // Aufgrund der Firebase Storage-Limitierungen ist dies komplex und erfordert:
    // 1. Download der Original-Datei
    // 2. Upload zur neuen Location
    // 3. Löschen der Original-Datei
    // 4. Update aller Referenzen
    
    console.log(`⚠️ Storage migration requires manual intervention or admin SDK`);
    console.log(`🔧 Current galleries/${userId}/ structure is compatible with security rules`);
    
  } catch (error) {
    console.error(`❌ Storage migration failed:`, error);
    throw error;
  }
};

/**
 * VOLLSTÄNDIGE SYSTEM-MIGRATION
 * Migriert alle Benutzer vom unsicheren zum sicheren System
 */
export const migrateAllUsersToSecureStructure = async (): Promise<void> => {
  console.log(`🚀 === STARTING FULL SYSTEM MIGRATION ===`);
  
  try {
    // Sammle alle eindeutigen Benutzer-IDs aus verschiedenen Collections
    const uniqueUserIds = new Set<string>();
    
    // Sammle User-IDs aus Media
    const mediaSnapshot = await getDocs(collection(db, 'media'));
    mediaSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.deviceId) uniqueUserIds.add(data.deviceId);
      if (data.userId) uniqueUserIds.add(data.userId);
      if (data.uploadedBy) uniqueUserIds.add(data.uploadedBy);
    });
    
    // Sammle User-IDs aus Comments
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    commentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.deviceId) uniqueUserIds.add(data.deviceId);
      if (data.userName) uniqueUserIds.add(data.userName);
    });
    
    // Sammle User-IDs aus Likes
    const likesSnapshot = await getDocs(collection(db, 'likes'));
    likesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.deviceId) uniqueUserIds.add(data.deviceId);
      if (data.userName) uniqueUserIds.add(data.userName);
    });
    
    console.log(`👥 Found ${uniqueUserIds.size} unique users to migrate`);
    
    // Migriere jeden Benutzer
    for (const userId of Array.from(uniqueUserIds)) {
      console.log(`🔄 Migrating user: ${userId}`);
      
      try {
        const stats = await migrateUserDataToSecureStructure(userId);
        console.log(`✅ Migration completed for ${userId}:`, stats);
      } catch (userError) {
        console.error(`❌ Migration failed for ${userId}:`, userError);
      }
    }
    
    console.log(`🎉 === FULL SYSTEM MIGRATION COMPLETED ===`);
    
  } catch (error) {
    console.error(`❌ Full system migration failed:`, error);
    throw error;
  }
};

/**
 * MIGRATIONS-STATUS PRÜFUNG
 */
export const checkMigrationStatus = async (userId: string): Promise<{
  hasSecureData: boolean;
  hasLegacyData: boolean;
  migrationNeeded: boolean;
}> => {
  try {
    // Prüfe ob sichere Daten existieren
    const secureMediaSnapshot = await getDocs(getUserCollection(userId, 'media'));
    const hasSecureData = !secureMediaSnapshot.empty;
    
    // Prüfe ob Legacy-Daten existieren
    const legacyMediaSnapshot = await getDocs(
      query(collection(db, 'media'), orderBy('uploadedAt', 'desc'))
    );
    const hasLegacyData = legacyMediaSnapshot.docs.some(doc => {
      const data = doc.data();
      return data.deviceId === userId || data.uploadedBy === userId;
    });
    
    return {
      hasSecureData,
      hasLegacyData,
      migrationNeeded: hasLegacyData && !hasSecureData
    };
    
  } catch (error) {
    console.error('Migration status check failed:', error);
    return {
      hasSecureData: false,
      hasLegacyData: false,
      migrationNeeded: true
    };
  }
};