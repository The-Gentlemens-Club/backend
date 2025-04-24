import { TournamentRules } from '../types/tournament';

export class TournamentRulesService {
  private rules: Map<string, TournamentRules>;

  constructor() {
    this.rules = new Map<string, TournamentRules>();
  }

  public setRules(tournamentId: string, rules: TournamentRules): void {
    if (!this.validateRules(rules)) {
      throw new Error('Invalid tournament rules');
    }
    this.rules.set(tournamentId, rules);
  }

  public getRules(tournamentId: string): TournamentRules | undefined {
    return this.rules.get(tournamentId);
  }

  public validateRules(rules: TournamentRules): boolean {
    // Basic validation
    if (rules.minPlayers < 2 || rules.maxPlayers < rules.minPlayers) {
      return false;
    }

    if (rules.entryFee < BigInt(0) || rules.prizePool < rules.entryFee) {
      return false;
    }

    if (rules.minBet < BigInt(0) || rules.maxBet < rules.minBet) {
      return false;
    }

    if (rules.timeLimit < 0 || rules.maxRounds < 1) {
      return false;
    }

    // Time validation if provided
    if (rules.startTime && rules.endTime) {
      const start = new Date(rules.startTime);
      const end = new Date(rules.endTime);
      if (start >= end) {
        return false;
      }
    }

    return true;
  }

  public updateRules(tournamentId: string, updates: Partial<TournamentRules>): void {
    const currentRules = this.getRules(tournamentId);
    if (!currentRules) {
      throw new Error('Tournament rules not found');
    }

    const updatedRules = { ...currentRules, ...updates };
    if (!this.validateRules(updatedRules)) {
      throw new Error('Invalid tournament rules update');
    }

    this.rules.set(tournamentId, updatedRules);
  }

  public deleteRules(tournamentId: string): void {
    this.rules.delete(tournamentId);
  }

  public listRules(): Map<string, TournamentRules> {
    return new Map(this.rules);
  }

  public getDefaultRules(): TournamentRules {
    return {
      minPlayers: 2,
      maxPlayers: 10,
      entryFee: BigInt(100),
      prizePool: BigInt(1000),
      minBet: BigInt(10),
      maxBet: BigInt(100),
      timeLimit: 3600, // 1 hour in seconds
      maxRounds: 100,
      allowRebuys: false
    };
  }
} 