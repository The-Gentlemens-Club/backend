export interface Tournament {
  id: string;
  name: string;
  entryFee: string;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  players: string[];
  prizePool?: string;
} 