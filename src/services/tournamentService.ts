import { ContractService } from './contracts';
import { Tournament, TournamentStatus } from '../types/tournament';

export class TournamentService {
  private contractService: ContractService;
  private tournaments: Map<string, Tournament> = new Map();

  constructor() {
    this.contractService = new ContractService();
  }

  async scheduleTournament(
    name: string,
    entryFee: bigint,
    maxPlayers: number,
    startTime: Date,
    duration: number = 24 // hours
  ): Promise<string> {
    try {
      const tournamentId = await this.contractService.createTournament(
        name,
        entryFee,
        maxPlayers,
        startTime
      );
      
      // Schedule status updates
      this.scheduleStatusUpdates(Number(tournamentId), startTime, duration);
      
      return tournamentId;
    } catch (error) {
      console.error('Error scheduling tournament:', error);
      throw error;
    }
  }

  private async scheduleStatusUpdates(
    tournamentId: number,
    startTime: Date,
    duration: number
  ) {
    const now = new Date();
    const startDelay = startTime.getTime() - now.getTime();
    const endDelay = startDelay + (duration * 60 * 60 * 1000);

    // Schedule start
    setTimeout(async () => {
      await this.contractService.updateTournamentStatus(tournamentId);
    }, startDelay);

    // Schedule end
    setTimeout(async () => {
      await this.contractService.updateTournamentStatus(tournamentId);
      await this.contractService.distributePrizes(tournamentId);
    }, endDelay);
  }

  async getTournamentAnalytics(tournamentId: number): Promise<{
    totalPlayers: number;
    totalPrizePool: bigint;
    averageEntryFee: bigint;
    startTime: Date;
    endTime: Date;
    playerDistribution: {
      rank: number;
      count: number;
    }[];
    participationRate: number;
    completionRate: number;
  }> {
    try {
      const tournament = await this.contractService.getTournamentInfo(tournamentId);
      const players = await this.contractService.getRegisteredPlayers(tournamentId);
      const winners = await this.contractService.getTournamentWinners(tournamentId);

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
    const distribution = ranks.map(rank => ({
      rank,
      count: Math.floor((currentPlayers / maxPlayers) * (100 / rank))
    }));
    return distribution;
  }

  async getPlayerRankings(
    tournamentId: number,
    limit: number = 10
  ): Promise<{
    address: string;
    score: number;
    rank: number;
    gamesPlayed: number;
    winRate: number;
  }[]> {
    try {
      const leaderboard = await this.contractService.getTournamentLeaderboard(tournamentId);
      return leaderboard.slice(0, limit).map((entry, index) => ({
        address: entry.address,
        score: entry.score,
        rank: index + 1,
        gamesPlayed: 0, // This would need to be fetched from the contract
        winRate: 0 // This would need to be calculated from player stats
      }));
    } catch (error) {
      console.error('Error getting player rankings:', error);
      throw error;
    }
  }

  async getTournamentSchedule(
    startDate: Date,
    endDate: Date
  ): Promise<Tournament[]> {
    try {
      const tournaments = await this.contractService.getTournaments();
      return tournaments.filter(t => 
        t.startTime >= startDate && 
        t.startTime <= endDate
      );
    } catch (error) {
      console.error('Error getting tournament schedule:', error);
      throw error;
    }
  }

  async getTournamentRecommendations(
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

  async createTournament(tournament: Tournament): Promise<void> {
    this.tournaments.set(tournament.id, tournament);
  }

  async addPlayer(tournamentId: string, playerAddress: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    tournament.players.push(playerAddress);
    this.tournaments.set(tournamentId, tournament);
  }

  async updateTournamentStatus(tournamentId: string, status: 'upcoming' | 'active' | 'completed'): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    tournament.status = status;
    this.tournaments.set(tournamentId, tournament);
  }

  async getTournament(tournamentId: string): Promise<Tournament | undefined> {
    return this.tournaments.get(tournamentId);
  }

  async getTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }
} 