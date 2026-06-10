import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { db } from '../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'tinywins_secret_grace_growth_rhythm_321';

// Extend Express Request object to hold user details
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email?: string;
      };
    }
  }
}

// JWT verification middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string; email?: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
}

// Utility to write security audit logs
export async function logSecurityEvent(userId: string | undefined, action: string, req: Request) {
  const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const user_agent = req.headers['user-agent'] || 'Unknown';

  try {
    await db.auditLogs.create({
      user_id: userId || '',
      action,
      ip_address,
      user_agent
    });
  } catch (err) {
    console.error("Failed to write security audit log:", err);
  }
}

// Generic validation middleware using Zod schemas
export const validateBody = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err: any) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors ? err.errors.map((e: any) => e.message) : err.message
    });
  }
};
