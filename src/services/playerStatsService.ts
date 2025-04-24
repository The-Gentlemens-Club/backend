import { ContractService } from './contracts';
import { TournamentHistoryService } from './tournamentHistoryService';

export type PlayerStats = {
  address: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalBetAmount: bigint;
  totalWonAmount: bigint;
  averageBet: bigint;
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentWinRate: number;
  totalTournamentPrize: bigint;
  achievements: Achievement[];
  rank: number;
  streak: {
    current: number;
    best: number;
    type: 'win' | 'loss';
  };
};

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
  private contractService: ContractService;
  private historyService: TournamentHistoryService;
  private achievements: Map<string, Achievement[]> = new Map();

  constructor() {
    this.contractService = new ContractService();
    this.historyService = new TournamentHistoryService();
  }

  async getPlayerStats(address: string): Promise<PlayerStats> {
    try {
      const basicStats = await this.contractService.getPlayerStats(address);
      const tournamentHistory = await this.historyService.getPlayerTournamentHistory(address);
      
      const tournamentsWon = tournamentHistory.filter(h => 
        h.winners.some(w => w.address === address)
      ).length;

      const totalTournamentPrize = tournamentHistory.reduce((sum, h) => {
        const winner = h.winners.find(w => w.address === address);
        return sum + (winner?.prize || BigInt(0));
      }, BigInt(0));

      const achievements = await this.getPlayerAchievements(address);
      const streak = await this.calculatePlayerStreak(address);

      return {
        address,
        totalGames: basicStats.totalGames,
        wins: basicStats.wins,
        losses: basicStats.losses,
        draws: basicStats.draws,
        winRate: basicStats.winRate,
        totalBetAmount: basicStats.totalBetAmount,
        totalWonAmount: basicStats.totalWonAmount,
        averageBet: basicStats.averageBet,
        tournamentsPlayed: tournamentHistory.length,
        tournamentsWon,
        tournamentWinRate: tournamentHistory.length > 0 ? tournamentsWon / tournamentHistory.length : 0,
        totalTournamentPrize,
        achievements,
        rank: await this.calculatePlayerRank(address),
        streak
      };
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }

  private async calculatePlayerStreak(address: string): Promise<PlayerStats['streak']> {
    const games = await this.contractService.getPlayerGameHistory(address);
    let currentStreak = 0;
    let bestStreak = 0;
    let currentType: 'win' | 'loss' = 'win';
    let lastOutcome = games[0]?.outcome;

    for (const game of games) {
      if (game.outcome === lastOutcome) {
        currentStreak++;
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
          currentType = game.outcome === 'win' ? 'win' : 'loss';
        }
      } else {
        currentStreak = 1;
        lastOutcome = game.outcome;
      }
    }

    return {
      current: currentStreak,
      best: bestStreak,
      type: currentType
    };
  }

  private async calculatePlayerRank(address: string): Promise<number> {
    const allPlayers = await this.contractService.getAllPlayers();
    const playerStats = await Promise.all(
      allPlayers.map(async (player) => {
        const stats = await this.getPlayerStats(player);
        return {
          address: player,
          winRate: stats.winRate,
          totalWon: stats.totalWonAmount
        };
      })
    );

    playerStats.sort((a, b) => {
      if (a.winRate !== b.winRate) {
        return b.winRate - a.winRate;
      }
      return Number(b.totalWon - a.totalWon);
    });

    return playerStats.findIndex(p => p.address === address) + 1;
  }

  async getPlayerAchievements(address: string): Promise<Achievement[]> {
    const stats = await this.getPlayerStats(address);
    const achievements: Achievement[] = [];

    // Win Streak Achievement
    achievements.push({
      id: 'win_streak',
      name: 'Hot Streak',
      description: `Win ${stats.streak.best} games in a row`,
      unlockedAt: new Date(),
      progress: stats.streak.best,
      maxProgress: 10,
      isUnlocked: stats.streak.best >= 10
    });

    // Tournament Winner Achievement
    achievements.push({
      id: 'tournament_winner',
      name: 'Tournament Champion',
      description: 'Win a tournament',
      unlockedAt: new Date(),
      progress: stats.tournamentsWon,
      maxProgress: 1,
      isUnlocked: stats.tournamentsWon > 0
    });

    // High Roller Achievement
    achievements.push({
      id: 'high_roller',
      name: 'High Roller',
      description: 'Place a bet of 1 ETH or more',
      unlockedAt: new Date(),
      progress: Number(stats.averageBet),
      maxProgress: Number(BigInt(1e18)), // 1 ETH
      isUnlocked: stats.averageBet >= BigInt(1e18)
    });

    // Tournament Regular Achievement
    achievements.push({
      id: 'tournament_regular',
      name: 'Tournament Regular',
      description: 'Participate in 10 tournaments',
      unlockedAt: new Date(),
      progress: stats.tournamentsPlayed,
      maxProgress: 10,
      isUnlocked: stats.tournamentsPlayed >= 10
    });

    return achievements;
  }

  async getLeaderboard(limit: number = 100): Promise<{
    address: string;
    rank: number;
    winRate: number;
    totalWon: bigint;
    tournamentsWon: number;
  }[]> {
    const allPlayers = await this.contractService.getAllPlayers();
    const playerStats = await Promise.all(
      allPlayers.map(async (player) => {
        const stats = await this.getPlayerStats(player);
        return {
          address: player,
          rank: stats.rank,
          winRate: stats.winRate,
          totalWon: stats.totalWonAmount,
          tournamentsWon: stats.tournamentsWon
        };
      })
    );

    return playerStats
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
    
    // Tournament experience
    experience += stats.tournamentsPlayed * 50;
    experience += stats.tournamentsWon * 100;
    
    // Streak bonus
    experience += stats.streak.best * 5;
    
    // Achievement bonus
    const achievements = stats.achievements.filter(a => a.isUnlocked);
    experience += achievements.length * 25;

    return experience;
  }
} 