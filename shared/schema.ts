import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  darkMode: boolean("dark_mode").default(false),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mediaItems = pgTable("media_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  deviceId: text("device_id").notNull(),
  type: text("type").notNull(), // 'image', 'video', 'note'
  noteText: text("note_text"),
  isUnavailable: boolean("is_unavailable").default(false),
  userId: integer("user_id").references(() => users.id),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  mediaId: uuid("media_id").references(() => mediaItems.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  mediaId: uuid("media_id").references(() => mediaItems.id, { onDelete: "cascade" }).notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  deviceId: text("device_id").notNull(),
  type: text("type").notNull(), // 'image', 'video'
  expiresAt: timestamp("expires_at"),
  isVisible: boolean("is_visible").default(true),
  userId: integer("user_id").references(() => users.id),
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  customEventName: text("custom_event_name"),
  date: text("date").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  type: text("type").notNull(), // 'first_date', 'first_kiss', etc.
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  mediaUrls: text("media_urls").array(),
  mediaTypes: text("media_types").array(),
  mediaFileNames: text("media_file_names").array(),
  userId: integer("user_id").references(() => users.id),
});

export const spotifyCredentials = pgTable("spotify_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const musicWishlist = pgTable("music_wishlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: text("track_id").notNull(),
  name: text("name").notNull(),
  artists: text("artists").notNull(),
  album: text("album").notNull(),
  albumImage: text("album_image"),
  uri: text("uri").notNull(),
  addedBy: text("added_by").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  mediaItems: many(mediaItems),
  comments: many(comments),
  likes: many(likes),
  stories: many(stories),
  timelineEvents: many(timelineEvents),
  spotifyCredentials: many(spotifyCredentials),
  musicWishlist: many(musicWishlist),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one, many }) => ({
  user: one(users, { fields: [mediaItems.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  mediaItem: one(mediaItems, { fields: [comments.mediaId], references: [mediaItems.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  mediaItem: one(mediaItems, { fields: [likes.mediaId], references: [mediaItems.id] }),
  user: one(users, { fields: [likes.userId], references: [users.id] }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  user: one(users, { fields: [timelineEvents.userId], references: [users.id] }),
}));

export const spotifyCredentialsRelations = relations(spotifyCredentials, ({ one }) => ({
  user: one(users, { fields: [spotifyCredentials.userId], references: [users.id] }),
}));

export const musicWishlistRelations = relations(musicWishlist, ({ one }) => ({
  user: one(users, { fields: [musicWishlist.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({
  id: true,
  uploadedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  uploadedAt: true,
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSpotifyCredentialsSchema = createInsertSchema(spotifyCredentials).omit({
  id: true,
  createdAt: true,
});

export const insertMusicWishlistSchema = createInsertSchema(musicWishlist).omit({
  id: true,
  addedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertSpotifyCredentials = z.infer<typeof insertSpotifyCredentialsSchema>;
export type SpotifyCredentials = typeof spotifyCredentials.$inferSelect;
export type InsertMusicWishlist = z.infer<typeof insertMusicWishlistSchema>;
export type MusicWishlist = typeof musicWishlist.$inferSelect;
