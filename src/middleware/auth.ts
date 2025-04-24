import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        role: string;
      };
    }
  }
}

export const authenticate = (userService: UserService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const session = await userService.validateSession(token);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const profile = await userService.getUserProfile(session.address);
      if (!profile) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = {
        address: profile.address,
        role: profile.role
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}; 