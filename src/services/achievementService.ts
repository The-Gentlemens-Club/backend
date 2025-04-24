import { UserService } from './userService';
import { ContractService } from './contractService';
import { NotificationService } from './notificationService';
import { PlayerStats } from '../types/game';
import { UserStats } from '../types/user';

export type AchievementType = 
  | 'first_win'
  | 'win_streak'
  | 'high_roller'
  | 'tournament_winner'
  | 'veteran'
  | 'whale';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  criteria: {
    streak?: number;
    amount?: bigint;
    wins?: number;
    tournaments?: number;
  };
  reward: {
    points: number;
    bonus?: string;
  };
}

export class AchievementService {
  private achievements: Achievement[] = [];

  constructor(
    private userService: UserService,
    private contractService: ContractService,
    private notificationService: NotificationService
  ) {
    this.initializeAchievements();
  }

  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'first_win',
        type: 'first_win',
        name: 'First Victory',
        description: 'Win your first game',
        criteria: { wins: 1 },
        reward: { points: 100 }
      },
      {
        id: 'win_streak_5',
        type: 'win_streak',
        name: 'Hot Streak',
        description: 'Win 5 games in a row',
        criteria: { streak: 5 },
        reward: { points: 250 }
      },
      {
        id: 'high_roller',
        type: 'high_roller',
        name: 'High Roller',
        description: 'Place a bet of 1 ETH or more',
        criteria: { amount: BigInt('1000000000000000000') },
        reward: { points: 500 }
      }
    ];
  }

  public async getPlayerAchievements(address: string): Promise<Achievement[]> {
    const stats = await this.userService.getUserStats(address);
    if (!stats) return [];

    return this.achievements.filter(achievement => 
      this.hasUnlockedAchievement(stats, achievement)
    );
  }

  public async checkAchievements(address: string): Promise<void> {
    const stats = await this.userService.getUserStats(address);
    if (!stats) return;

    const unlockedAchievements = await this.getPlayerAchievements(address);
    const newAchievements = this.achievements.filter(achievement => 
      !unlockedAchievements.some(a => a.id === achievement.id) &&
      this.hasUnlockedAchievement(stats, achievement)
    );

    for (const achievement of newAchievements) {
      await this.awardAchievement(address, achievement);
    }
  }

  private async hasUnlockedAchievement(stats: UserStats, achievement: Achievement): Promise<boolean> {
    switch (achievement.type) {
      case 'first_win':
        return stats.wins > 0;
      case 'win_streak':
        return stats.bestStreak >= (achievement.criteria.streak || 0);
      case 'high_roller':
        return stats.highestWin >= (achievement.criteria.amount || BigInt(0));
      default:
        return false;
    }
  }

  private async awardAchievement(address: string, achievement: Achievement): Promise<void> {
    const stats = await this.userService.getUserStats(address);
    if (!stats) return;

    await this.userService.updateStats(address, {
      experience: stats.experience + achievement.reward.points
    });

    await this.notificationService.notifyAchievementUnlocked(
      address,
      achievement,
      achievement.reward.bonus || `${achievement.reward.points} XP`
    );
  }

  public async getLeaderboard(): Promise<{ address: string; achievements: number; points: number }[]> {
    const users = await this.userService.getAllUsers();
    const leaderboard = await Promise.all(
      users.map(async user => {
        const achievements = await this.getPlayerAchievements(user.address);
        const points = achievements.reduce((total, a) => total + a.reward.points, 0);
        return {
          address: user.address,
          achievements: achievements.length,
          points
        };
      })
    );

    return leaderboard.sort((a, b) => b.points - a.points);
  }
} 