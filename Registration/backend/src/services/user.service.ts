import { User, IUser } from '../models/user.model';

export async function fetchAllUsers(): Promise<IUser[]> {
  return await User.find().select('-password').sort({ createdAt: -1 });
}

export async function createUserAccount(userData: Partial<IUser>): Promise<IUser> {
  const user = new User(userData);
  return await user.save();
}

export async function deleteUserAccount(id: string): Promise<IUser | null> {
  return await User.findByIdAndDelete(id);
}
