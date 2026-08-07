import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { connectDB } from './config/db';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to test MongoDB database.');

    const username = 'superadmin';
    const email = 'superadmin@rtih';
    const password = 'superadmin123';

    // Clean up existing records with the same email/username to avoid duplicates
    await User.deleteOne({ email });
    await User.deleteOne({ username });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = new User({
      username,
      email,
      passwordHash,
      role: 'super_admin'
    });

    await admin.save();
    console.log(`Seeded admin user successfully:`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
