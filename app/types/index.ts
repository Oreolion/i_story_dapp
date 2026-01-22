export interface AuthorProfile {
  id?: string; // Optional: Supabase ID
  name: string | null;
  username: string | null; // Used as identifier in some contract calls? Be careful.
  avatar: string | null;
  wallet_address: string | null;
  badges: string[] | null;
  followers: number;
  isFollowing: boolean; // Managed client-side
}

export interface StoryDataType {
  id: number;
  numeric_id: string;
  author: AuthorProfile;
  author_wallet: AuthorProfile;
  title: string;
  content: string;
  teaser?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  hasAudio: boolean;
   audio_url?: string;
  isLiked: boolean;
  mood: string;
  tags: string[];
  paywallAmount: number;
  isPaid?: boolean;
  is_public: boolean;
  story_date: string;
  created_at: string;
}

export interface StoryCardProps {
  story: StoryDataType; // Now explicitly using the consistent data type
  onLike?: (id: number) => void;
  onFollow?: (username: string) => void;
  onShare?: (id: number) => void;
  onUnlock?: (id: number) => void;
}

export interface FeaturedWriterType {
  name: string;
  username: string;
  avatar: string;
  followers: number;
  stories: number;
  speciality: string;
}

// Note: mockStories now correctly uses the unwrapped StoryType[]
export const mockStories: StoryDataType[] = [
  {
    id: 1,
    numeric_id: "001",
    author_wallet: {
      name: "Sarah Chen",
      username: "0x1234567890abcdef1234567890abcdef12345678",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      badges: ["Top Writer", "Community Star"],
      followers: 1250,
      isFollowing: false,
    },
    title: "The Art of Morning Rituals",
    content:
      "There's something magical about the quiet hours before the world wakes up. My morning ritual has become sacred to me - it starts with gratitude, moves through gentle movement, and ends with setting intentions for the day ahead. This practice has transformed not just my mornings, but my entire approach to life...",
    timestamp: "2 hours ago",
    likes: 89,
    comments: 24,
    shares: 12,
    hasAudio: true,
    isLiked: false,
    mood: "peaceful",
    tags: ["wellness", "morning", "mindfulness"],
    paywallAmount: 0,
    isPaid: true,
  },
  {
    id: 2,
    numeric_id: "002",
    author_wallet: {
      name: "Marcus Rodriguez",
      username: "0x456789abcdef1234567890abcdef1234567890ab",
      avatar:
        "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      badges: ["Storyteller", "Early Adopter"],
      followers: 890,
      isFollowing: true,
    },
    title: "Building Dreams in Code",
    content:
      "Ten years ago, I wrote my first line of code on a borrowed laptop in a coffee shop. Today, I'm launching my third startup. The journey hasn't been linear - there were failures, sleepless nights, and moments of doubt. But every setback taught me something valuable about resilience, creativity, and the power of never giving up on your dreams...",
    timestamp: "5 hours ago",
    likes: 156,
    comments: 43,
    shares: 28,
    hasAudio: false,
    isLiked: true,
    mood: "inspiring",
    tags: ["entrepreneurship", "coding", "dreams"],
    paywallAmount: 10,
    isPaid: false,
    teaser:
      "Unlock the full story of my startup journey—exclusive insights on resilience and code that changed my life.",
  },
  {
    id: 3,
    numeric_id: "003",
    author_wallet: {
      name: "Elena Vasquez",
      username: "0x7890abcdef1234567890abcdef1234567890abcd",
      avatar:
        "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      badges: ["Travel Stories"],
      followers: 654,
      isFollowing: false,
    },
    title: "Letters from Patagonia",
    content:
      "The wind here carries stories from across continents. I'm sitting by a glacial lake, writing by candlelight in my tent, and I've never felt more connected to the natural world. Three weeks into this solo trek through Patagonia, and every day brings new lessons about solitude, strength, and the incredible beauty that exists when we step away from our digital lives...",
    timestamp: "1 day ago",
    likes: 203,
    comments: 67,
    shares: 45,
    hasAudio: true,
    isLiked: false,
    mood: "adventurous",
    tags: ["travel", "nature", "solitude"],
    paywallAmount: 0,
  },
];

export interface CommentDataTypes {
  id: string;
  content: string;
  created_at: string;
  author: {
    name: string | null;
    avatar: string | null;
    wallet_address: string | null;
  };
}

export const featuredWriters = [
  {
    name: "David Kim",
    username: "@davidk",
    avatar:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
    followers: 2100,
    stories: 45,
    speciality: "Life Philosophy",
  },
  {
    name: "Anna Thompson",
    username: "@annat",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
    followers: 1800,
    stories: 38,
    speciality: "Travel Adventures",
  },
  {
    name: "James Wilson",
    username: "@jamesw",
    avatar:
      "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
    followers: 1450,
    stories: 52,
    speciality: "Tech Stories",
  },
];

export const moodColors: { [key: string]: string } = {
  peaceful: "from-green-400 to-emerald-600",
  inspiring: "from-yellow-400 to-orange-500",
  adventurous: "from-blue-400 to-cyan-600",
  nostalgic: "from-purple-400 to-pink-600",
  thoughtful: "from-indigo-400 to-purple-600",
  exciting: "from-red-400 to-orange-600",
  neutral: "from-gray-400 to-slate-600",
  unknown: "from-gray-400 to-slate-600",
};

// === Phase 1: Cognitive Layer Types ===

// Analysis status for tracking AI processing state
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Emotional tone options for AI analysis
export type EmotionalTone =
  | 'reflective'
  | 'joyful'
  | 'anxious'
  | 'hopeful'
  | 'melancholic'
  | 'grateful'
  | 'frustrated'
  | 'peaceful'
  | 'excited'
  | 'uncertain'
  | 'neutral';

// Life domain categories
export type LifeDomain =
  | 'work'
  | 'relationships'
  | 'health'
  | 'identity'
  | 'growth'
  | 'creativity'
  | 'spirituality'
  | 'family'
  | 'adventure'
  | 'learning'
  | 'general';

// Story metadata extracted by AI
export interface StoryMetadata {
  id: string;
  story_id: string;
  themes: string[];
  emotional_tone: EmotionalTone;
  life_domain: LifeDomain;
  intensity_score: number;
  significance_score: number;
  is_canonical: boolean;
  ai_readable: boolean;
  people_mentioned: string[];
  places_mentioned: string[];
  time_references: string[];
  brief_insight: string | null;
  analysis_status?: AnalysisStatus;  // Optional for backwards compatibility
  created_at: string;
  updated_at: string;
}

// Extended story type with metadata (Narrative Object)
export interface NarrativeObject extends StoryDataType {
  metadata?: StoryMetadata | null;
}

// Notification type
export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'tip' | 'follow' | 'book_published' | 'story_mentioned';
  title: string;
  message: string;
  is_read: boolean;
  story_id?: string;
  from_user_id?: string;
  created_at: string;
}
