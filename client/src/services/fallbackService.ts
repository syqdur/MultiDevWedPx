// Temporary fallback service until Firebase is configured
export const createFallbackService = () => ({
  // Site status fallback
  getSiteStatus: async () => ({
    isUnderConstruction: false,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  }),
  
  updateSiteStatus: async () => {},
  
  subscribeSiteStatus: () => () => {},
  
  // Live users fallback
  getLiveUsers: () => [],
  
  updatePresence: async () => {},
  
  removePresence: async () => {},
  
  subscribeToLiveUsers: () => () => {},
  
  // Stories fallback
  getStories: () => [],
  
  addStory: async () => ({ id: 'temp', uploadedBy: 'temp', uploadedAt: new Date().toISOString() }),
  
  deleteStory: async () => {},
  
  subscribeToStories: () => () => {},
  
  // Comments fallback
  getComments: () => [],
  
  addComment: async () => ({ id: 'temp', userName: 'temp', text: '', createdAt: new Date().toISOString() }),
  
  deleteComment: async () => {},
  
  subscribeToComments: () => () => {},
  
  // Gallery fallback
  loadGallery: () => [],
  
  saveMedia: async () => ({ id: 'temp', name: 'temp', url: '', uploadedBy: 'temp', uploadedAt: new Date().toISOString() }),
  
  deleteMedia: async () => {},
  
  subscribeToGallery: () => () => {}
});

export const fallbackService = createFallbackService();