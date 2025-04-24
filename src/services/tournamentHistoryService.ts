import { ContractService } from './contracts';
import { Tournament } from '../types/tournament';

export type TournamentHistory = {
  tournamentId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  totalPlayers: number;
  prizePool: bigint;
  winners: {
    address: string;
    rank: number;
    prize: bigint;
  }[];
  playerStats: {
    address: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    totalBet: bigint;
    totalWon: bigint;
  }[];
};

export class TournamentHistoryService {
  private contractService: ContractService;
  private history: Map<string, TournamentHistory> = new Map();

  constructor() {
    this.contractService = new ContractService();
  }

  async recordTournament(tournamentId: string): Promise<void> {
    try {
      const tournament = await this.contractService.getTournamentInfo(Number(tournamentId));
      const players = await this.contractService.getRegisteredPlayers(Number(tournamentId));
      const winners = await this.contractService.getTournamentWinners(Number(tournamentId));

      const playerStats = await Promise.all(
        players.map(async (address) => {
          const stats = await this.contractService.getPlayerStats(address);
          return {
            address,
            gamesPlayed: stats.totalGames,
            wins: stats.wins,
            losses: stats.losses,
            totalBet: stats.totalBetAmount,
            totalWon: stats.totalWonAmount
          };
        })
      );

      const history: TournamentHistory = {
        tournamentId,
        name: tournament.name,
        startTime: tournament.startTime,
        endTime: tournament.endTime,
        totalPlayers: players.length,
        prizePool: tournament.prizePool,
        winners: winners.map((winner, index) => ({
          address: winner.address,
          rank: index + 1,
          prize: winner.amount
        })),
        playerStats
      };

      this.history.set(tournamentId, history);
    } catch (error) {
      console.error('Error recording tournament history:', error);
      throw error;
    }
  }

  async getTournamentHistory(tournamentId: string): Promise<TournamentHistory | undefined> {
    return this.history.get(tournamentId);
  }

  async getPlayerTournamentHistory(
    address: string,
    limit: number = 10
  ): Promise<TournamentHistory[]> {
    const histories = Array.from(this.history.values());
    return histories
      .filter(history => 
        history.playerStats.some(stat => stat.address === address) ||
        history.winners.some(winner => winner.address === address)
      )
      .slice(0, limit);
  }

  async getTournamentStatistics(): Promise<{
    totalTournaments: number;
    totalPlayers: number;
    totalPrizePool: bigint;
    averagePlayersPerTournament: number;
    mostSuccessfulPlayers: {
      address: string;
      tournamentsWon: number;
      totalPrize: bigint;
    }[];
  }> {
    const histories = Array.from(this.history.values());
    const playerStats = new Map<string, { tournamentsWon: number; totalPrize: bigint }>();

    histories.forEach(history => {
      history.winners.forEach(winner => {
        const stats = playerStats.get(winner.address) || { tournamentsWon: 0, totalPrize: BigInt(0) };
        stats.tournamentsWon++;
        stats.totalPrize += winner.prize;
        playerStats.set(winner.address, stats);
      });
    });

    const mostSuccessfulPlayers = Array.from(playerStats.entries())
      .map(([address, stats]) => ({
        address,
        tournamentsWon: stats.tournamentsWon,
        totalPrize: stats.totalPrize
      }))
      .sort((a, b) => Number(b.totalPrize - a.totalPrize))
      .slice(0, 10);

    return {
      totalTournaments: histories.length,
      totalPlayers: new Set(
        histories.flatMap(h => h.playerStats.map(p => p.address))
      ).size,
      totalPrizePool: histories.reduce((sum, h) => sum + h.prizePool, BigInt(0)),
      averagePlayersPerTournament: histories.reduce((sum, h) => sum + h.totalPlayers, 0) / histories.length,
      mostSuccessfulPlayers
    };
  }

  async getTournamentTrends(
    startDate: Date,
    endDate: Date
  ): Promise<{
    dailyTournaments: { date: string; count: number }[];
    dailyPlayers: { date: string; count: number }[];
    dailyPrizePool: { date: string; amount: bigint }[];
  }> {
    const histories = Array.from(this.history.values())
      .filter(h => h.startTime >= startDate && h.startTime <= endDate);

    const dailyStats = new Map<string, {
      tournaments: number;
      players: number;
      prizePool: bigint;
    }>();

    histories.forEach(history => {
      const date = history.startTime.toISOString().split('T')[0];
      const stats = dailyStats.get(date) || {
        tournaments: 0,
        players: 0,
        prizePool: BigInt(0)
      };

      stats.tournaments++;
      stats.players += history.totalPlayers;
      stats.prizePool += history.prizePool;
      dailyStats.set(date, stats);
    });

    const dates = Array.from(dailyStats.keys()).sort();
    
    return {
      dailyTournaments: dates.map(date => ({
        date,
        count: dailyStats.get(date)!.tournaments
      })),
      dailyPlayers: dates.map(date => ({
        date,
        count: dailyStats.get(date)!.players
      })),
      dailyPrizePool: dates.map(date => ({
        date,
        amount: dailyStats.get(date)!.prizePool
      }))
    };
  }
} 