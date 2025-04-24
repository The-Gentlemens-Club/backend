import { Router } from 'express';
import { ContractService } from '../services/contractService';
import { authenticate, requireRole } from '../middleware/auth';
import { UserService } from '../services/userService';

const router = Router();

export const initContractRoutes = (contractService: ContractService, userService: UserService) => {
  const auth = authenticate(userService);

  // Tournament routes
  router.post('/tournaments', auth, requireRole(['admin']), async (req, res) => {
    try {
      const { name, entryFee, startTime } = req.body;
      const privateKey = process.env.ADMIN_PRIVATE_KEY;

      if (!privateKey) {
        throw new Error('Admin private key not configured');
      }

      const txHash = await contractService.createTournament(
        privateKey,
        name,
        BigInt(entryFee),
        new Date(startTime)
      );

      res.json({ txHash });
    } catch (error) {
      console.error('Create tournament error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create tournament' });
    }
  });

  router.post('/tournaments/:id/join', auth, async (req, res) => {
    try {
      const { id } = req.params;
      const { entryFee } = req.body;
      const privateKey = req.headers['x-private-key'] as string;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      const txHash = await contractService.joinTournament(
        privateKey,
        BigInt(id),
        BigInt(entryFee)
      );

      res.json({ txHash });
    } catch (error) {
      console.error('Join tournament error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to join tournament' });
    }
  });

  router.get('/tournaments/:id', auth, async (req, res) => {
    try {
      const { id } = req.params;
      const tournament = await contractService.getTournament(BigInt(id));
      res.json(tournament);
    } catch (error) {
      console.error('Get tournament error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get tournament' });
    }
  });

  router.get('/tournaments/:id/players', auth, async (req, res) => {
    try {
      const { id } = req.params;
      const players = await contractService.getTournamentPlayers(BigInt(id));
      res.json(players);
    } catch (error) {
      console.error('Get tournament players error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get tournament players' });
    }
  });

  router.post('/tournaments/:id/distribute', auth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const privateKey = process.env.ADMIN_PRIVATE_KEY;

      if (!privateKey) {
        throw new Error('Admin private key not configured');
      }

      const txHash = await contractService.distributePrizes(privateKey, BigInt(id));
      res.json({ txHash });
    } catch (error) {
      console.error('Distribute prizes error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to distribute prizes' });
    }
  });

  // Game routes
  router.post('/games/play', auth, async (req, res) => {
    try {
      const { betAmount } = req.body;
      const privateKey = req.headers['x-private-key'] as string;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      const txHash = await contractService.playGame(privateKey, BigInt(betAmount));
      res.json({ txHash });
    } catch (error) {
      console.error('Play game error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to play game' });
    }
  });

  router.get('/games/history', auth, async (req, res) => {
    try {
      const history = await contractService.getGameHistory(req.user!.address);
      res.json(history);
    } catch (error) {
      console.error('Get game history error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get game history' });
    }
  });

  router.get('/games/last', auth, async (req, res) => {
    try {
      const lastPlayed = await contractService.getLastGamePlayed(req.user!.address);
      res.json({ lastPlayed });
    } catch (error) {
      console.error('Get last game error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get last game' });
    }
  });

  router.get('/games/:id/outcome', auth, async (req, res) => {
    try {
      const { id } = req.params;
      const outcome = await contractService.getGameOutcome(BigInt(id));
      res.json({ outcome });
    } catch (error) {
      console.error('Get game outcome error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to get game outcome' });
    }
  });

  return router;
}; 