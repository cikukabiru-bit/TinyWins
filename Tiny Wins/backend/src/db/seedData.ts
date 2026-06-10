import { ContentItem, InspirationItem } from './types';

export const seedContentItems: Partial<ContentItem>[] = [
  {
    title: "Gentle 5-Minute Morning Stretch",
    category: "Fitness",
    type: "video",
    url: "https://www.youtube.com/watch?v=sTANio_2E0Q",
    platform: "YouTube",
    short_description: "A slow, gentle morning stretch routine to wake up your body.",
    tags: ["stretch", "morning", "easy"],
    estimated_duration: "5m",
    mood: "calm",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "10-Minute Full Body Stretch",
    category: "Fitness",
    type: "video",
    url: "https://www.youtube.com/watch?v=g_tea8ZNk5A",
    platform: "YouTube",
    short_description: "Relaxing full body stretch suitable for any time of the day.",
    tags: ["stretch", "relaxing", "fitness"],
    estimated_duration: "10m",
    mood: "calm",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "Deep Focus Ambient Beats",
    category: "Focus",
    type: "playlist",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0EXPn",
    platform: "Spotify",
    short_description: "Calm, non-lyrical beats to help you concentrate quietly.",
    tags: ["focus", "work", "ambient"],
    estimated_duration: "60m+",
    mood: "neutral",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "Guided Box Breathing Exercise",
    category: "Self-care",
    type: "breathing",
    url: "https://www.youtube.com/watch?v=tEmt1Znux58",
    platform: "YouTube",
    short_description: "A simple 4-second box breathing exercise to reduce anxiety and stress.",
    tags: ["breathing", "calm", "anxiety"],
    estimated_duration: "3m",
    mood: "calm",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "Peaceful Devotions & Devotional Songs",
    category: "Prayer/Spirituality",
    type: "playlist",
    url: "https://open.spotify.com/playlist/37i9dQZF1DXcCn89JCH2Qd",
    platform: "Spotify",
    short_description: "Soothing acoustic worship songs and peaceful hymns.",
    tags: ["worship", "spiritual", "peaceful"],
    estimated_duration: "60m+",
    mood: "calm",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "Daily Prayer & Bible Verse Reflection",
    category: "Prayer/Spirituality",
    type: "podcast",
    url: "https://open.spotify.com/show/5R3u1TidZlWz3f0T3HagI6",
    platform: "Spotify",
    short_description: "Short daily prayer prompts and quiet Bible scripture readings.",
    tags: ["prayer", "scripture", "daily"],
    estimated_duration: "8m",
    mood: "calm",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "Wind Down Sleep Sounds (Rainfall)",
    category: "Sleep",
    type: "playlist",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
    platform: "Spotify",
    short_description: "Continuous peaceful rainfall sounds for a gentle sleep transition.",
    tags: ["sleep", "rain", "calming"],
    estimated_duration: "120m+",
    mood: "tired",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  },
  {
    title: "Budgeting for Beginners Guide",
    category: "Money",
    type: "article",
    url: "https://www.nerdwallet.com/article/finance/how-to-budget",
    platform: "Website",
    short_description: "A gentle step-by-step introduction to the 50/30/20 budget framework.",
    tags: ["money", "budgeting", "easy"],
    estimated_duration: "8m",
    mood: "hopeful",
    is_default: true,
    is_user_added: false,
    is_favourite: false
  }
];

export const seedInspirationItems: Partial<InspirationItem>[] = [
  // Motivational
  { text: "One small step is still movement.", author: "App Original", type: "quote", tone: "Motivational", tags: ["movement", "progress", "small"] },
  { text: "You do not need a perfect day to make progress.", author: "App Original", type: "quote", tone: "Motivational", tags: ["progress", "perfection"] },
  { text: "Start where you are. Keep it small.", author: "App Original", type: "quote", tone: "Motivational", tags: ["start", "small"] },
  
  // Calm
  { text: "Breathe first. Begin softly.", author: "App Original", type: "reflection", tone: "Calm", tags: ["breathe", "soft"] },
  { text: "A gentle step still counts.", author: "App Original", type: "reflection", tone: "Calm", tags: ["step", "counts"] },
  { text: "Today only needs one honest effort.", author: "App Original", type: "reflection", tone: "Calm", tags: ["effort", "today"] },
  
  // Restart / Soft Reset
  { text: "Begin again, without punishment.", author: "App Original", type: "reflection", tone: "Calm", tags: ["restart", "grace"] },
  { text: "A soft reset is still progress.", author: "App Original", type: "reflection", tone: "Calm", tags: ["restart", "soft-reset"] },
  { text: "You are not starting from nothing. You are starting with experience.", author: "App Original", type: "reflection", tone: "Motivational", tags: ["restart", "experience"] },

  // Prayer prompt (only for spiritual settings)
  { text: "Take one quiet minute and place this day before God.", author: "App Original", type: "prompt", tone: "Spiritual", tags: ["prayer", "quiet", "god"] },
  { text: "Pause, breathe, and pray with honesty.", author: "App Original", type: "prompt", tone: "Spiritual", tags: ["prayer", "breath"] },
  { text: "Begin this habit with gratitude.", author: "App Original", type: "prompt", tone: "Spiritual", tags: ["gratitude", "prayer"] },

  // Bible Verses (only for spiritual settings)
  { text: "The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning.", author: "Lamentations 3:22-23", type: "verse", tone: "Spiritual", tags: ["bible", "mercy", "morning"] },
  { text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.", author: "2 Timothy 1:7", type: "verse", tone: "Spiritual", tags: ["bible", "peace", "courage"] },
  { text: "Be still, and know that I am God.", author: "Psalm 46:10", type: "verse", tone: "Spiritual", tags: ["bible", "stillness", "peace"] },

  // Saint Quotes (only for spiritual settings)
  { text: "Start by doing what's necessary; then do what's possible; and suddenly you are doing the impossible.", author: "St. Francis of Assisi", type: "saint_quote", tone: "Spiritual", tags: ["saint", "doing"] },
  { text: "Have patience with all things, but, first of all, with yourself.", author: "St. Francis de Sales", type: "saint_quote", tone: "Spiritual", tags: ["saint", "patience", "self-love"] },

  // Gratitude
  { text: "Write one thing that carried you today.", author: "App Original", type: "prompt", tone: "Calm", tags: ["gratitude", "carried"] },
  { text: "Notice one small mercy from today.", author: "App Original", type: "prompt", tone: "Calm", tags: ["gratitude", "mercy"] },
  { text: "Name one thing that gave you strength.", author: "App Original", type: "prompt", tone: "Calm", tags: ["gratitude", "strength"] }
];
