import { Tournament } from './tournament';

export interface GameState {
  isActive: boolean;
  currentBet: bigint;
  playerBalance: bigint;
}

export interface GameHistory {
  id: string;
  playerAddress: string;
  betAmount: bigint;
  outcome: 'win' | 'lose' | 'draw';
  timestamp: Date;
  txHash: string;
}

export interface PlayerStats {
  address: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  totalBetAmount: bigint;
  totalWinAmount: bigint;
  winRate: number;
  highestWin: bigint;
  currentStreak: number;
  bestStreak: number;
  lastGamePlayed: Date;
  level: number;
  experience: number;
  rank: string;
  tournamentsWon?: number;
}

export interface GameConfig {
  minBet: bigint;
  maxBet: bigint;
  maxPlayers: number;
  roundDuration: number;
  houseEdge: number;
}

export interface GameResult {
  gameId: string;
  playerAddress: string;
  betAmount: bigint;
  outcome: 'win' | 'lose' | 'draw';
  payout: bigint;
  timestamp: Date;
  txHash: string;
}

export interface GameStats {
  totalGames: number;
  totalBets: bigint;
  totalPayouts: bigint;
  averageBet: bigint;
  largestWin: bigint;
  uniquePlayers: number;
  houseProfit: bigint;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
} 