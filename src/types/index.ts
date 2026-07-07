export type ConfessionCategory =
  | 'Love'
  | 'School'
  | 'Family'
  | 'Friendship'
  | 'Regret'
  | 'Secret'
  | 'Funny'
  | 'Other';

export interface Comment {
  id: string;
  content: string;
  nickname: string;
  createdAt: string;
}

export interface ConfessionReactions {
  hug: number;     // 🤗
  heart: number;   // ❤️
  sad: number;     // 😢
  laugh: number;   // 😂
  shocked: number; // 😮
}

export interface Confession {
  id: string;
  content: string;
  category: ConfessionCategory;
  nickname: string;
  isPublic: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reactions: ConfessionReactions;
  comments: Comment[];
  reportsCount: number;
  image?: string;
  facebookPostId?: string;
}
