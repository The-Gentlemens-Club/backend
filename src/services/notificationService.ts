import { Tournament } from '../types/tournament';
import { TournamentCategory } from './tournamentRulesService';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 
  | 'tournament_start'
  | 'tournament_end'
  | 'prize_distribution'
  | 'registration_open'
  | 'registration_closing'
  | 'player_joined'
  | 'player_left'
  | 'rank_update'
  | 'game_invite'
  | 'achievement_unlocked'
  | 'level_up'
  | 'reward_available';

export type NotificationPreference = {
  type: NotificationType;
  enabled: boolean;
  email: boolean;
  push: boolean;
  inApp: boolean;
};

export type Notification = {
  id: string;
  type: NotificationType;
  tournamentId?: string;
  recipient: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
};

export class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();
  private preferences: Map<string, NotificationPreference[]> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();

  // Initialize default preferences for a player
  private initializeDefaultPreferences(playerAddress: string): NotificationPreference[] {
    return Object.values(NotificationType).map(type => ({
      type,
      enabled: true,
      email: false,
      push: false,
      inApp: true
    }));
  }

  // Get or initialize preferences for a player
  private getPlayerPreferences(playerAddress: string): NotificationPreference[] {
    if (!this.preferences.has(playerAddress)) {
      this.preferences.set(playerAddress, this.initializeDefaultPreferences(playerAddress));
    }
    return this.preferences.get(playerAddress)!;
  }

  // Update notification preferences
  async updatePreferences(
    playerAddress: string,
    preferences: Partial<NotificationPreference>[]
  ): Promise<void> {
    const currentPreferences = this.getPlayerPreferences(playerAddress);
    
    preferences.forEach(pref => {
      const index = currentPreferences.findIndex(p => p.type === pref.type);
      if (index !== -1) {
        currentPreferences[index] = {
          ...currentPreferences[index],
          ...pref
        };
      }
    });

    this.preferences.set(playerAddress, currentPreferences);
  }

  // Create a new notification
  async createNotification(
    type: NotificationType,
    recipient: string,
    message: string,
    data?: any,
    tournamentId?: string
  ): Promise<Notification> {
    const preferences = this.getPlayerPreferences(recipient);
    const preference = preferences.find(p => p.type === type);

    if (!preference?.enabled) {
      throw new Error('Notification type is disabled for this player');
    }

    const notification: Notification = {
      id: uuidv4(),
      type,
      tournamentId,
      recipient,
      message,
      timestamp: new Date(),
      read: false,
      data
    };

    const playerNotifications = this.notifications.get(recipient) || [];
    playerNotifications.push(notification);
    this.notifications.set(recipient, playerNotifications);

    // Send real-time notification if WebSocket connection exists
    if (this.wsConnections.has(recipient)) {
      const ws = this.wsConnections.get(recipient)!;
      ws.send(JSON.stringify(notification));
    }

    return notification;
  }

  // Get notifications with pagination and filtering
  async getNotifications(
    playerAddress: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const {
      limit = 10,
      offset = 0,
      unreadOnly = false,
      types = []
    } = options;

    let notifications = this.notifications.get(playerAddress) || [];
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    
    if (types.length > 0) {
      notifications = notifications.filter(n => types.includes(n.type));
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      notifications: notifications.slice(offset, offset + limit),
      total: notifications.length
    };
  }

  // Mark notifications as read
  async markAsRead(
    playerAddress: string,
    notificationIds: string[]
  ): Promise<void> {
    const notifications = this.notifications.get(playerAddress) || [];
    
    notifications.forEach(notification => {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    });

    this.notifications.set(playerAddress, notifications);
  }

  // Register WebSocket connection for real-time notifications
  registerWebSocket(playerAddress: string, ws: WebSocket): void {
    this.wsConnections.set(playerAddress, ws);
    
    ws.on('close', () => {
      this.wsConnections.delete(playerAddress);
    });
  }

  // Existing notification methods updated to use new structure
  async notifyTournamentStart(tournament: Tournament): Promise<void> {
    const players = await this.getRegisteredPlayers(tournament.id);
    await Promise.all(players.map(player => 
      this.createNotification(
        'tournament_start',
        player,
        `Tournament "${tournament.name}" has started!`,
        { tournament },
        tournament.id
      )
    ));
  }

  // ... Update other existing notification methods similarly ...

  // New notification types
  async notifyGameInvite(
    sender: string,
    recipient: string,
    gameId: string,
    gameName: string
  ): Promise<void> {
    await this.createNotification(
      'game_invite',
      recipient,
      `${sender} has invited you to play ${gameName}`,
      { sender, gameId, gameName }
    );
  }

  async notifyAchievementUnlocked(
    playerAddress: string,
    achievementName: string,
    reward: string
  ): Promise<void> {
    await this.createNotification(
      'achievement_unlocked',
      playerAddress,
      `Congratulations! You've unlocked the "${achievementName}" achievement!`,
      { achievementName, reward }
    );
  }

  async notifyLevelUp(
    playerAddress: string,
    newLevel: number,
    rewards: string[]
  ): Promise<void> {
    await this.createNotification(
      'level_up',
      playerAddress,
      `Level Up! You've reached level ${newLevel}!`,
      { newLevel, rewards }
    );
  }

  async notifyRewardAvailable(
    playerAddress: string,
    rewardName: string,
    amount: string
  ): Promise<void> {
    await this.createNotification(
      'reward_available',
      playerAddress,
      `New reward available: ${rewardName} (${amount})`,
      { rewardName, amount }
    );
  }

  // Helper method to get registered players (to be implemented)
  private async getRegisteredPlayers(tournamentId: string): Promise<string[]> {
    // TODO: Implement actual player retrieval
    return [];
  }
} 