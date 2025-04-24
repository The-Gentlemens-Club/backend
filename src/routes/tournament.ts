import { Router } from 'express';
import { ContractService } from '../services/contractService';
import { UserService } from '../services/userService';
import { NotificationService } from '../services/notificationService';
import { authenticate } from '../middleware/auth';
import { config } from '../config';

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

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await contractService.getTournaments();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournaments' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await contractService.getTournament(BigInt(req.params.id));
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament' });
  }
});

// Create new tournament
router.post('/', authenticate(userService), async (req, res) => {
  try {
    const { entryFee, maxPlayers, startTime, endTime } = req.body;
    const txHash = await contractService.createTournament(
      BigInt(entryFee),
      maxPlayers,
      new Date(startTime),
      new Date(endTime)
    );
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Join tournament
router.post('/:id/join', authenticate(userService), async (req, res) => {
  try {
    const txHash = await contractService.joinTournament(BigInt(req.params.id));
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// Get tournament leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const leaderboard = await contractService.getTournamentLeaderboard(BigInt(req.params.id));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament leaderboard' });
  }
});

// Get tournament winners
router.get('/:id/winners', async (req, res) => {
  try {
    const winners = await contractService.getTournamentWinners(BigInt(req.params.id));
    res.json(winners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament winners' });
  }
});

export default router; 