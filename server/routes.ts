import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertMediaItemSchema, insertCommentSchema, 
  insertLikeSchema, insertStorySchema, insertTimelineEventSchema,
  insertSpotifyCredentialsSchema, insertMusicWishlistSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user ID" });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Media routes
  app.get("/api/media", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const mediaItems = await storage.getMediaItems(userId);
      res.json(mediaItems);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const mediaItem = await storage.getMediaItem(req.params.id);
      if (!mediaItem) {
        return res.status(404).json({ error: "Media item not found" });
      }
      res.json(mediaItem);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/media", async (req, res) => {
    try {
      const mediaData = insertMediaItemSchema.parse(req.body);
      const mediaItem = await storage.createMediaItem(mediaData);
      res.json(mediaItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid media data" });
    }
  });

  app.put("/api/media/:id", async (req, res) => {
    try {
      const updates = req.body;
      const mediaItem = await storage.updateMediaItem(req.params.id, updates);
      if (!mediaItem) {
        return res.status(404).json({ error: "Media item not found" });
      }
      res.json(mediaItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const success = await storage.deleteMediaItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Media item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Comment routes
  app.get("/api/comments", async (req, res) => {
    try {
      const mediaId = req.query.mediaId as string | undefined;
      const comments = await storage.getComments(mediaId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const success = await storage.deleteComment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Like routes
  app.get("/api/likes", async (req, res) => {
    try {
      const mediaId = req.query.mediaId as string | undefined;
      const likes = await storage.getLikes(mediaId);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/likes", async (req, res) => {
    try {
      const likeData = insertLikeSchema.parse(req.body);
      const like = await storage.createLike(likeData);
      res.json(like);
    } catch (error) {
      res.status(400).json({ error: "Invalid like data" });
    }
  });

  app.delete("/api/likes/:id", async (req, res) => {
    try {
      const success = await storage.deleteLike(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Like not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Story routes
  app.get("/api/stories", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stories = await storage.getStories(userId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      res.status(400).json({ error: "Invalid story data" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const success = await storage.deleteStory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Timeline routes
  app.get("/api/timeline", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const events = await storage.getTimelineEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/timeline", async (req, res) => {
    try {
      const eventData = insertTimelineEventSchema.parse(req.body);
      const event = await storage.createTimelineEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid timeline event data" });
    }
  });

  app.put("/api/timeline/:id", async (req, res) => {
    try {
      const updates = req.body;
      const event = await storage.updateTimelineEvent(req.params.id, updates);
      if (!event) {
        return res.status(404).json({ error: "Timeline event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/timeline/:id", async (req, res) => {
    try {
      const success = await storage.deleteTimelineEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Timeline event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Spotify routes
  app.get("/api/spotify/credentials/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const credentials = await storage.getSpotifyCredentials(userId);
      if (!credentials) {
        return res.status(404).json({ error: "Spotify credentials not found" });
      }
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/spotify/credentials", async (req, res) => {
    try {
      const credentialsData = insertSpotifyCredentialsSchema.parse(req.body);
      const credentials = await storage.createSpotifyCredentials(credentialsData);
      res.json(credentials);
    } catch (error) {
      res.status(400).json({ error: "Invalid credentials data" });
    }
  });

  app.put("/api/spotify/credentials/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      const credentials = await storage.updateSpotifyCredentials(userId, updates);
      if (!credentials) {
        return res.status(404).json({ error: "Spotify credentials not found" });
      }
      res.json(credentials);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Music wishlist routes
  app.get("/api/music/wishlist", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const wishlist = await storage.getMusicWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/music/wishlist", async (req, res) => {
    try {
      const wishlistData = insertMusicWishlistSchema.parse(req.body);
      const item = await storage.createMusicWishlistItem(wishlistData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid wishlist data" });
    }
  });

  app.delete("/api/music/wishlist/:id", async (req, res) => {
    try {
      const success = await storage.deleteMusicWishlistItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName, email } = req.body;

      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const newUser = await storage.createUser({
        username,
        password,
        displayName,
        email: email || username
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        email: newUser.email,
        message: "User registered successfully"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
