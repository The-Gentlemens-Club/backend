import { Notification, NotificationType, NotificationPreference } from '../types/user';
import { WebSocket } from 'ws';

export class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();
  private preferences: Map<string, NotificationPreference[]> = new Map();
  private webSockets: Map<string, WebSocket> = new Map();

  constructor() {
    this.initializeDefaultPreferences();
  }

  private initializeDefaultPreferences(): void {
    const defaultPreferences: NotificationPreference[] = [
      { type: NotificationType.GAME_RESULT, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.TOURNAMENT_JOINED, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.TOURNAMENT_STARTED, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.TOURNAMENT_ENDED, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.TOURNAMENT_WON, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.ACHIEVEMENT_UNLOCKED, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.LEVEL_UP, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.REWARD_CLAIMED, enabled: true, email: false, push: false, inApp: true },
      { type: NotificationType.SYSTEM, enabled: true, email: false, push: false, inApp: true }
    ];

    this.preferences.set('default', defaultPreferences);
  }

  public registerWebSocket(playerAddress: string, ws: WebSocket): void {
    this.webSockets.set(playerAddress, ws);
  }

  public async getNotifications(
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

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      notifications: notifications.slice(offset, offset + limit),
      total: notifications.length
    };
  }

  public async markAsRead(playerAddress: string, notificationIds: string[]): Promise<void> {
    const notifications = this.notifications.get(playerAddress) || [];
    
    notifications.forEach(notification => {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    });

    this.notifications.set(playerAddress, notifications);
  }

  public async notifyGameResult(playerAddress: string, gameId: string, outcome: string): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.GAME_RESULT,
      recipientAddress: playerAddress,
      title: 'Game Result',
      message: `Your game ${gameId} resulted in a ${outcome}`,
      data: { gameId, outcome },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification(playerAddress, notification);
  }

  public async notifyTournamentJoined(playerAddress: string, tournamentId: string): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.TOURNAMENT_JOINED,
      recipientAddress: playerAddress,
      title: 'Tournament Joined',
      message: `You have joined tournament ${tournamentId}`,
      data: { tournamentId },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification(playerAddress, notification);
  }

  public async notifyTournamentWon(playerAddress: string, tournamentId: string, prize: string): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.TOURNAMENT_WON,
      recipientAddress: playerAddress,
      title: 'Tournament Victory',
      message: `Congratulations! You won tournament ${tournamentId} and earned ${prize}`,
      data: { tournamentId, prize },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification(playerAddress, notification);
  }

  public async notifyAchievementUnlocked(playerAddress: string, achievement: any, reward: string): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      recipientAddress: playerAddress,
      title: 'Achievement Unlocked',
      message: `You unlocked the ${achievement.name} achievement!`,
      data: { achievement, reward },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification(playerAddress, notification);
  }

  public async notifyLevelUp(playerAddress: string, level: number, rewards: string[]): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.LEVEL_UP,
      recipientAddress: playerAddress,
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${level}!`,
      data: { level, rewards },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification(playerAddress, notification);
  }

  public async notifyCategoryRecommendation(playerAddress: string, category: string): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.SYSTEM,
      recipientAddress: playerAddress,
      title: 'Category Recommendation',
      message: `We recommend trying the ${category} category based on your play style`,
      data: { category },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification(playerAddress, notification);
  }

  public async notifyRegistrationOpen(tournament: any): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.TOURNAMENT_STARTED,
      recipientAddress: 'all',
      title: 'Tournament Registration Open',
      message: `Registration is now open for tournament ${tournament.name}`,
      data: { tournament },
      read: false,
      createdAt: new Date()
    };

    await this.sendNotification('all', notification);
  }

  private async sendNotification(playerAddress: string, notification: Notification): Promise<void> {
    // Store notification
    const playerNotifications = this.notifications.get(playerAddress) || [];
    playerNotifications.push(notification);
    this.notifications.set(playerAddress, playerNotifications);

    // Send via WebSocket if available
    const ws = this.webSockets.get(playerAddress);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    }
  }

  public async getPlayerNotifications(playerAddress: string): Promise<Notification[]> {
    return this.notifications.get(playerAddress) || [];
  }

  public async getTournamentNotifications(tournamentId: string): Promise<Notification[]> {
    const allNotifications: Notification[] = [];
    this.notifications.forEach(notifications => {
      notifications.forEach(notification => {
        if (notification.data?.tournamentId === tournamentId) {
          allNotifications.push(notification);
        }
      });
    });
    return allNotifications;
  }

  public async getPlayerPreferences(playerAddress: string): Promise<NotificationPreference[]> {
    return this.preferences.get(playerAddress) || this.preferences.get('default') || [];
  }

  public async updatePreferences(
    playerAddress: string,
    preferences: NotificationPreference[]
  ): Promise<void> {
    this.preferences.set(playerAddress, preferences);
  }
} 