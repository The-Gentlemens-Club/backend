import { ethers } from 'ethers';
import { GameState, GameHistory, PlayerStats } from '../types/game';
import { Tournament, TournamentStatus } from '../types/tournament';
import { UserService } from './userService';
import { NotificationService } from './notificationService';

export class ContractService {
  private provider: ethers.Provider;
  private tournamentContract: ethers.Contract;
  private gameContract: ethers.Contract;

  constructor(
    private rpcUrl: string,
    private tournamentContractAddress: string,
    private gameContractAddress: string,
    private userService: UserService,
    private notificationService: NotificationService,
    private jwtSecret: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.tournamentContract = new ethers.Contract(
      tournamentContractAddress,
      [], // Add ABI here
      this.provider
    );
    this.gameContract = new ethers.Contract(
      gameContractAddress,
      [], // Add ABI here
      this.provider
    );
  }

  public async getPlayerStats(address: string): Promise<PlayerStats> {
    return {
      address,
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      totalBetAmount: 0n,
      totalWinAmount: 0n,
      winRate: 0,
      highestWin: 0n,
      currentStreak: 0,
      bestStreak: 0,
      lastGamePlayed: new Date(),
      level: 1,
      experience: 0,
      rank: 'Bronze'
    };
  }

  async getGameState(address: string): Promise<GameState> {
    try {
      const state = await this.gameContract.getGameState(address);
      return {
        isActive: state[0],
        currentBet: state[1],
        playerBalance: state[2]
      };
    } catch (error) {
      console.error('Error getting game state:', error);
      throw error;
    }
  }

  async startGame() {
    try {
      const tx = await this.gameContract.startGame();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  async placeBet(amount: bigint) {
    try {
      const tx = await this.gameContract.placeBet(amount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  async createTournament(
    name: string,
    entryFee: bigint,
    maxPlayers: number,
    startTime: Date
  ): Promise<string> {
    try {
      const tx = await this.gameContract.createTournament(
        name,
        entryFee,
        maxPlayers,
        Math.floor(startTime.getTime() / 1000)
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  async joinTournament(tournamentId: number, entryFee: bigint): Promise<string> {
    try {
      const tx = await this.gameContract.joinTournament(tournamentId, {
        value: entryFee
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  async getTournamentInfo(tournamentId: number): Promise<Tournament> {
    try {
      const info = await this.gameContract.getTournamentInfo(tournamentId);
      return {
        id: tournamentId.toString(),
        name: info[0],
        entryFee: info[1],
        prizePool: info[2],
        maxPlayers: Number(info[3]),
        registeredPlayers: [],  // This would need to be fetched separately
        startTime: new Date(Number(info[5]) * 1000),
        endTime: new Date(0),  // This would need to be calculated or fetched
        status: this.getTournamentStatus(info[6]),
        winners: []  // This would need to be fetched separately
      };
    } catch (error) {
      console.error('Error getting tournament info:', error);
      throw error;
    }
  }

  async getPlayerHistory(
    address: string,
    offset: number = 0,
    limit: number = 10
  ): Promise<GameHistory[]> {
    try {
      const history = await this.gameContract.getPlayerHistory(address, offset, limit);
      return history.map((game: any) => ({
        id: ethers.id(game.txHash + game.timestamp.toString()),
        playerAddress: address,
        betAmount: game.betAmount,
        outcome: this.getGameOutcome(game.outcome),
        timestamp: new Date(Number(game.timestamp) * 1000),
        txHash: game.txHash
      }));
    } catch (error) {
      console.error('Error getting player history:', error);
      throw error;
    }
  }

  async getBalance(address: string) {
    try {
      return await this.gameContract.balanceOf(address);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async approve(spender: string, amount: bigint) {
    try {
      const tx = await this.gameContract.approve(spender, amount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    }
  }

  private getTournamentStatus(status: number): 'upcoming' | 'active' | 'completed' {
    switch (status) {
      case 0:
        return 'upcoming';
      case 1:
        return 'active';
      case 2:
        return 'completed';
      default:
        return 'upcoming';
    }
  }

  private getGameOutcome(outcome: number): 'win' | 'lose' | 'draw' {
    switch (outcome) {
      case 0:
        return 'win';
      case 1:
        return 'lose';
      case 2:
        return 'draw';
      default:
        return 'draw';
    }
  }

  async getRegisteredPlayers(tournamentId: number): Promise<string[]> {
    try {
      // This would need to be implemented in the smart contract
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error getting registered players:', error);
      throw error;
    }
  }

  async getTournamentWinners(tournamentId: number): Promise<{ address: string; prize: bigint; rank: number }[]> {
    try {
      // This would need to be implemented in the smart contract
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error getting tournament winners:', error);
      throw error;
    }
  }

  async getLastGamePlayed(address: string): Promise<Date> {
    try {
      const history = await this.getPlayerHistory(address, 0, 1);
      return history.length > 0 ? history[0].timestamp : new Date(0);
    } catch (error) {
      console.error('Error getting last game played:', error);
      throw error;
    }
  }

  async calculateTournamentEndTime(startTime: Date): Promise<Date> {
    // Tournament duration is 24 hours
    return new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
  }

  async getTournaments(offset: number = 0, limit: number = 10): Promise<Tournament[]> {
    try {
      const tournaments = await this.gameContract.getTournaments(offset, limit);
      return Promise.all(tournaments.map(async (tournament: any) => {
        const registeredPlayers = await this.getRegisteredPlayers(Number(tournament.id));
        const winners = await this.getTournamentWinners(Number(tournament.id));
        const endTime = await this.calculateTournamentEndTime(new Date(Number(tournament.startTime) * 1000));
        
        return {
          id: tournament.id.toString(),
          name: tournament.name,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          maxPlayers: Number(tournament.maxPlayers),
          registeredPlayers,
          startTime: new Date(Number(tournament.startTime) * 1000),
          endTime,
          status: this.getTournamentStatus(tournament.status),
          winners
        };
      }));
    } catch (error) {
      console.error('Error getting tournaments:', error);
      throw error;
    }
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === 'active');
    } catch (error) {
      console.error('Error getting active tournaments:', error);
      throw error;
    }
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === 'upcoming');
    } catch (error) {
      console.error('Error getting upcoming tournaments:', error);
      throw error;
    }
  }

  async getCompletedTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === 'completed');
    } catch (error) {
      console.error('Error getting completed tournaments:', error);
      throw error;
    }
  }

  async getPlayerTournaments(address: string): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => 
        t.registeredPlayers.includes(address) || 
        t.winners.some(w => w.address === address)
      );
    } catch (error) {
      console.error('Error getting player tournaments:', error);
      throw error;
    }
  }

  async getTournamentLeaderboard(tournamentId: number): Promise<{ address: string; score: number }[]> {
    try {
      // This would need to be implemented in the smart contract
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error getting tournament leaderboard:', error);
      throw error;
    }
  }

  async updateTournamentStatus(tournamentId: number): Promise<void> {
    try {
      const tx = await this.gameContract.updateTournamentStatus(tournamentId);
      await tx.wait();
    } catch (error) {
      console.error('Error updating tournament status:', error);
      throw error;
    }
  }

  async distributePrizes(tournamentId: number): Promise<void> {
    try {
      const tx = await this.gameContract.distributePrizes(tournamentId);
      await tx.wait();
    } catch (error) {
      console.error('Error distributing prizes:', error);
      throw error;
    }
  }

  async getTournamentStats(tournamentId: number): Promise<{
    totalPlayers: number;
    totalPrizePool: bigint;
    averageEntryFee: bigint;
    startTime: Date;
    endTime: Date;
  }> {
    try {
      const tournament = await this.getTournamentInfo(tournamentId);
      return {
        totalPlayers: tournament.registeredPlayers.length,
        totalPrizePool: tournament.prizePool,
        averageEntryFee: tournament.entryFee,
        startTime: tournament.startTime,
        endTime: tournament.endTime
      };
    } catch (error) {
      console.error('Error getting tournament stats:', error);
      throw error;
    }
  }
} 