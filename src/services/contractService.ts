import { ethers } from 'ethers';
import { Tournament } from '../types/tournament';
import { TournamentService } from './tournamentService';
import { UserService } from './userService';
import { NotificationService } from './notificationService';

// Contract ABIs
const TOURNAMENT_ABI = [
  'function createTournament(string name, uint256 entryFee, uint256 startTime) external returns (uint256)',
  'function joinTournament(uint256 tournamentId) external payable',
  'function getTournament(uint256 tournamentId) external view returns (string, uint256, uint256, uint256, uint256, uint256)',
  'function getTournamentPlayers(uint256 tournamentId) external view returns (address[])',
  'function getTournamentWinners(uint256 tournamentId) external view returns (address[], uint256[])',
  'function distributePrizes(uint256 tournamentId) external',
  'function getTournamentStatus(uint256 tournamentId) external view returns (uint8)',
  'event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee, uint256 startTime)',
  'event PlayerJoined(uint256 indexed tournamentId, address indexed player)',
  'event TournamentCompleted(uint256 indexed tournamentId, address[] winners, uint256[] prizes)'
];

const GAME_ABI = [
  'function playGame(uint256 betAmount) external returns (uint8)',
  'function getGameHistory(address player) external view returns (uint256[])',
  'function getLastGamePlayed(address player) external view returns (uint256)',
  'function getGameOutcome(uint256 gameId) external view returns (uint8)',
  'event GamePlayed(address indexed player, uint256 indexed gameId, uint256 betAmount, uint8 outcome)'
];

type ContractTransaction = ethers.ContractTransactionResponse;

interface TournamentContractInterface {
  createTournament(name: string, entryFee: bigint, startTime: number): Promise<ContractTransaction>;
  joinTournament(tournamentId: bigint, options: { value: bigint }): Promise<ContractTransaction>;
  getTournament(tournamentId: bigint): Promise<[string, bigint, bigint, bigint, bigint, number]>;
  getTournamentPlayers(tournamentId: bigint): Promise<string[]>;
  getTournamentWinners(tournamentId: bigint): Promise<[string[], bigint[]]>;
  distributePrizes(tournamentId: bigint): Promise<ContractTransaction>;
  getTournamentStatus(tournamentId: bigint): Promise<number>;
  on(event: string, listener: (...args: any[]) => void): ethers.BaseContract;
  connect(signer: ethers.Signer): ethers.BaseContract & TournamentContractInterface;
}

interface GameContractInterface {
  playGame(betAmount: bigint): Promise<ContractTransaction>;
  getGameHistory(player: string): Promise<bigint[]>;
  getLastGamePlayed(player: string): Promise<bigint>;
  getGameOutcome(gameId: bigint): Promise<number>;
  on(event: string, listener: (...args: any[]) => void): ethers.BaseContract;
  connect(signer: ethers.Signer): ethers.BaseContract & GameContractInterface;
}

type TournamentContract = ethers.BaseContract & TournamentContractInterface;
type GameContract = ethers.BaseContract & GameContractInterface;

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private tournamentContract: TournamentContract;
  private gameContract: GameContract;
  private tournamentService: TournamentService;
  private userService: UserService;
  private notificationService: NotificationService;

  constructor(
    rpcUrl: string,
    tournamentContractAddress: string,
    gameContractAddress: string,
    tournamentService: TournamentService,
    userService: UserService,
    notificationService: NotificationService
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.tournamentContract = new ethers.Contract(
      tournamentContractAddress,
      TOURNAMENT_ABI,
      this.provider
    ) as unknown as TournamentContract;
    this.gameContract = new ethers.Contract(
      gameContractAddress,
      GAME_ABI,
      this.provider
    ) as unknown as GameContract;
    this.tournamentService = tournamentService;
    this.userService = userService;
    this.notificationService = notificationService;

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Tournament events
    this.tournamentContract.on('TournamentCreated', async (tournamentId: bigint, name: string, entryFee: bigint, startTime: bigint) => {
      const tournament: Tournament = {
        id: tournamentId.toString(),
        name,
        entryFee: entryFee.toString(),
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(startTime) * 1000 + 24 * 60 * 60 * 1000), // 24 hours after start
        status: 'upcoming',
        players: []
      };
      await this.tournamentService.createTournament(tournament);
    });

    this.tournamentContract.on('PlayerJoined', async (tournamentId: bigint, player: string) => {
      await this.tournamentService.addPlayer(tournamentId.toString(), player);
      await this.notificationService.notifyTournamentJoined(player, tournamentId.toString());
    });

    this.tournamentContract.on('TournamentCompleted', async (tournamentId: bigint, winners: string[], prizes: bigint[]) => {
      await this.tournamentService.updateTournamentStatus(tournamentId.toString(), 'completed');
      for (let i = 0; i < winners.length; i++) {
        await this.notificationService.notifyTournamentWon(winners[i], tournamentId.toString(), prizes[i].toString());
      }
    });

    // Game events
    this.gameContract.on('GamePlayed', async (player: string, gameId: bigint, betAmount: bigint, outcome: number) => {
      const outcomeStr = this.getGameOutcomeString(outcome);
      await this.userService.updateStats(player, {
        totalGames: 1,
        [outcomeStr === 'win' ? 'wins' : outcomeStr === 'lose' ? 'losses' : 'draws']: 1,
        totalBetAmount: betAmount
      });
      await this.notificationService.notifyGameResult(player, gameId.toString(), outcomeStr);
    });
  }

  // Tournament methods
  async createTournament(
    privateKey: string,
    name: string,
    entryFee: bigint,
    startTime: Date
  ): Promise<string> {
    const signer = new ethers.Wallet(privateKey, this.provider);
    const contract = this.tournamentContract.connect(signer) as TournamentContract;
    const tx = await contract.createTournament(name, entryFee, Math.floor(startTime.getTime() / 1000));
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction failed');
    return receipt.hash;
  }

  async joinTournament(
    privateKey: string,
    tournamentId: bigint,
    entryFee: bigint
  ): Promise<string> {
    const signer = new ethers.Wallet(privateKey, this.provider);
    const contract = this.tournamentContract.connect(signer) as TournamentContract;
    const tx = await contract.joinTournament(tournamentId, { value: entryFee });
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction failed');
    return receipt.hash;
  }

  async getTournament(tournamentId: bigint) {
    const tournament = await this.tournamentContract.getTournament(tournamentId);
    return {
      name: tournament[0],
      entryFee: tournament[1].toString(),
      startTime: new Date(Number(tournament[2]) * 1000),
      endTime: new Date(Number(tournament[3]) * 1000),
      prizePool: tournament[4].toString(),
      status: this.getTournamentStatus(tournament[5])
    };
  }

  async getTournamentPlayers(tournamentId: bigint): Promise<string[]> {
    return await this.tournamentContract.getTournamentPlayers(tournamentId);
  }

  async getTournamentWinners(tournamentId: bigint) {
    const [winners, prizes] = await this.tournamentContract.getTournamentWinners(tournamentId);
    return winners.map((winner: string, index: number) => ({
      address: winner,
      prize: prizes[index].toString()
    }));
  }

  async distributePrizes(privateKey: string, tournamentId: bigint): Promise<string> {
    const signer = new ethers.Wallet(privateKey, this.provider);
    const contract = this.tournamentContract.connect(signer) as TournamentContract;
    const tx = await contract.distributePrizes(tournamentId);
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction failed');
    return receipt.hash;
  }

  // Game methods
  async playGame(privateKey: string, betAmount: bigint): Promise<string> {
    const signer = new ethers.Wallet(privateKey, this.provider);
    const contract = this.gameContract.connect(signer) as GameContract;
    const tx = await contract.playGame(betAmount);
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction failed');
    return receipt.hash;
  }

  async getGameHistory(address: string): Promise<bigint[]> {
    return await this.gameContract.getGameHistory(address);
  }

  async getLastGamePlayed(address: string): Promise<Date> {
    const timestamp = await this.gameContract.getLastGamePlayed(address);
    return new Date(Number(timestamp) * 1000);
  }

  async getGameOutcome(gameId: bigint): Promise<string> {
    const outcome = await this.gameContract.getGameOutcome(gameId);
    return this.getGameOutcomeString(outcome);
  }

  // Helper methods
  private getTournamentStatus(status: number): 'upcoming' | 'active' | 'completed' {
    switch (status) {
      case 0: return 'upcoming';
      case 1: return 'active';
      case 2: return 'completed';
      default: throw new Error('Invalid tournament status');
    }
  }

  private getGameOutcomeString(outcome: number): 'win' | 'lose' | 'draw' {
    switch (outcome) {
      case 0: return 'win';
      case 1: return 'lose';
      case 2: return 'draw';
      default: throw new Error('Invalid game outcome');
    }
  }
} 