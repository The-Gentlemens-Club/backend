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
}

export interface Tournament {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  entryFee: bigint;
  prizePool: bigint;
  maxPlayers: number;
  registeredPlayers: string[];
  status: 'upcoming' | 'active' | 'completed';
  winners: {
    address: string;
    prize: bigint;
    rank: number;
  }[];
} 