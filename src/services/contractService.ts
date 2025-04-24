import { ethers } from 'ethers';
import { Tournament, TournamentStatus } from '../types/tournament';
import { GameState, GameHistory, PlayerStats } from '../types/game';
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

  public async getTournament(tournamentId: bigint): Promise<Tournament | null> {
    try {
      const info = await this.tournamentContract.getTournament(tournamentId);
      if (!info) return null;

      return {
        id: tournamentId.toString(),
        name: info.name,
        description: info.description,
        startTime: new Date(Number(info.startTime) * 1000),
        endTime: info.endTime ? new Date(Number(info.endTime) * 1000) : null,
        entryFee: info.entryFee,
        prizePool: info.prizePool,
        minPlayers: info.minPlayers,
        maxPlayers: info.maxPlayers,
        status: this.getTournamentStatus(info.status),
        players: info.players,
        winners: info.winners?.map((w: any) => ({
          address: w.address,
          prize: w.prize,
          rank: w.rank
        })),
        rules: {
          minBet: info.rules.minBet,
          maxBet: info.rules.maxBet,
          timeLimit: info.rules.timeLimit,
          maxRounds: info.rules.maxRounds,
          allowRebuys: info.rules.allowRebuys
        }
      };
    } catch (error) {
      console.error('Error getting tournament:', error);
      return null;
    }
  }

  public async getTournaments(offset: number = 0, limit: number = 10): Promise<Tournament[]> {
    try {
      const tournaments = await this.tournamentContract.getTournaments(offset, limit);
      return Promise.all(tournaments.map((t: any) => this.getTournament(BigInt(t.id))));
    } catch (error) {
      console.error('Error getting tournaments:', error);
      return [];
    }
  }

  public async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === TournamentStatus.ACTIVE);
    } catch (error) {
      console.error('Error getting active tournaments:', error);
      return [];
    }
  }

  public async getUpcomingTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === TournamentStatus.UPCOMING);
    } catch (error) {
      console.error('Error getting upcoming tournaments:', error);
      return [];
    }
  }

  public async getCompletedTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === TournamentStatus.COMPLETED);
    } catch (error) {
      console.error('Error getting completed tournaments:', error);
      return [];
    }
  }

  public async getPlayerTournaments(address: string): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => 
        t.players.includes(address) || 
        t.winners?.some(w => w.address === address)
      );
    } catch (error) {
      console.error('Error getting player tournaments:', error);
      return [];
    }
  }

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
  ): Promise<string> {
    try {
      const tx = await this.tournamentContract.createTournament(
        name,
        description,
        Math.floor(startTime.getTime() / 1000),
        entryFee,
        prizePool,
        minPlayers,
        maxPlayers,
        rules
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  public async joinTournament(tournamentId: number, entryFee: bigint): Promise<string> {
    try {
      const tx = await this.tournamentContract.joinTournament(tournamentId, {
        value: entryFee
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  public async getPlayerHistory(
    address: string,
    offset: number = 0,
    limit: number = 10
  ): Promise<GameHistory[]> {
    try {
      const history = await this.gameContract.getPlayerHistory(address, offset, limit);
      return history.map((game: any) => ({
        id: game.id,
        playerAddress: address,
        betAmount: game.betAmount,
        outcome: this.getGameOutcome(game.outcome),
        timestamp: new Date(Number(game.timestamp) * 1000),
        txHash: game.txHash
      }));
    } catch (error) {
      console.error('Error getting player history:', error);
      return [];
    }
  }

  private getTournamentStatus(status: number): TournamentStatus {
    switch (status) {
      case 0:
        return TournamentStatus.UPCOMING;
      case 1:
        return TournamentStatus.ACTIVE;
      case 2:
        return TournamentStatus.COMPLETED;
      default:
        return TournamentStatus.UPCOMING;
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

  public async getTournamentLeaderboard(tournamentId: bigint): Promise<{ address: string; score: number }[]> {
    try {
      return await this.tournamentContract.getLeaderboard(tournamentId);
    } catch (error) {
      console.error('Error getting tournament leaderboard:', error);
      return [];
    }
  }

  public async getTournamentWinners(tournamentId: bigint): Promise<{ address: string; prize: bigint; rank: number }[]> {
    try {
      return await this.tournamentContract.getWinners(tournamentId);
    } catch (error) {
      console.error('Error getting tournament winners:', error);
      return [];
    }
  }

  public async getRegisteredPlayers(tournamentId: bigint): Promise<string[]> {
    try {
      return await this.tournamentContract.getRegisteredPlayers(tournamentId);
    } catch (error) {
      console.error('Error getting registered players:', error);
      return [];
    }
  }

  public async getBalance(address: string): Promise<bigint> {
    try {
      return await this.gameContract.balanceOf(address);
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0n;
    }
  }

  public async approve(spender: string, amount: bigint): Promise<string> {
    try {
      const tx = await this.gameContract.approve(spender, amount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    }
  }

  public async getAllPlayers(): Promise<string[]> {
    try {
      return await this.tournamentContract.getAllPlayers();
    } catch (error) {
      console.error('Error getting all players:', error);
      return [];
    }
  }
} 