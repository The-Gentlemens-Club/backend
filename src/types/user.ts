export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserProfile {
  address: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    showEmail: boolean;
    showStats: boolean;
    showActivity: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface UserStats {
  level: number;
  experience: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalBetAmount: bigint;
  totalWonAmount: bigint;
  highestWin: bigint;
  currentStreak: number;
  bestStreak: number;
  achievements: string[];
  rank: string;
}

export interface UserSession {
  id: string;
  address: string;
  token: string;
  expiresAt: Date;
  lastActivity: Date;
  deviceInfo?: {
    userAgent: string;
    ip: string;
  };
} 