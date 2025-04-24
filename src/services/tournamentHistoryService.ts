import { ContractService } from './contractService';
import { Tournament, TournamentStatus, TournamentStats } from '../types/tournament';
import { PlayerStats } from '../types/game';
import { NotificationService } from './notificationService';
import { UserService } from './userService';
import { config } from '../config';

export interface TournamentHistory {
  tournamentId: string;
  name: string;
  startTime: Date;
  endTime: Date | null;
  entryFee: bigint;
  prizePool: bigint;
  players: string[];
  winners: { address: string; prize: bigint; rank: number }[];
  stats: TournamentStats;
}

export class TournamentHistoryService {
  private contractService: ContractService;
  private tournamentHistory: Map<string, TournamentHistory> = new Map();
  private playerHistory: Map<string, string[]> = new Map();

  constructor() {
    const notificationService = new NotificationService();
    const userService = new UserService(notificationService);
    this.contractService = new ContractService(
      config.rpcUrl,
      config.tournamentContractAddress,
      config.gameContractAddress,
      userService,
      notificationService,
      config.jwtSecret
    );
  }

  async recordTournament(tournamentId: string): Promise<void> {
    try {
      const tournament = await this.contractService.getTournament(BigInt(tournamentId));
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const players = await this.contractService.getRegisteredPlayers(BigInt(tournamentId));
      const winners = await this.contractService.getTournamentWinners(BigInt(tournamentId));

      const playerStats = await Promise.all(
        players.map(async (address) => {
          const stats = await this.contractService.getPlayerStats(address);
          return {
            address,
            gamesPlayed: stats.totalGames,
            wins: stats.wins,
            losses: stats.losses,
            totalBet: stats.totalBetAmount,
            totalWon: stats.totalWinAmount
          };
        })
      );

      const history: TournamentHistory = {
        tournamentId,
        name: tournament.name,
        startTime: tournament.startTime,
        endTime: tournament.endTime,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        players: players,
        winners: winners,
        stats: {
          totalPlayers: BigInt(players.length),
          activePlayers: BigInt(players.length),
          totalPrizePool: tournament.prizePool,
          averageEntryFee: tournament.entryFee,
          completedGames: BigInt(0),
          activeGames: BigInt(players.length)
        }
      };

      this.tournamentHistory.set(tournamentId, history);

      // Update player history
      players.forEach(playerAddress => {
        const playerTournaments = this.playerHistory.get(playerAddress) || [];
        if (!playerTournaments.includes(tournamentId)) {
          playerTournaments.push(tournamentId);
          this.playerHistory.set(playerAddress, playerTournaments);
        }
      });
    } catch (error) {
      console.error('Error recording tournament history:', error);
      throw error;
    }
  }

  public async addTournamentHistory(tournament: Tournament): Promise<void> {
    const history: TournamentHistory = {
      tournamentId: tournament.id,
      name: tournament.name,
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      players: tournament.players,
      winners: tournament.winners || [],
      stats: {
        totalPlayers: BigInt(tournament.players.length),
        activePlayers: BigInt(tournament.players.length),
        totalPrizePool: tournament.prizePool,
        averageEntryFee: tournament.entryFee,
        completedGames: BigInt(0),
        activeGames: BigInt(tournament.players.length)
      }
    };

    this.tournamentHistory.set(tournament.id, history);

    // Update player history
    tournament.players.forEach(playerAddress => {
      const playerTournaments = this.playerHistory.get(playerAddress) || [];
      if (!playerTournaments.includes(tournament.id)) {
        playerTournaments.push(tournament.id);
        this.playerHistory.set(playerAddress, playerTournaments);
      }
    });
  }

  public async getPlayerHistory(playerAddress: string): Promise<TournamentHistory[]> {
    const tournamentIds = this.playerHistory.get(playerAddress) || [];
    return tournamentIds
      .map(id => this.tournamentHistory.get(id))
      .filter((t): t is TournamentHistory => t !== undefined)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  public async getPlayerStats(playerAddress: string): Promise<PlayerStats> {
    const history = await this.getPlayerHistory(playerAddress);
    const stats: PlayerStats = {
      address: playerAddress,
      totalGames: history.length,
      wins: history.filter(t => t.winners.some(w => w.address === playerAddress)).length,
      losses: 0,
      draws: 0,
      totalBetAmount: history.reduce((sum, t) => sum + t.entryFee, 0n),
      totalWinAmount: history.reduce((sum, t) => {
        const winner = t.winners.find(w => w.address === playerAddress);
        return winner ? sum + winner.prize : sum;
      }, 0n),
      winRate: history.length > 0 
        ? history.filter(t => t.winners.some(w => w.address === playerAddress)).length / history.length
        : 0,
      highestWin: history.reduce((max, t) => {
        const winner = t.winners.find(w => w.address === playerAddress);
        return winner && winner.prize > max ? winner.prize : max;
      }, 0n),
      currentStreak: 0,
      bestStreak: 0,
      lastGamePlayed: history.length > 0 ? history[0].startTime : new Date(),
      level: 1,
      experience: 0,
      rank: 'Novice'
    };
    return stats;
  }

  public async getTournamentStats(): Promise<TournamentStats> {
    const tournaments = Array.from(this.tournamentHistory.values());
    const stats: TournamentStats = {
      totalPlayers: BigInt(new Set(tournaments.flatMap(t => t.players)).size),
      activePlayers: BigInt(new Set(tournaments.filter(t => !t.endTime).flatMap(t => t.players)).size),
      totalPrizePool: tournaments.reduce((sum, t) => sum + t.prizePool, 0n),
      averageEntryFee: tournaments.length > 0
        ? tournaments.reduce((sum, t) => sum + t.entryFee, 0n) / BigInt(tournaments.length)
        : 0n,
      completedGames: BigInt(tournaments.filter(t => t.endTime).length),
      activeGames: BigInt(tournaments.filter(t => !t.endTime).length)
    };
    return stats;
  }

  public async getTournamentHistory(tournamentId: string): Promise<TournamentHistory | null> {
    return this.tournamentHistory.get(tournamentId) || null;
  }

  public async getAllTournaments(
    options: {
      limit?: number;
      offset?: number;
      active?: boolean;
      completed?: boolean;
    } = {}
  ): Promise<{ tournaments: TournamentHistory[]; total: number }> {
    const {
      limit = 10,
      offset = 0,
      active = false,
      completed = false
    } = options;

    let tournaments = Array.from(this.tournamentHistory.values());

    if (active) {
      tournaments = tournaments.filter(t => !t.endTime);
    }

    if (completed) {
      tournaments = tournaments.filter(t => t.endTime);
    }

    tournaments.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return {
      tournaments: tournaments.slice(offset, offset + limit),
      total: tournaments.length
    };
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
    const histories = Array.from(this.tournamentHistory.values());
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
        histories.flatMap(h => h.players)
      ).size,
      totalPrizePool: histories.reduce((sum, h) => sum + h.prizePool, BigInt(0)),
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
    const histories = Array.from(this.tournamentHistory.values())
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