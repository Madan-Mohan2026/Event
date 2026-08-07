import { User, IUser } from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';

export async function findUserByUsername(username: string): Promise<IUser | null> {
  return await User.findOne({ username });
}

export async function verifyUserPassword(user: IUser, passwordAttempt: string): Promise<boolean> {
  return await bcrypt.compare(passwordAttempt, user.passwordHash);
}

export function generateAuthToken(user: IUser): string {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role, email: user.email },
    JWT_CONFIG.SECRET,
    { expiresIn: '7d' }
  );
}
