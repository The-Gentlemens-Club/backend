import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { UserProfile, UserSettings, UserStats, UserSession } from '../types/user';
import { NotificationService } from './notificationService';

export class UserService {
  private users: Map<string, UserProfile> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  // Initialize a new user profile
  private initializeUserProfile(address: string): UserProfile {
    return {
      address,
      username: `Player_${address.slice(0, 6)}`,
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
      settings: {
        notifications: {
          email: true,
          push: true,
          inApp: true
        },
        privacy: {
          showEmail: false,
          showStats: true,
          showActivity: true
        },
        theme: 'system',
        language: 'en'
      },
      stats: {
        level: 1,
        experience: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        totalBetAmount: BigInt(0),
        totalWinAmount: BigInt(0),
        highestWin: BigInt(0),
        currentStreak: 0,
        bestStreak: 0,
        achievements: [],
        rank: 'Bronze'
      }
    };
  }

  // Register a new user
  async registerUser(address: string, username: string): Promise<UserProfile> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    if (this.users.has(address)) {
      throw new Error('User already exists');
    }

    const profile = this.initializeUserProfile(address);
    this.users.set(address, profile);

    // Send welcome notification
    await this.notificationService.notifyAchievementUnlocked(
      address,
      'Welcome Bonus',
      '100 XP'
    );

    return profile;
  }

  // Get user profile
  async getUserProfile(address: string): Promise<UserProfile | null> {
    return this.users.get(address) || null;
  }

  // Update user profile
  async updateProfile(
    address: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const profile = await this.getUserProfile(address);
    if (!profile) {
      throw new Error('User not found');
    }

    const updatedProfile = { ...profile, ...updates };
    this.users.set(address, updatedProfile);

    return updatedProfile;
  }

  // Update user settings
  async updateSettings(
    address: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const profile = await this.getUserProfile(address);
    if (!profile) {
      throw new Error('User not found');
    }

    const updatedSettings = { ...profile.settings, ...settings };
    profile.settings = updatedSettings;
    this.users.set(address, profile);

    return updatedSettings;
  }

  // Update user stats
  async updateStats(
    address: string,
    stats: Partial<UserStats>
  ): Promise<UserStats> {
    const profile = await this.getUserProfile(address);
    if (!profile) {
      throw new Error('User not found');
    }

    const updatedStats = { ...profile.stats, ...stats };
    
    // Calculate win rate
    if (stats.wins !== undefined || stats.losses !== undefined || stats.draws !== undefined) {
      const totalGames = updatedStats.wins + updatedStats.losses + updatedStats.draws;
      updatedStats.winRate = totalGames > 0 
        ? (updatedStats.wins / totalGames) * 100 
        : 0;
    }

    // Update level based on experience
    if (stats.experience !== undefined) {
      const newLevel = Math.floor(updatedStats.experience / 1000) + 1;
      if (newLevel > updatedStats.level) {
        updatedStats.level = newLevel;
        await this.notificationService.notifyLevelUp(
          address,
          newLevel,
          [`${newLevel * 100} XP`, 'New Avatar']
        );
      }
    }

    profile.stats = updatedStats;
    this.users.set(address, profile);

    return updatedStats;
  }

  // Create a new session
  async createSession(
    address: string,
    deviceInfo?: { userAgent: string; ip: string }
  ): Promise<UserSession> {
    const profile = await this.getUserProfile(address);
    if (!profile) {
      throw new Error('User not found');
    }

    const session: UserSession = {
      id: uuidv4(),
      address,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastActivity: new Date(),
      deviceInfo
    };

    this.sessions.set(session.token, session);
    profile.lastLogin = new Date();
    this.users.set(address, profile);

    return session;
  }

  // Validate session
  async validateSession(token: string): Promise<UserSession | null> {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    session.lastActivity = new Date();
    return session;
  }

  // End session
  async endSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  // Get all active sessions for a user
  async getUserSessions(address: string): Promise<UserSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.address === address);
  }

  // End all sessions for a user
  async endAllSessions(address: string): Promise<void> {
    Array.from(this.sessions.entries())
      .filter(([_, session]) => session.address === address)
      .forEach(([token]) => this.sessions.delete(token));
  }
} 