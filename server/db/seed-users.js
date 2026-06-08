/**
 * Seed Users Script
 * Creates the 2 founder accounts with bcrypt-hashed passwords.
 * Idempotent — safe to run multiple times.
 *
 * Usage: node db/seed-users.js
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');

const SALT_ROUNDS = 10;
require('dotenv').config();

const founders = [
  {
    username: 'founder1',
    password: 'founder@123',
    display_name: 'Founder 1',
  },
  {
    username: 'founder2',
    password: 'founder@123',
    display_name: 'Founder 2',
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    for (const founder of founders) {
      const hash = await bcrypt.hash(founder.password, SALT_ROUNDS);

      await User.findOneAndUpdate(
        { username: founder.username },
        { 
          password_hash: hash,
          display_name: founder.display_name
        },
        { upsert: true, new: true }
      );

      console.log(`✅ User "${founder.username}" seeded`);
    }

    console.log('\n🎉 All founder accounts seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to seed users:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
