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
  totalWinAmount: bigint;
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

export enum NotificationType {
  GAME_RESULT = 'game_result',
  TOURNAMENT_JOINED = 'tournament_joined',
  TOURNAMENT_STARTED = 'tournament_started',
  TOURNAMENT_ENDED = 'tournament_ended',
  TOURNAMENT_WON = 'tournament_won',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  REWARD_CLAIMED = 'reward_claimed',
  SYSTEM = 'system'
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipientAddress: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
} 