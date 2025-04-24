import { Tournament } from '../types/tournament';
import { TournamentCategory } from './tournamentRulesService';

export type NotificationType = 
  | 'tournament_start'
  | 'tournament_end'
  | 'prize_distribution'
  | 'registration_open'
  | 'registration_closing'
  | 'player_joined'
  | 'player_left'
  | 'rank_update';

export type Notification = {
  id: string;
  type: NotificationType;
  tournamentId: string;
  message: string;
  timestamp: Date;
  data?: any;
};

export class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();

  async createNotification(
    type: NotificationType,
    tournamentId: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      tournamentId,
      message,
      timestamp: new Date(),
      data
    };

    const tournamentNotifications = this.notifications.get(tournamentId) || [];
    tournamentNotifications.push(notification);
    this.notifications.set(tournamentId, tournamentNotifications);

    return notification;
  }

  async getTournamentNotifications(
    tournamentId: string,
    limit: number = 10
  ): Promise<Notification[]> {
    const notifications = this.notifications.get(tournamentId) || [];
    return notifications.slice(-limit);
  }

  async notifyTournamentStart(tournament: Tournament): Promise<void> {
    await this.createNotification(
      'tournament_start',
      tournament.id,
      `Tournament "${tournament.name}" has started!`,
      { tournament }
    );
  }

  async notifyTournamentEnd(tournament: Tournament): Promise<void> {
    await this.createNotification(
      'tournament_end',
      tournament.id,
      `Tournament "${tournament.name}" has ended!`,
      { tournament }
    );
  }

  async notifyPrizeDistribution(
    tournament: Tournament,
    winners: { address: string; amount: bigint }[]
  ): Promise<void> {
    await this.createNotification(
      'prize_distribution',
      tournament.id,
      `Prizes have been distributed for tournament "${tournament.name}"!`,
      { tournament, winners }
    );
  }

  async notifyRegistrationOpen(tournament: Tournament): Promise<void> {
    await this.createNotification(
      'registration_open',
      tournament.id,
      `Registration is now open for tournament "${tournament.name}"!`,
      { tournament }
    );
  }

  async notifyRegistrationClosing(
    tournament: Tournament,
    timeLeft: number // in minutes
  ): Promise<void> {
    await this.createNotification(
      'registration_closing',
      tournament.id,
      `Registration for tournament "${tournament.name}" is closing in ${timeLeft} minutes!`,
      { tournament, timeLeft }
    );
  }

  async notifyPlayerJoined(
    tournament: Tournament,
    playerAddress: string
  ): Promise<void> {
    await this.createNotification(
      'player_joined',
      tournament.id,
      `Player ${playerAddress} has joined tournament "${tournament.name}"!`,
      { tournament, playerAddress }
    );
  }

  async notifyPlayerLeft(
    tournament: Tournament,
    playerAddress: string
  ): Promise<void> {
    await this.createNotification(
      'player_left',
      tournament.id,
      `Player ${playerAddress} has left tournament "${tournament.name}"!`,
      { tournament, playerAddress }
    );
  }

  async notifyRankUpdate(
    tournament: Tournament,
    playerAddress: string,
    newRank: number
  ): Promise<void> {
    await this.createNotification(
      'rank_update',
      tournament.id,
      `Player ${playerAddress} is now ranked #${newRank} in tournament "${tournament.name}"!`,
      { tournament, playerAddress, newRank }
    );
  }

  async notifyCategoryRecommendation(
    playerAddress: string,
    category: TournamentCategory
  ): Promise<void> {
    await this.createNotification(
      'registration_open',
      'system',
      `Based on your performance, we recommend trying ${category.name} tournaments!`,
      { playerAddress, category }
    );
  }
} 