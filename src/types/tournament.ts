export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed'
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
  winners?: string[];
  rules: TournamentRules;
}

export interface TournamentRules {
  minBet: bigint;
  maxBet: bigint;
  timeLimit: number;
  maxRounds: number;
  allowRebuys: boolean;
}

export interface TournamentStats {
  totalPlayers: bigint;
  activePlayers: bigint;
  totalPrizePool: bigint;
  averageEntryFee: bigint;
  completedGames: bigint;
  activeGames: bigint;
} 