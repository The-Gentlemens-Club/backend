export enum TournamentStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date | null;
  entryFee: bigint;
  prizePool: bigint;
  minPlayers: number;
  maxPlayers: number;
  status: TournamentStatus;
  players: string[];
  winners?: { address: string; prize: bigint; rank: number }[];
  rules: {
    minBet: bigint;
    maxBet: bigint;
    timeLimit: number;
    maxRounds: number;
    allowRebuys: boolean;
  };
}

export interface TournamentStats {
  totalPlayers: bigint;
  activePlayers: bigint;
  totalPrizePool: bigint;
  averageEntryFee: bigint;
  completedGames: bigint;
  activeGames: bigint;
}

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

export interface TournamentRules {
  minPlayers: number;
  maxPlayers: number;
  entryFee: bigint;
  prizePool: bigint;
  startTime?: Date;
  endTime?: Date;
  minBet: bigint;
  maxBet: bigint;
  timeLimit: number;
  maxRounds: number;
  allowRebuys: boolean;
} 