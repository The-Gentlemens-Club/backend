import { UserService } from './userService';
import { ContractService } from './contractService';
import { NotificationService } from './notificationService';

export type AchievementType = 
  | 'first_win'
  | 'tournament_victory'
  | 'streak_master'
  | 'high_roller'
  | 'loyal_player'
  | 'quick_learner'
  | 'risk_taker'
  | 'strategist';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  criteria: {
    metric: string;
    threshold: number | bigint;
  };
  reward: {
    points: number;
    badge?: string;
    title?: string;
  };
  unlockedAt?: Date;
}

export class AchievementService {
  private achievements: Map<string, Achievement[]> = new Map();

  constructor(
    private userService: UserService,
    private contractService: ContractService,
    private notificationService: NotificationService
  ) {}

  async checkAchievements(address: string): Promise<Achievement[]> {
    const profile = await this.userService.getUserProfile(address);
    if (!profile) {
      throw new Error('Player not found');
    }

    const gameHistory = await this.contractService.getGameHistory(address);
    const newAchievements: Achievement[] = [];

    // Check each achievement type
    const achievements = this.getPlayerAchievements(address);
    
    for (const achievement of achievements) {
      if (achievement.unlockedAt) continue;

      if (await this.checkAchievementCriteria(achievement, profile, gameHistory)) {
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
        
        // Award achievement rewards
        await this.awardAchievementRewards(address, achievement);
      }
    }

    return newAchievements;
  }

  private async checkAchievementCriteria(
    achievement: Achievement,
    profile: any,
    gameHistory: bigint[]
  ): Promise<boolean> {
    switch (achievement.type) {
      case 'first_win':
        return profile.stats.wins > 0;
      
      case 'tournament_victory':
        return profile.stats.tournamentWins > 0;
      
      case 'streak_master':
        return this.calculateWinStreak(gameHistory) >= 5;
      
      case 'high_roller':
        return BigInt(profile.stats.totalBetAmount || '0') >= BigInt(achievement.criteria.threshold);
      
      case 'loyal_player':
        return profile.stats.totalGames >= Number(achievement.criteria.threshold);
      
      case 'quick_learner':
        return this.calculateWinRate(gameHistory) >= Number(achievement.criteria.threshold);
      
      case 'risk_taker':
        return this.calculateRiskFactor(profile) >= Number(achievement.criteria.threshold);
      
      case 'strategist':
        return this.calculateStrategyScore(gameHistory) >= Number(achievement.criteria.threshold);
      
      default:
        return false;
    }
  }

  private async awardAchievementRewards(address: string, achievement: Achievement): Promise<void> {
    const { points, badge, title } = achievement.reward;
    
    // Update player stats
    await this.userService.updateStats(address, {
      achievementPoints: points,
      ...(badge && { badges: [badge] }),
      ...(title && { title })
    });
  }

  private calculateWinStreak(gameHistory: bigint[]): number {
    let currentStreak = 0;
    let maxStreak = 0;

    for (const gameId of gameHistory) {
      const outcome = this.contractService.getGameOutcome(gameId);
      if (outcome === 'win') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  private calculateWinRate(gameHistory: bigint[]): number {
    if (gameHistory.length === 0) return 0;
    
    const wins = gameHistory.filter(gameId => 
      this.contractService.getGameOutcome(gameId) === 'win'
    ).length;

    return (wins / gameHistory.length) * 100;
  }

  private calculateRiskFactor(profile: any): number {
    const totalBet = BigInt(profile.stats.totalBetAmount || '0');
    const totalGames = profile.stats.totalGames || 1;
    return Number(totalBet) / totalGames;
  }

  private calculateStrategyScore(gameHistory: bigint[]): number {
    // Implement strategy scoring logic based on game patterns
    return 0;
  }

  private getPlayerAchievements(address: string): Achievement[] {
    if (!this.achievements.has(address)) {
      this.achievements.set(address, this.initializeAchievements());
    }
    return this.achievements.get(address)!;
  }

  private initializeAchievements(): Achievement[] {
    return [
      {
        id: 'first_win',
        type: 'first_win',
        name: 'First Victory',
        description: 'Win your first game',
        criteria: { metric: 'wins', threshold: 1 },
        reward: { points: 100, badge: 'first_win' }
      },
      {
        id: 'tournament_victory',
        type: 'tournament_victory',
        name: 'Tournament Champion',
        description: 'Win a tournament',
        criteria: { metric: 'tournamentWins', threshold: 1 },
        reward: { points: 500, badge: 'champion', title: 'Champion' }
      },
      {
        id: 'streak_master',
        type: 'streak_master',
        name: 'Streak Master',
        description: 'Achieve a 5-game winning streak',
        criteria: { metric: 'winStreak', threshold: 5 },
        reward: { points: 300, badge: 'streak_master' }
      },
      {
        id: 'high_roller',
        type: 'high_roller',
        name: 'High Roller',
        description: 'Place bets totaling 1 ETH',
        criteria: { metric: 'totalBetAmount', threshold: BigInt(1e18) },
        reward: { points: 200, badge: 'high_roller', title: 'High Roller' }
      },
      {
        id: 'loyal_player',
        type: 'loyal_player',
        name: 'Loyal Player',
        description: 'Play 100 games',
        criteria: { metric: 'totalGames', threshold: 100 },
        reward: { points: 400, badge: 'loyal_player' }
      }
    ];
  }

  private async checkWinStreakAchievements(address: string, stats: PlayerStats): Promise<void> {
    const achievements = this.achievements.filter(a => a.type === 'win_streak');
    
    for (const achievement of achievements) {
      if (stats.currentStreak >= achievement.criteria.streak && !stats.achievements.includes(achievement.id)) {
        await this.awardAchievement(address, achievement);
      }
    }
  }

  private async checkHighRollerAchievements(address: string, stats: PlayerStats): Promise<void> {
    const achievements = this.achievements.filter(a => a.type === 'high_roller');
    
    for (const achievement of achievements) {
      if (stats.highestWin >= achievement.criteria.amount && !stats.achievements.includes(achievement.id)) {
        await this.awardAchievement(address, achievement);
      }
    }
  }

  private async awardAchievement(address: string, achievement: Achievement): Promise<void> {
    const profile = await this.userService.getUserProfile(address);
    if (!profile) return;

    profile.stats.achievements.push(achievement.id);
    const points = this.calculateAchievementPoints(achievement);
    
    await this.userService.updateStats(address, {
      achievements: profile.stats.achievements,
      experience: profile.stats.experience + points
    });

    await this.notificationService.notifyAchievementUnlocked(address, achievement);
  }
} 