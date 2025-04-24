export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  entryFee: string;
  startTime: Date;
  endTime: Date;
  status: TournamentStatus;
  players: string[];
  prizePool?: string;
  categoryId?: string;
  maxPlayers?: number;
  minPlayers?: number;
  description?: string;
  rules?: string;
  rewards?: {
    rank: number;
    prize: string;
  }[];
}

export interface TournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalPrizePool: string;
  averageEntryFee: string;
  playerCount: number;
  averagePlayerCount: number;
} 