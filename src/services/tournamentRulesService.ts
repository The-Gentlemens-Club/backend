import { ContractService } from './contracts';
import { Tournament } from '../types/tournament';

export type TournamentCategory = {
  id: string;
  name: string;
  description: string;
  minEntryFee: bigint;
  maxEntryFee: bigint;
  minPlayers: number;
  maxPlayers: number;
  duration: number; // in hours
  prizeDistribution: PrizeDistributionRule[];
};

export type PrizeDistributionRule = {
  rank: number;
  percentage: number;
  minPlayers: number;
};

export class TournamentRulesService {
  private contractService: ContractService;
  private categories: TournamentCategory[];

  constructor() {
    this.contractService = new ContractService();
    this.categories = this.initializeCategories();
  }

  private initializeCategories(): TournamentCategory[] {
    return [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Tournaments for new players with small entry fees',
        minEntryFee: BigInt(1000000000000000), // 0.001 ETH
        maxEntryFee: BigInt(10000000000000000), // 0.01 ETH
        minPlayers: 2,
        maxPlayers: 10,
        duration: 24,
        prizeDistribution: [
          { rank: 1, percentage: 60, minPlayers: 2 },
          { rank: 2, percentage: 30, minPlayers: 4 },
          { rank: 3, percentage: 10, minPlayers: 6 }
        ]
      },
      {
        id: 'intermediate',
        name: 'Intermediate',
        description: 'Tournaments for experienced players',
        minEntryFee: BigInt(10000000000000000), // 0.01 ETH
        maxEntryFee: BigInt(100000000000000000), // 0.1 ETH
        minPlayers: 4,
        maxPlayers: 20,
        duration: 48,
        prizeDistribution: [
          { rank: 1, percentage: 50, minPlayers: 4 },
          { rank: 2, percentage: 30, minPlayers: 8 },
          { rank: 3, percentage: 15, minPlayers: 12 },
          { rank: 4, percentage: 5, minPlayers: 16 }
        ]
      },
      {
        id: 'expert',
        name: 'Expert',
        description: 'High-stakes tournaments for skilled players',
        minEntryFee: BigInt(100000000000000000), // 0.1 ETH
        maxEntryFee: BigInt(1000000000000000000), // 1 ETH
        minPlayers: 8,
        maxPlayers: 50,
        duration: 72,
        prizeDistribution: [
          { rank: 1, percentage: 40, minPlayers: 8 },
          { rank: 2, percentage: 25, minPlayers: 16 },
          { rank: 3, percentage: 15, minPlayers: 24 },
          { rank: 4, percentage: 10, minPlayers: 32 },
          { rank: 5, percentage: 5, minPlayers: 40 },
          { rank: 6, percentage: 3, minPlayers: 48 },
          { rank: 7, percentage: 2, minPlayers: 50 }
        ]
      }
    ];
  }

  async getCategories(): Promise<TournamentCategory[]> {
    return this.categories;
  }

  async getCategoryById(id: string): Promise<TournamentCategory | undefined> {
    return this.categories.find(category => category.id === id);
  }

  async validateTournamentParams(
    categoryId: string,
    entryFee: bigint,
    maxPlayers: number,
    duration: number
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const category = await this.getCategoryById(categoryId);
    const errors: string[] = [];

    if (!category) {
      errors.push('Invalid category');
      return { isValid: false, errors };
    }

    if (entryFee < category.minEntryFee || entryFee > category.maxEntryFee) {
      errors.push(`Entry fee must be between ${category.minEntryFee} and ${category.maxEntryFee}`);
    }

    if (maxPlayers < category.minPlayers || maxPlayers > category.maxPlayers) {
      errors.push(`Number of players must be between ${category.minPlayers} and ${category.maxPlayers}`);
    }

    if (duration > category.duration) {
      errors.push(`Duration cannot exceed ${category.duration} hours`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async calculatePrizeDistribution(
    categoryId: string,
    totalPrizePool: bigint,
    playerCount: number
  ): Promise<{ rank: number; amount: bigint }[]> {
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      throw new Error('Invalid category');
    }

    return category.prizeDistribution
      .filter(rule => playerCount >= rule.minPlayers)
      .map(rule => ({
        rank: rule.rank,
        amount: (totalPrizePool * BigInt(Math.floor(rule.percentage * 100))) / BigInt(10000)
      }));
  }

  async getRecommendedCategory(
    playerAddress: string,
    playerStats: {
      totalGames: number;
      winRate: number;
      averageBet: bigint;
    }
  ): Promise<TournamentCategory | undefined> {
    const categories = await this.getCategories();
    
    // Determine player level based on stats
    let recommendedCategory: TournamentCategory | undefined;
    
    if (playerStats.totalGames < 10 || playerStats.winRate < 0.3) {
      recommendedCategory = categories.find(c => c.id === 'beginner');
    } else if (playerStats.totalGames < 50 || playerStats.winRate < 0.5) {
      recommendedCategory = categories.find(c => c.id === 'intermediate');
    } else {
      recommendedCategory = categories.find(c => c.id === 'expert');
    }

    // Adjust based on average bet
    if (recommendedCategory) {
      const playerBet = playerStats.averageBet;
      if (playerBet < recommendedCategory.minEntryFee) {
        recommendedCategory = categories.find(c => 
          c.minEntryFee <= playerBet && c.maxEntryFee >= playerBet
        );
      }
    }

    return recommendedCategory;
  }
} 