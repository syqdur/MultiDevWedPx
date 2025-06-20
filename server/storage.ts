import { 
  users, mediaItems, comments, likes, stories, timelineEvents, spotifyCredentials, musicWishlist,
  type User, type InsertUser, type MediaItem, type InsertMediaItem,
  type Comment, type InsertComment, type Like, type InsertLike,
  type Story, type InsertStory, type TimelineEvent, type InsertTimelineEvent,
  type SpotifyCredentials, type InsertSpotifyCredentials,
  type MusicWishlist, type InsertMusicWishlist
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Media methods
  getMediaItems(userId?: number): Promise<MediaItem[]>;
  getMediaItem(id: string): Promise<MediaItem | undefined>;
  createMediaItem(mediaItem: InsertMediaItem): Promise<MediaItem>;
  updateMediaItem(id: string, updates: Partial<InsertMediaItem>): Promise<MediaItem | undefined>;
  deleteMediaItem(id: string): Promise<boolean>;
  
  // Comment methods
  getComments(mediaId?: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;
  
  // Like methods
  getLikes(mediaId?: string): Promise<Like[]>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: string): Promise<boolean>;
  
  // Story methods
  getStories(userId?: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  deleteStory(id: string): Promise<boolean>;
  
  // Timeline methods
  getTimelineEvents(userId?: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: string, updates: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: string): Promise<boolean>;
  
  // Spotify methods
  getSpotifyCredentials(userId: number): Promise<SpotifyCredentials | undefined>;
  createSpotifyCredentials(credentials: InsertSpotifyCredentials): Promise<SpotifyCredentials>;
  updateSpotifyCredentials(userId: number, updates: Partial<InsertSpotifyCredentials>): Promise<SpotifyCredentials | undefined>;
  
  // Music wishlist methods
  getMusicWishlist(userId?: number): Promise<MusicWishlist[]>;
  createMusicWishlistItem(item: InsertMusicWishlist): Promise<MusicWishlist>;
  deleteMusicWishlistItem(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Media methods
  async getMediaItems(userId?: number): Promise<MediaItem[]> {
    if (userId) {
      return await db.select().from(mediaItems).where(eq(mediaItems.userId, userId)).orderBy(desc(mediaItems.uploadedAt));
    }
    return await db.select().from(mediaItems).orderBy(desc(mediaItems.uploadedAt));
  }

  async getMediaItem(id: string): Promise<MediaItem | undefined> {
    const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
    return item || undefined;
  }

  async createMediaItem(mediaItem: InsertMediaItem): Promise<MediaItem> {
    const [item] = await db
      .insert(mediaItems)
      .values(mediaItem)
      .returning();
    return item;
  }

  async updateMediaItem(id: string, updates: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const [item] = await db
      .update(mediaItems)
      .set(updates)
      .where(eq(mediaItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteMediaItem(id: string): Promise<boolean> {
    const result = await db.delete(mediaItems).where(eq(mediaItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Comment methods
  async getComments(mediaId?: string): Promise<Comment[]> {
    if (mediaId) {
      return await db.select().from(comments).where(eq(comments.mediaId, mediaId)).orderBy(desc(comments.createdAt));
    }
    return await db.select().from(comments).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Like methods
  async getLikes(mediaId?: string): Promise<Like[]> {
    if (mediaId) {
      return await db.select().from(likes).where(eq(likes.mediaId, mediaId)).orderBy(desc(likes.createdAt));
    }
    return await db.select().from(likes).orderBy(desc(likes.createdAt));
  }

  async createLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db
      .insert(likes)
      .values(like)
      .returning();
    return newLike;
  }

  async deleteLike(id: string): Promise<boolean> {
    const result = await db.delete(likes).where(eq(likes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Story methods
  async getStories(userId?: number): Promise<Story[]> {
    if (userId) {
      return await db.select().from(stories).where(eq(stories.userId, userId)).orderBy(desc(stories.uploadedAt));
    }
    return await db.select().from(stories).orderBy(desc(stories.uploadedAt));
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db
      .insert(stories)
      .values(story)
      .returning();
    return newStory;
  }

  async deleteStory(id: string): Promise<boolean> {
    const result = await db.delete(stories).where(eq(stories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Timeline methods
  async getTimelineEvents(userId?: number): Promise<TimelineEvent[]> {
    if (userId) {
      return await db.select().from(timelineEvents).where(eq(timelineEvents.userId, userId)).orderBy(desc(timelineEvents.createdAt));
    }
    return await db.select().from(timelineEvents).orderBy(desc(timelineEvents.createdAt));
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [newEvent] = await db
      .insert(timelineEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateTimelineEvent(id: string, updates: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const [event] = await db
      .update(timelineEvents)
      .set(updates)
      .where(eq(timelineEvents.id, id))
      .returning();
    return event || undefined;
  }

  async deleteTimelineEvent(id: string): Promise<boolean> {
    const result = await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Spotify methods
  async getSpotifyCredentials(userId: number): Promise<SpotifyCredentials | undefined> {
    const [credentials] = await db.select().from(spotifyCredentials).where(eq(spotifyCredentials.userId, userId));
    return credentials || undefined;
  }

  async createSpotifyCredentials(credentials: InsertSpotifyCredentials): Promise<SpotifyCredentials> {
    const [newCredentials] = await db
      .insert(spotifyCredentials)
      .values(credentials)
      .returning();
    return newCredentials;
  }

  async updateSpotifyCredentials(userId: number, updates: Partial<InsertSpotifyCredentials>): Promise<SpotifyCredentials | undefined> {
    const [credentials] = await db
      .update(spotifyCredentials)
      .set(updates)
      .where(eq(spotifyCredentials.userId, userId))
      .returning();
    return credentials || undefined;
  }

  // Music wishlist methods
  async getMusicWishlist(userId?: number): Promise<MusicWishlist[]> {
    if (userId) {
      return await db.select().from(musicWishlist).where(eq(musicWishlist.userId, userId)).orderBy(desc(musicWishlist.addedAt));
    }
    return await db.select().from(musicWishlist).orderBy(desc(musicWishlist.addedAt));
  }

  async createMusicWishlistItem(item: InsertMusicWishlist): Promise<MusicWishlist> {
    const [newItem] = await db
      .insert(musicWishlist)
      .values(item)
      .returning();
    return newItem;
  }

  async deleteMusicWishlistItem(id: string): Promise<boolean> {
    const result = await db.delete(musicWishlist).where(eq(musicWishlist.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
