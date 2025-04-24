import { Router } from 'express';
import { ContractService } from '../services/contracts';

const router = Router();
const contractService = new ContractService();

// Get player stats
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await contractService.getPlayerStats(address);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player stats' });
  }
});

// Get player game history
router.get('/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const { offset = '0', limit = '10' } = req.query;
    const history = await contractService.getPlayerHistory(
      address,
      Number(offset),
      Number(limit)
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player history' });
  }
});

// Get leaderboard
router.get('/leaderboard/global', async (req, res) => {
  try {
    // This would need to be implemented in the smart contract
    // For now, we'll return a 501 Not Implemented
    res.status(501).json({ error: 'Leaderboard not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router; 