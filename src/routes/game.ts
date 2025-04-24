import { Router } from 'express';
import { ContractService } from '../services/contracts';

const router = Router();
const contractService = new ContractService();

// Get game state
router.get('/state/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const state = await contractService.getGameState(address);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Start game
router.post('/start', async (req, res) => {
  try {
    const txHash = await contractService.startGame();
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Place bet
router.post('/bet', async (req, res) => {
  try {
    const { amount } = req.body;
    const txHash = await contractService.placeBet(BigInt(amount));
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

export default router; 