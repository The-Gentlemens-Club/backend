import { ContractService } from './contractService';
import { TournamentService } from './tournamentService';
import { UserService } from './userService';
import { Tournament } from '../types/tournament';

export class AnalyticsService {
  constructor(
    private contractService: ContractService,
    private tournamentService: TournamentService,
    private userService: UserService
  ) {}

  public async getTournamentStats(): Promise<{
    totalTournaments: number;
    activeTournaments: number;
    totalPlayers: number;
    totalPrizePool: bigint;
    averageEntryFee: bigint;
  }> {
    const tournaments = await this.tournamentService.getAllTournaments();
    const activeTournaments = tournaments.filter(t => !t.endTime);

    return {
      totalTournaments: tournaments.length,
      activeTournaments: activeTournaments.length,
      totalPlayers: new Set(tournaments.flatMap(t => t.players)).size,
      totalPrizePool: tournaments.reduce((sum, t) => sum + t.prizePool, 0n),
      averageEntryFee: tournaments.length > 0
        ? tournaments.reduce((sum, t) => sum + t.entryFee, 0n) / BigInt(tournaments.length)
        : 0n
    };
  }

  public async getPlayerStats(address: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    totalBetAmount: bigint;
    totalWinAmount: bigint;
    winRate: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
  }> {
    const stats = await this.contractService.getPlayerStats(address);
    const tournaments = await this.tournamentService.getAllTournaments();
    const playerTournaments = tournaments.filter(t => t.players.includes(address));
    const tournamentsWon = tournaments.filter(t => t.winners?.includes(address));

    return {
      totalGames: stats.totalGames,
      wins: stats.wins,
      losses: stats.losses,
      totalBetAmount: stats.totalBetAmount,
      totalWinAmount: stats.totalWinAmount,
      winRate: stats.wins / (stats.totalGames || 1),
      tournamentsPlayed: playerTournaments.length,
      tournamentsWon: tournamentsWon.length
    };
  }

  public async getGlobalStats(): Promise<{
    totalPlayers: number;
    totalGamesPlayed: number;
    totalTournaments: number;
    totalPrizePool: bigint;
    mostSuccessfulPlayer: {
      address: string;
      wins: number;
      totalWinAmount: bigint;
    };
  }> {
    const players = await this.contractService.getAllPlayers();
    const tournaments = await this.tournamentService.getAllTournaments();

    let mostSuccessfulPlayer = {
      address: '',
      wins: 0,
      totalWinAmount: 0n
    };

    for (const player of players) {
      const profile = await this.userService.getUserProfile(player);
      if (!profile) continue;

      const stats = profile.stats;
      if (stats.wins > mostSuccessfulPlayer.wins || 
          (stats.wins === mostSuccessfulPlayer.wins && stats.totalWinAmount > mostSuccessfulPlayer.totalWinAmount)) {
        mostSuccessfulPlayer = {
          address: player,
          wins: stats.wins,
          totalWinAmount: stats.totalWinAmount
        };
      }
    }

    const playerStats = await Promise.all(
      players.map(p => this.userService.getUserStats(p))
    );

    const totalGamesPlayed = playerStats.reduce(
      (sum, stats) => sum + (stats?.totalGames || 0),
      0
    );

    return {
      totalPlayers: players.length,
      totalGamesPlayed,
      totalTournaments: tournaments.length,
      totalPrizePool: tournaments.reduce((sum, t) => sum + t.prizePool, 0n),
      mostSuccessfulPlayer
    };
  }
} 