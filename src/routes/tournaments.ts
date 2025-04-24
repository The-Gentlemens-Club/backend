import { Router } from 'express';
import { ContractService } from '../services/contractService';
import { PlayerStatsService } from '../services/playerStatsService';
import { TournamentHistoryService } from '../services/tournamentHistoryService';
import { NotificationService } from '../services/notificationService';
import { UserService } from '../services/userService';
import { config } from '../config';
import { authenticate } from '../middleware/auth';

const router = Router();

const notificationService = new NotificationService();
const userService = new UserService(notificationService);
const contractService = new ContractService(
  config.rpcUrl,
  config.tournamentContractAddress,
  config.gameContractAddress,
  userService,
  notificationService,
  config.jwtSecret
);
const playerStatsService = new PlayerStatsService(contractService);
const historyService = new TournamentHistoryService();

// Create tournament
router.post('/', authenticate(userService), async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      entryFee,
      prizePool,
      minPlayers,
      maxPlayers,
      rules
    } = req.body;

    const tournament = await contractService.createTournament(
      name,
      description,
      new Date(startTime),
      BigInt(entryFee),
      BigInt(prizePool),
      minPlayers,
      maxPlayers,
      rules
    );

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { limit, offset, active, completed } = req.query;
    const tournaments = await historyService.getAllTournaments({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      active: active === 'true',
      completed: completed === 'true'
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournaments' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await historyService.getTournamentHistory(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament' });
  }
});

// Join tournament
router.post('/:id/join', authenticate(userService), async (req, res) => {
  try {
    const { id } = req.params;
    const { betAmount } = req.body;
    const result = await contractService.joinTournament(id, BigInt(betAmount));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// Get tournament stats
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await historyService.getTournamentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament stats' });
  }
});

// Get tournament history
router.get('/:id/history', async (req, res) => {
  try {
    const history = await historyService.getTournamentHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament history' });
  }
});

// Get player tournament history
router.get('/player/:address/history', async (req, res) => {
  try {
    const history = await historyService.getPlayerHistory(req.params.address);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player tournament history' });
  }
});

export default router; 