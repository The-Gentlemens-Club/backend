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

// Create tournament
router.post('/tournament', authenticate(userService), async (req, res) => {
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

    const tournamentId = await contractService.createTournament(
      name,
      description,
      new Date(startTime),
      BigInt(entryFee),
      BigInt(prizePool),
      minPlayers,
      maxPlayers,
      rules
    );

    res.json({ tournamentId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Get tournament
router.get('/tournament/:id', async (req, res) => {
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

// Get tournament players
router.get('/tournament/:id/players', async (req, res) => {
  try {
    const players = await contractService.getRegisteredPlayers(BigInt(req.params.id));
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament players' });
  }
});

// Get tournament winners
router.get('/tournament/:id/winners', async (req, res) => {
  try {
    const winners = await contractService.getTournamentWinners(BigInt(req.params.id));
    res.json(winners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament winners' });
  }
});

// Get player stats
router.get('/player/:address/stats', async (req, res) => {
  try {
    const stats = await contractService.getPlayerStats(req.params.address);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player stats' });
  }
});

// Get tournament leaderboard
router.get('/tournament/:id/leaderboard', async (req, res) => {
  try {
    const leaderboard = await contractService.getTournamentLeaderboard(BigInt(req.params.id));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament leaderboard' });
  }
});

export default router; 