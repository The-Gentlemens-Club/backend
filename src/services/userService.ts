import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { UserProfile, UserSettings, UserStats, UserSession, NotificationType } from '../types/user';
import { NotificationService } from './notificationService';

export class UserService {
  private users: Map<string, UserProfile> = new Map();
  private sessions: Map<string, UserSession> = new Map();

  constructor(private notificationService: NotificationService) {}

  public async getUserProfile(address: string): Promise<UserProfile | undefined> {
    return this.users.get(address);
  }

  public async getUserStats(address: string): Promise<UserStats | undefined> {
    const profile = await this.getUserProfile(address);
    return profile?.stats;
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    return Array.from(this.users.values());
  }

  public async createProfile(address: string): Promise<UserProfile> {
    const profile = this.initializeUserProfile(address);
    this.users.set(address, profile);
    return profile;
  }

  public async updateStats(address: string, update: Partial<UserStats>): Promise<void> {
    const profile = await this.getUserProfile(address);
    if (!profile) return;

    const oldLevel = profile.stats.level;
    profile.stats = { ...profile.stats, ...update };

    // Check for level up
    const newLevel = this.calculateLevel(profile.stats.experience);
    if (newLevel > oldLevel) {
      profile.stats.level = newLevel;
      await this.notificationService.notifyLevelUp(
        address,
        newLevel,
        this.getLevelRewards(newLevel)
      );
    }

    this.users.set(address, profile);
  }

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

  private calculateLevel(experience: number): number {
    // Simple level calculation: each level requires 1000 XP
    return Math.floor(experience / 1000) + 1;
  }

  private getLevelRewards(level: number): string[] {
    const rewards: string[] = [];
    
    // Basic rewards for each level
    rewards.push(`${level * 100} Bonus Points`);
    
    // Special rewards at milestone levels
    if (level % 5 === 0) {
      rewards.push('Special Avatar Frame');
    }
    if (level % 10 === 0) {
      rewards.push('Exclusive Title');
    }
    if (level % 25 === 0) {
      rewards.push('Rare Collectible');
    }

    return rewards;
  }

  public async createSession(address: string, deviceInfo?: { userAgent: string; ip: string }): Promise<UserSession> {
    const session: UserSession = {
      id: crypto.randomUUID(),
      address,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastActivity: new Date(),
      deviceInfo
    };

    this.sessions.set(session.token, session);
    return session;
  }

  public async validateSession(token: string): Promise<UserSession | undefined> {
    const session = this.sessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      return undefined;
    }
    return session;
  }

  public async updateSession(token: string): Promise<void> {
    const session = this.sessions.get(token);
    if (session) {
      session.lastActivity = new Date();
      this.sessions.set(token, session);
    }
  }

  public async endSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  public async endAllSessions(address: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.address === address) {
        this.sessions.delete(token);
      }
    }
  }
} 