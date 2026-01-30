import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPostgresPool } from '../config/database';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    userType: string;
    email?: string;
    phoneNumber: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists in database
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT user_id, user_type, email, phone_number FROM users WHERE user_id = $1 AND is_verified = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw createError('Invalid token. User not found.', 401);
    }

    req.user = {
      userId: result.rows[0].user_id,
      userType: result.rows[0].user_type,
      email: result.rows[0].email,
      phoneNumber: result.rows[0].phone_number,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token:', error.message);
      return next(createError('Invalid token.', 401));
    }
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.userType)) {
      return next(createError('Insufficient permissions.', 403));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT user_id, user_type, email, phone_number FROM users WHERE user_id = $1 AND is_verified = true',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = {
        userId: result.rows[0].user_id,
        userType: result.rows[0].user_type,
        email: result.rows[0].email,
        phoneNumber: result.rows[0].phone_number,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};