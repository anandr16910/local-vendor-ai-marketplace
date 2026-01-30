import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Initiate payment
router.post('/initiate', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  res.json({
    message: 'Initiate payment endpoint - to be implemented'
  });
}));

// Verify payment
router.post('/verify', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  res.json({
    message: 'Verify payment endpoint - to be implemented'
  });
}));

export default router;