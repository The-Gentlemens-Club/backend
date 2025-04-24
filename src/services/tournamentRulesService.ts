import { TournamentRules } from '../types/tournament';

export class TournamentRulesService {
  private rules: Map<string, TournamentRules> = new Map();

  constructor() {}

  public async setRules(tournamentId: string, rules: TournamentRules): Promise<void> {
    this.rules.set(tournamentId, rules);
  }

  public async getRules(tournamentId: string): Promise<TournamentRules | null> {
    return this.rules.get(tournamentId) || null;
  }

  public async validateRules(rules: TournamentRules): Promise<boolean> {
    if (!rules.minPlayers || !rules.maxPlayers) {
      return false;
    }

    if (rules.minPlayers < 2 || rules.maxPlayers < rules.minPlayers) {
      return false;
    }

    if (rules.entryFee < 0n) {
      return false;
    }

    if (rules.prizePool < 0n) {
      return false;
    }

    if (rules.startTime && rules.endTime && rules.startTime >= rules.endTime) {
      return false;
    }

    return true;
  }

  public async updateRules(tournamentId: string, updates: Partial<TournamentRules>): Promise<TournamentRules | null> {
    const currentRules = await this.getRules(tournamentId);
    if (!currentRules) {
      return null;
    }

    const updatedRules: TournamentRules = {
      ...currentRules,
      ...updates
    };

    if (!(await this.validateRules(updatedRules))) {
      return null;
    }

    await this.setRules(tournamentId, updatedRules);
    return updatedRules;
  }

  public async deleteRules(tournamentId: string): Promise<boolean> {
    return this.rules.delete(tournamentId);
  }

  public async listRules(): Promise<Map<string, TournamentRules>> {
    return new Map(this.rules);
  }
} 