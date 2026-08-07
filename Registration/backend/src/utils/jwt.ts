import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_CONFIG.SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_CONFIG.SECRET);
}
