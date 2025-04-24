import { Router } from 'express';
import { ContractService } from '../services/contracts';

const router = Router();
const contractService = new ContractService();

// Create tournament
router.post('/create', async (req, res) => {
  try {
    const { name, entryFee, maxPlayers, startTime } = req.body;
    const txHash = await contractService.createTournament(
      name,
      BigInt(entryFee),
      maxPlayers,
      new Date(startTime)
    );
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Join tournament
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { entryFee } = req.body;
    const txHash = await contractService.joinTournament(
      Number(id),
      BigInt(entryFee)
    );
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// Get tournament info
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await contractService.getTournamentInfo(Number(id));
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament info' });
  }
});

export default router; 