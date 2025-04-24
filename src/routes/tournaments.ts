import express from 'express';
import { ContractService } from '../services/contracts';
import { TournamentService } from '../services/tournamentService';
import { TournamentRulesService } from '../services/tournamentRulesService';
import { NotificationService } from '../services/notificationService';
import { TournamentHistoryService } from '../services/tournamentHistoryService';
import { PlayerStatsService } from '../services/playerStatsService';
import { Tournament, TournamentStatus } from '../types/tournament';

const router = express.Router();
const contractService = new ContractService();
const tournamentService = new TournamentService();
const rulesService = new TournamentRulesService();
const notificationService = new NotificationService();
const historyService = new TournamentHistoryService();
const playerStatsService = new PlayerStatsService();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await contractService.getTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting tournaments:', error);
    res.status(500).json({ error: 'Failed to get tournaments' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const tournament = await contractService.getTournamentInfo(tournamentId);
    res.json(tournament);
  } catch (error) {
    console.error('Error getting tournament:', error);
    res.status(500).json({ error: 'Failed to get tournament' });
  }
});

// Create new tournament
router.post('/', async (req, res) => {
  try {
    const { name, entryFee, prizePool, startTime } = req.body;
    const tournamentId = await contractService.createTournament(
      name,
      BigInt(entryFee),
      BigInt(prizePool),
      new Date(startTime)
    );
    res.json({ tournamentId });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Join tournament
router.post('/:id/join', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { playerAddress } = req.body;
    await contractService.joinTournament(tournamentId, playerAddress);
    res.json({ success: true });
  } catch (error) {
    console.error('Error joining tournament:', error);
    res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// Get tournament players
router.get('/:id/players', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const players = await contractService.getRegisteredPlayers(tournamentId);
    res.json(players);
  } catch (error) {
    console.error('Error getting tournament players:', error);
    res.status(500).json({ error: 'Failed to get tournament players' });
  }
});

// Get tournament winners
router.get('/:id/winners', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const winners = await contractService.getTournamentWinners(tournamentId);
    res.json(winners);
  } catch (error) {
    console.error('Error getting tournament winners:', error);
    res.status(500).json({ error: 'Failed to get tournament winners' });
  }
});

// Get active tournaments
router.get('/active', async (req, res) => {
  try {
    const tournaments = await contractService.getActiveTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting active tournaments:', error);
    res.status(500).json({ error: 'Failed to get active tournaments' });
  }
});

// Get upcoming tournaments
router.get('/upcoming', async (req, res) => {
  try {
    const tournaments = await contractService.getUpcomingTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting upcoming tournaments:', error);
    res.status(500).json({ error: 'Failed to get upcoming tournaments' });
  }
});

// Get completed tournaments
router.get('/completed', async (req, res) => {
  try {
    const tournaments = await contractService.getCompletedTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting completed tournaments:', error);
    res.status(500).json({ error: 'Failed to get completed tournaments' });
  }
});

// Get player's tournaments
router.get('/player/:address', async (req, res) => {
  try {
    const tournaments = await contractService.getPlayerTournaments(req.params.address);
    res.json(tournaments);
  } catch (error) {
    console.error('Error getting player tournaments:', error);
    res.status(500).json({ error: 'Failed to get player tournaments' });
  }
});

// Get tournament leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const leaderboard = await contractService.getTournamentLeaderboard(tournamentId);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting tournament leaderboard:', error);
    res.status(500).json({ error: 'Failed to get tournament leaderboard' });
  }
});

// Update tournament status
router.post('/:id/update-status', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    await contractService.updateTournamentStatus(tournamentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tournament status:', error);
    res.status(500).json({ error: 'Failed to update tournament status' });
  }
});

// Distribute tournament prizes
router.post('/:id/distribute-prizes', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    await contractService.distributePrizes(tournamentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error distributing prizes:', error);
    res.status(500).json({ error: 'Failed to distribute prizes' });
  }
});

// Get tournament statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const stats = await contractService.getTournamentStats(tournamentId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting tournament stats:', error);
    res.status(500).json({ error: 'Failed to get tournament stats' });
  }
});

// Schedule tournament
router.post('/schedule', async (req, res) => {
  try {
    const { name, entryFee, maxPlayers, startTime, duration } = req.body;
    const tournamentId = await tournamentService.scheduleTournament(
      name,
      BigInt(entryFee),
      maxPlayers,
      new Date(startTime),
      duration
    );
    res.json({ tournamentId });
  } catch (error) {
    console.error('Error scheduling tournament:', error);
    res.status(500).json({ error: 'Failed to schedule tournament' });
  }
});

// Get tournament analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const analytics = await tournamentService.getTournamentAnalytics(tournamentId);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting tournament analytics:', error);
    res.status(500).json({ error: 'Failed to get tournament analytics' });
  }
});

// Get tournament schedule
router.get('/schedule', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const schedule = await tournamentService.getTournamentSchedule(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json(schedule);
  } catch (error) {
    console.error('Error getting tournament schedule:', error);
    res.status(500).json({ error: 'Failed to get tournament schedule' });
  }
});

// Get tournament recommendations
router.get('/recommendations/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit } = req.query;
    const recommendations = await tournamentService.getTournamentRecommendations(
      address,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting tournament recommendations:', error);
    res.status(500).json({ error: 'Failed to get tournament recommendations' });
  }
});

// Get player rankings
router.get('/:id/rankings', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { limit } = req.query;
    const rankings = await tournamentService.getPlayerRankings(
      tournamentId,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(rankings);
  } catch (error) {
    console.error('Error getting player rankings:', error);
    res.status(500).json({ error: 'Failed to get player rankings' });
  }
});

// Get tournament categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await rulesService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting tournament categories:', error);
    res.status(500).json({ error: 'Failed to get tournament categories' });
  }
});

// Get category by ID
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await rulesService.getCategoryById(req.params.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (error) {
    console.error('Error getting tournament category:', error);
    res.status(500).json({ error: 'Failed to get tournament category' });
  }
});

// Validate tournament parameters
router.post('/validate', async (req, res) => {
  try {
    const { categoryId, entryFee, maxPlayers, duration } = req.body;
    const validation = await rulesService.validateTournamentParams(
      categoryId,
      BigInt(entryFee),
      maxPlayers,
      duration
    );
    res.json(validation);
  } catch (error) {
    console.error('Error validating tournament parameters:', error);
    res.status(500).json({ error: 'Failed to validate tournament parameters' });
  }
});

// Calculate prize distribution
router.get('/:id/prize-distribution', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const tournament = await contractService.getTournamentInfo(tournamentId);
    const players = await contractService.getRegisteredPlayers(tournamentId);
    
    const distribution = await rulesService.calculatePrizeDistribution(
      tournament.categoryId,
      tournament.prizePool,
      players.length
    );
    
    res.json(distribution);
  } catch (error) {
    console.error('Error calculating prize distribution:', error);
    res.status(500).json({ error: 'Failed to calculate prize distribution' });
  }
});

// Get recommended category
router.get('/recommend-category/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const playerStats = await contractService.getPlayerStats(address);
    
    const category = await rulesService.getRecommendedCategory(address, {
      totalGames: playerStats.totalGames,
      winRate: playerStats.winRate,
      averageBet: playerStats.averageBet
    });
    
    if (category) {
      await notificationService.notifyCategoryRecommendation(address, category);
    }
    
    res.json({ category });
  } catch (error) {
    console.error('Error getting recommended category:', error);
    res.status(500).json({ error: 'Failed to get recommended category' });
  }
});

// Get tournament notifications
router.get('/:id/notifications', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const { limit } = req.query;
    const notifications = await notificationService.getTournamentNotifications(
      tournamentId,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error getting tournament notifications:', error);
    res.status(500).json({ error: 'Failed to get tournament notifications' });
  }
});

// Update tournament with category
router.post('/create-with-category', async (req, res) => {
  try {
    const { name, categoryId, entryFee, maxPlayers, startTime, duration } = req.body;
    
    // Validate parameters
    const validation = await rulesService.validateTournamentParams(
      categoryId,
      BigInt(entryFee),
      maxPlayers,
      duration
    );
    
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.errors });
      return;
    }
    
    // Create tournament
    const tournamentId = await tournamentService.scheduleTournament(
      name,
      BigInt(entryFee),
      maxPlayers,
      new Date(startTime),
      duration
    );
    
    // Notify registration open
    const tournament = await contractService.getTournamentInfo(Number(tournamentId));
    await notificationService.notifyRegistrationOpen(tournament);
    
    res.json({ tournamentId });
  } catch (error) {
    console.error('Error creating tournament with category:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Record tournament history
router.post('/:id/record', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    await historyService.recordTournament(tournamentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording tournament history:', error);
    res.status(500).json({ error: 'Failed to record tournament history' });
  }
});

// Get tournament history
router.get('/:id/history', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const history = await historyService.getTournamentHistory(tournamentId);
    if (!history) {
      res.status(404).json({ error: 'Tournament history not found' });
      return;
    }
    res.json(history);
  } catch (error) {
    console.error('Error getting tournament history:', error);
    res.status(500).json({ error: 'Failed to get tournament history' });
  }
});

// Get player tournament history
router.get('/player/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit } = req.query;
    const history = await historyService.getPlayerTournamentHistory(
      address,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(history);
  } catch (error) {
    console.error('Error getting player tournament history:', error);
    res.status(500).json({ error: 'Failed to get player tournament history' });
  }
});

// Get tournament statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await historyService.getTournamentStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting tournament statistics:', error);
    res.status(500).json({ error: 'Failed to get tournament statistics' });
  }
});

// Get tournament trends
router.get('/trends', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const trends = await historyService.getTournamentTrends(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json(trends);
  } catch (error) {
    console.error('Error getting tournament trends:', error);
    res.status(500).json({ error: 'Failed to get tournament trends' });
  }
});

// Get player stats
router.get('/player/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await playerStatsService.getPlayerStats(address);
    res.json(stats);
  } catch (error) {
    console.error('Error getting player stats:', error);
    res.status(500).json({ error: 'Failed to get player stats' });
  }
});

// Get player achievements
router.get('/player/:address/achievements', async (req, res) => {
  try {
    const { address } = req.params;
    const achievements = await playerStatsService.getPlayerAchievements(address);
    res.json(achievements);
  } catch (error) {
    console.error('Error getting player achievements:', error);
    res.status(500).json({ error: 'Failed to get player achievements' });
  }
});

// Get player progress
router.get('/player/:address/progress', async (req, res) => {
  try {
    const { address } = req.params;
    const progress = await playerStatsService.getPlayerProgress(address);
    res.json(progress);
  } catch (error) {
    console.error('Error getting player progress:', error);
    res.status(500).json({ error: 'Failed to get player progress' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = await playerStatsService.getLeaderboard(
      limit ? parseInt(limit as string) : undefined
    );
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router; 