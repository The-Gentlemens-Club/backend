import { ContractService } from './contracts';
import { Tournament, TournamentStats } from '../types/tournament';
import { PlayerStats } from '../types/game';

interface TournamentHistory {
  tournamentId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  entryFee: string;
  prizePool: string;
  players: string[];
  winners: {
    address: string;
    prize: string;
    rank: number;
  }[];
  stats: {
    totalPlayers: number;
    totalPrizePool: string;
    averageEntryFee: string;
    winRate: number;
  };
}

export class TournamentHistoryService {
  private contractService: ContractService;
  private history: Map<string, TournamentHistory[]> = new Map();

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
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool || '0',
        players: players,
        winners: winners.map((winner, index) => ({
          address: winner.address,
          prize: winner.amount.toString(),
          rank: index + 1
        })),
        stats: {
          totalPlayers: players.length,
          totalPrizePool: tournament.prizePool || '0',
          averageEntryFee: tournament.entryFee,
          winRate: winners.length > 0 ? winners.length / players.length : 0
        }
      };

      for (const player of players) {
        const playerHistory = this.history.get(player) || [];
        playerHistory.push(history);
        this.history.set(player, playerHistory);
      }
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
        history.players.some(p => p === address) ||
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
        stats.totalPrize += BigInt(winner.prize);
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
        histories.flatMap(h => h.players)
      ).size,
      totalPrizePool: histories.reduce((sum, h) => sum + BigInt(h.prizePool), BigInt(0)),
      averagePlayersPerTournament: histories.reduce((sum, h) => sum + h.players.length, 0) / histories.length,
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
      stats.players += history.players.length;
      stats.prizePool += BigInt(history.prizePool);
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

  public async getPlayerHistory(address: string): Promise<TournamentHistory[]> {
    return this.history.get(address) || [];
  }

  public async getPlayerStats(address: string): Promise<{
    totalTournaments: number;
    tournamentsWon: number;
    totalPrize: string;
    winRate: number;
  }> {
    const history = await this.getPlayerHistory(address);
    const tournamentsWon = history.filter(h => 
      h.winners.some(w => w.address === address)
    ).length;

    const totalPrize = history.reduce((sum, h) => {
      const winner = h.winners.find(w => w.address === address);
      return winner ? BigInt(sum) + BigInt(winner.prize) : BigInt(sum);
    }, BigInt(0)).toString();

    return {
      totalTournaments: history.length,
      tournamentsWon,
      totalPrize,
      winRate: history.length > 0 ? tournamentsWon / history.length : 0
    };
  }

  public async getTournamentStats(): Promise<TournamentStats> {
    let totalTournaments = 0;
    let activeTournaments = 0;
    let completedTournaments = 0;
    let totalPrizePool = BigInt(0);
    let totalEntryFees = BigInt(0);
    let totalPlayers = 0;

    this.history.forEach(playerHistory => {
      playerHistory.forEach(tournament => {
        totalTournaments++;
        if (tournament.endTime > new Date()) {
          activeTournaments++;
        } else {
          completedTournaments++;
        }
        totalPrizePool += BigInt(tournament.prizePool);
        totalEntryFees += BigInt(tournament.entryFee) * BigInt(tournament.players.length);
        totalPlayers += tournament.players.length;
      });
    });

    return {
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalPrizePool: totalPrizePool.toString(),
      averageEntryFee: totalTournaments > 0 
        ? (totalEntryFees / BigInt(totalTournaments)).toString()
        : '0',
      playerCount: totalPlayers,
      averagePlayerCount: totalTournaments > 0 ? totalPlayers / totalTournaments : 0
    };
  }
} 