import { PlayerStats } from '../types/game';
import { ContractService } from './contractService';
import { TournamentHistoryService } from './tournamentHistoryService';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
};

export class PlayerStatsService {
  private stats: Map<string, PlayerStats> = new Map();
  private contractService: ContractService;
  private historyService: TournamentHistoryService;
  private achievements: Map<string, Achievement[]> = new Map();

  constructor(contractService: ContractService) {
    this.contractService = contractService;
    this.historyService = new TournamentHistoryService();
  }

  public async getPlayerStats(address: string): Promise<PlayerStats> {
    if (!this.stats.has(address)) {
      await this.initializePlayerStats(address);
    }
    return this.stats.get(address)!;
  }

  private async initializePlayerStats(address: string): Promise<void> {
    const stats = await this.contractService.getPlayerStats(address);
    this.stats.set(address, stats);
  }

  public async updateStats(address: string, update: Partial<PlayerStats>): Promise<void> {
    const currentStats = await this.getPlayerStats(address);
    this.stats.set(address, { ...currentStats, ...update });
  }

  public async getLeaderboard(limit: number = 100): Promise<{
    address: string;
    rank: number;
    winRate: number;
    totalWon: bigint;
    tournamentsWon: number;
  }[]> {
    const stats = Array.from(this.stats.values());
    const leaderboard = stats.map(stat => ({
      address: stat.address,
      rank: this.calculateRank(stat),
      winRate: stat.winRate,
      totalWon: stat.totalWinAmount,
      tournamentsWon: stat.tournamentsWon || 0
    }));

    return leaderboard
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        if (a.winRate !== b.winRate) {
          return b.winRate - a.winRate;
        }
        return Number(b.totalWon - a.totalWon);
      })
      .slice(0, limit);
  }

  private calculateRank(stats: PlayerStats): number {
    // Simple rank calculation based on win rate and total games
    const baseRank = Math.floor(stats.winRate * 100);
    const gamesBonus = Math.min(stats.totalGames / 10, 10);
    return baseRank + gamesBonus;
  }

  async getPlayerAchievements(address: string): Promise<Achievement[]> {
    const stats = await this.getPlayerStats(address);
    const achievements: Achievement[] = [];

    // Win Streak Achievement
    achievements.push({
      id: 'win_streak',
      name: 'Hot Streak',
      description: `Win ${stats.bestStreak} games in a row`,
      unlockedAt: new Date(),
      progress: stats.bestStreak,
      maxProgress: 10,
      isUnlocked: stats.bestStreak >= 10
    });

    // High Roller Achievement
    achievements.push({
      id: 'high_roller',
      name: 'High Roller',
      description: 'Place a bet of 1 ETH or more',
      unlockedAt: new Date(),
      progress: Number(stats.highestWin || 0n),
      maxProgress: Number(BigInt(1e18)), // 1 ETH
      isUnlocked: (stats.highestWin || 0n) >= BigInt(1e18)
    });

    return achievements;
  }

  async getPlayerProgress(address: string): Promise<{
    level: number;
    experience: number;
    nextLevelExperience: number;
    achievementsUnlocked: number;
    totalAchievements: number;
  }> {
    const stats = await this.getPlayerStats(address);
    const achievements = await this.getPlayerAchievements(address);

    // Calculate level based on experience points
    const experience = this.calculateExperience(stats);
    const level = Math.floor(Math.sqrt(experience / 100));
    const nextLevelExperience = Math.pow(level + 1, 2) * 100;

    return {
      level,
      experience,
      nextLevelExperience,
      achievementsUnlocked: achievements.filter(a => a.isUnlocked).length,
      totalAchievements: achievements.length
    };
  }

  private calculateExperience(stats: PlayerStats): number {
    let experience = 0;
    
    // Base experience from games
    experience += stats.totalGames * 10;
    
    // Bonus for wins
    experience += stats.wins * 20;
    
    // Streak bonus
    experience += stats.bestStreak * 5;

    return experience;
  }
} 