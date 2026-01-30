import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Start negotiation
router.post('/start', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  res.json({
    message: 'Start negotiation endpoint - to be implemented'
  });
}));

// Get negotiation sessions
router.get('/sessions', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  res.json({
    message: 'Get negotiation sessions endpoint - to be implemented'
  });
}));

export default router;