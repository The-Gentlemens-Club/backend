import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import gameRoutes from './routes/game';
import tokenRoutes from './routes/token';
import tournamentRoutes from './routes/tournaments';
import statsRoutes from './routes/stats';
import notificationRoutes from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';
import { initWebSocket } from './routes/notifications';
import { achievementRouter } from './routes/achievements';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSocket server
initWebSocket(server);

// Routes
app.use('/api/game', gameRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/achievements', achievementRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    error: 'Route not found'
  });
});

// Constants
const PORT = process.env.PORT || 3001;

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 