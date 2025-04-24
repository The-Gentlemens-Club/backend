import { ContractService } from './contractService';
import { Tournament, TournamentStatus } from '../types/tournament';
import { UserService } from './userService';
import { NotificationService } from './notificationService';

export class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();

  constructor(
    private contractService: ContractService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  public async createTournament(
    name: string,
    description: string,
    startTime: Date,
    entryFee: bigint,
    prizePool: bigint,
    minPlayers: number,
    maxPlayers: number,
    rules: {
      minBet: bigint;
      maxBet: bigint;
      timeLimit: number;
      maxRounds: number;
      allowRebuys: boolean;
    }
  ): Promise<Tournament> {
    const txHash = await this.contractService.createTournament(
      name,
      description,
      startTime,
      entryFee,
      prizePool,
      minPlayers,
      maxPlayers,
      rules
    );

    const tournament: Tournament = {
      id: txHash,
      name,
      description,
      startTime,
      endTime: null,
      entryFee,
      prizePool,
      minPlayers,
      maxPlayers,
      status: TournamentStatus.UPCOMING,
      players: [],
      winners: [],
      rules
    };

    this.tournaments.set(tournament.id, tournament);
    return tournament;
  }

  public async joinTournament(tournamentId: string, playerAddress: string, entryFee: bigint): Promise<void> {
    const tournament = await this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    await this.contractService.joinTournament(Number(tournamentId), entryFee);
    tournament.players.push(playerAddress);
    this.tournaments.set(tournamentId, tournament);
  }

  public async getTournament(tournamentId: string): Promise<Tournament | null> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      const contractTournament = await this.contractService.getTournament(BigInt(tournamentId));
      if (contractTournament) {
        this.tournaments.set(tournamentId, contractTournament);
        return contractTournament;
      }
    }
    return tournament || null;
  }

  public async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  public async updateTournamentStatus(tournamentId: string, status: TournamentStatus): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (tournament) {
      tournament.status = status;
      this.tournaments.set(tournamentId, tournament);
    }
  }

  public async getRegisteredPlayers(tournamentId: string): Promise<string[]> {
    return await this.contractService.getRegisteredPlayers(BigInt(tournamentId));
  }

  public async getTournamentWinners(tournamentId: string): Promise<{ address: string; prize: bigint; rank: number }[]> {
    return await this.contractService.getTournamentWinners(BigInt(tournamentId));
  }

  public async getTournamentLeaderboard(tournamentId: string): Promise<{ address: string; score: number }[]> {
    return await this.contractService.getTournamentLeaderboard(BigInt(tournamentId));
  }

  public async getTournamentAnalytics(tournamentId: string): Promise<{
    totalPlayers: number;
    totalPrizePool: bigint;
    averageEntryFee: bigint;
    startTime: Date;
    endTime: Date | null;
    playerDistribution: {
      rank: number;
      count: number;
    }[];
    participationRate: number;
    completionRate: number;
  }> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const players = await this.getRegisteredPlayers(tournamentId);
      const winners = await this.getTournamentWinners(tournamentId);

      const playerDistribution = this.calculatePlayerDistribution(players.length, tournament.maxPlayers);
      const participationRate = (players.length / tournament.maxPlayers) * 100;
      const completionRate = (winners.length / players.length) * 100;

      return {
        totalPlayers: players.length,
        totalPrizePool: tournament.prizePool,
        averageEntryFee: tournament.entryFee,
        startTime: tournament.startTime,
        endTime: tournament.endTime,
        playerDistribution,
        participationRate,
        completionRate
      };
    } catch (error) {
      console.error('Error getting tournament analytics:', error);
      throw error;
    }
  }

  private calculatePlayerDistribution(
    currentPlayers: number,
    maxPlayers: number
  ): { rank: number; count: number }[] {
    const ranks = [1, 2, 3, 4, 5];
    return ranks.map(rank => ({
      rank,
      count: Math.floor((currentPlayers / maxPlayers) * (100 / rank))
    }));
  }

  public async getTournamentSchedule(
    startDate: Date,
    endDate: Date
  ): Promise<Tournament[]> {
    try {
      const tournaments = await this.getAllTournaments();
      return tournaments.filter(t => 
        t.startTime >= startDate && 
        t.startTime <= endDate
      );
    } catch (error) {
      console.error('Error getting tournament schedule:', error);
      throw error;
    }
  }

  public async getTournamentRecommendations(
    address: string,
    limit: number = 5
  ): Promise<Tournament[]> {
    try {
      const upcomingTournaments = await this.contractService.getUpcomingTournaments();
      const playerTournaments = await this.contractService.getPlayerTournaments(address);
      
      // Filter out tournaments the player is already registered in
      const availableTournaments = upcomingTournaments.filter(t => 
        !playerTournaments.some(pt => pt.id === t.id)
      );

      // Sort by entry fee (closest to player's average)
      const playerStats = await this.contractService.getPlayerStats(address);
      const averageBet = playerStats.totalBetAmount / BigInt(playerStats.totalGames || 1);

      return availableTournaments
        .sort((a, b) => {
          const diffA = Number(a.entryFee - averageBet);
          const diffB = Number(b.entryFee - averageBet);
          return Math.abs(diffA) - Math.abs(diffB);
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting tournament recommendations:', error);
      throw error;
    }
  }
} 