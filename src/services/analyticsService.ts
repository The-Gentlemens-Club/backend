import { TournamentService } from './tournamentService';
import { UserService } from './userService';
import { ContractService } from './contractService';

export interface TournamentAnalytics {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalPrizePool: bigint;
  averageEntryFee: bigint;
  playerParticipation: {
    totalPlayers: number;
    uniquePlayers: number;
    averagePlayersPerTournament: number;
  };
  timeDistribution: {
    upcoming: number;
    active: number;
    completed: number;
  };
  revenueMetrics: {
    totalRevenue: bigint;
    averageRevenuePerTournament: bigint;
    platformFee: bigint;
  };
}

export interface PlayerAnalytics {
  totalGames: number;
  winRate: number;
  totalWinnings: bigint;
  averageBet: bigint;
  tournamentParticipation: {
    total: number;
    won: number;
    averageRank: number;
  };
  activityTrend: {
    dailyGames: number;
    weeklyGames: number;
    monthlyGames: number;
  };
}

export class AnalyticsService {
  constructor(
    private tournamentService: TournamentService,
    private userService: UserService,
    private contractService: ContractService
  ) {}

  async getTournamentAnalytics(): Promise<TournamentAnalytics> {
    const tournaments = await this.tournamentService.getTournaments();
    
    const totalTournaments = tournaments.length;
    const activeTournaments = tournaments.filter(t => t.status === 'active').length;
    const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
    
    const totalPrizePool = tournaments.reduce((sum, t) => 
      sum + BigInt(t.prizePool || '0'), BigInt(0));
    
    const averageEntryFee = totalTournaments > 0 
      ? totalPrizePool / BigInt(totalTournaments) 
      : BigInt(0);

    const allPlayers = tournaments.flatMap(t => t.players);
    const uniquePlayers = new Set(allPlayers).size;

    return {
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalPrizePool,
      averageEntryFee,
      playerParticipation: {
        totalPlayers: allPlayers.length,
        uniquePlayers,
        averagePlayersPerTournament: totalTournaments > 0 
          ? allPlayers.length / totalTournaments 
          : 0
      },
      timeDistribution: {
        upcoming: tournaments.filter(t => t.status === 'upcoming').length,
        active: activeTournaments,
        completed: completedTournaments
      },
      revenueMetrics: {
        totalRevenue: totalPrizePool,
        averageRevenuePerTournament: averageEntryFee,
        platformFee: totalPrizePool / BigInt(20) // 5% platform fee
      }
    };
  }

  async getPlayerAnalytics(address: string): Promise<PlayerAnalytics> {
    const profile = await this.userService.getUserProfile(address);
    if (!profile) {
      throw new Error('Player not found');
    }

    const gameHistory = await this.contractService.getGameHistory(address);
    const tournaments = await this.tournamentService.getTournaments();
    const playerTournaments = tournaments.filter(t => t.players.includes(address));

    const totalGames = gameHistory.length;
    const wins = profile.stats.wins;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    const totalWinnings = BigInt(profile.stats.totalWinnings || '0');
    const averageBet = totalGames > 0 
      ? BigInt(profile.stats.totalBetAmount || '0') / BigInt(totalGames) 
      : BigInt(0);

    return {
      totalGames,
      winRate,
      totalWinnings,
      averageBet,
      tournamentParticipation: {
        total: playerTournaments.length,
        won: playerTournaments.filter(t => 
          t.status === 'completed' && t.players[0] === address).length,
        averageRank: this.calculateAverageRank(playerTournaments, address)
      },
      activityTrend: {
        dailyGames: this.calculateRecentGames(gameHistory, 1),
        weeklyGames: this.calculateRecentGames(gameHistory, 7),
        monthlyGames: this.calculateRecentGames(gameHistory, 30)
      }
    };
  }

  private calculateAverageRank(tournaments: any[], address: string): number {
    const completedTournaments = tournaments.filter(t => t.status === 'completed');
    if (completedTournaments.length === 0) return 0;

    const totalRank = completedTournaments.reduce((sum, t) => {
      const playerIndex = t.players.indexOf(address);
      return sum + (playerIndex + 1);
    }, 0);

    return totalRank / completedTournaments.length;
  }

  private calculateRecentGames(gameHistory: bigint[], days: number): number {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return gameHistory.filter(gameId => {
      // Assuming gameId contains timestamp information
      const gameTime = Number(gameId) * 1000;
      return gameTime >= cutoff;
    }).length;
  }
} 