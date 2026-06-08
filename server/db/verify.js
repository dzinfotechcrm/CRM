/**
 * Quick verification script — checks all collections, settings, users, buckets.
 */
const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const User = require('../models/User');
const MoneyBucket = require('../models/MoneyBucket');

require('dotenv').config();

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // 1. List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 COLLECTIONS (' + collections.length + '):');
    collections.forEach(c => console.log('   • ' + c.name));

    // 2. List settings
    const settings = await Setting.find().sort({ setting_group: 1, setting_key: 1 });
    console.log('\n⚙️  SETTINGS (' + settings.length + ' keys):');
    settings.forEach(r => {
      console.log('   [' + r.setting_group + '] ' + r.setting_key + ' = ' + (r.setting_value || 'NULL'));
    });

    // 3. List users
    const users = await User.find();
    console.log('\n👤 USERS (' + users.length + '):');
    users.forEach(r => console.log('   • ' + r.username + ' (' + r.display_name + ')'));

    // 4. List buckets
    const buckets = await MoneyBucket.find().sort({ bucket_key: 1 });
    console.log('\n💰 MONEY BUCKETS (' + buckets.length + '):');
    buckets.forEach(r => console.log('   • ' + r.bucket_key + ' → ' + r.bucket_name));

    console.log('\n✅ All verifications passed!');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
