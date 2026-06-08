/**
 * Seed Script
 * Idempotently seeds initial Settings, Money Buckets, and Founder Users into MongoDB.
 *
 * Usage: node db/seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Setting = require('../models/Setting');
const MoneyBucket = require('../models/MoneyBucket');
const User = require('../models/User');

require('dotenv').config();

const SALT_ROUNDS = 10;

const initialSettings = [
  // project_splits
  { setting_key: 'project_split_reserve_pct', setting_value: null, setting_label: 'Reserve %', setting_group: 'project_splits' },
  { setting_key: 'project_split_profit_pct', setting_value: null, setting_label: 'Profit %', setting_group: 'project_splits' },
  { setting_key: 'project_split_dues_pct', setting_value: null, setting_label: 'Dues %', setting_group: 'project_splits' },
  
  // saas_plans (monthly)
  { setting_key: 'plan_monthly_price', setting_value: null, setting_label: 'Monthly Plan — Price', setting_group: 'saas_plans' },
  { setting_key: 'plan_monthly_expense_total', setting_value: null, setting_label: 'Monthly Plan — Total Expense', setting_group: 'saas_plans' },
  { setting_key: 'plan_monthly_expense_technical', setting_value: null, setting_label: 'Monthly Plan — Technical Expense', setting_group: 'saas_plans' },
  { setting_key: 'plan_monthly_expense_physical', setting_value: null, setting_label: 'Monthly Plan — Physical Expense', setting_group: 'saas_plans' },
  { setting_key: 'plan_monthly_expense_misc', setting_value: null, setting_label: 'Monthly Plan — Misc Expense', setting_group: 'saas_plans' },
  
  // saas_plans (annual)
  { setting_key: 'plan_annual_price', setting_value: null, setting_label: 'Annual Plan — Price', setting_group: 'saas_plans' },
  { setting_key: 'plan_annual_expense_total', setting_value: null, setting_label: 'Annual Plan — Total Expense', setting_group: 'saas_plans' },
  { setting_key: 'plan_annual_expense_technical', setting_value: null, setting_label: 'Annual Plan — Technical Expense', setting_group: 'saas_plans' },
  { setting_key: 'plan_annual_expense_physical', setting_value: null, setting_label: 'Annual Plan — Physical Expense', setting_group: 'saas_plans' },
  { setting_key: 'plan_annual_expense_misc', setting_value: null, setting_label: 'Annual Plan — Misc Expense', setting_group: 'saas_plans' },

  // goals
  { setting_key: 'goal_monthly_revenue_target', setting_value: null, setting_label: 'Monthly Revenue Target (₹)', setting_group: 'goals' },
  { setting_key: 'goal_monthly_revenue_deadline', setting_value: null, setting_label: 'Monthly Revenue Deadline', setting_group: 'goals' },
  { setting_key: 'goal_reserve_target', setting_value: null, setting_label: 'Reserve Fund Target (₹)', setting_group: 'goals' },
  { setting_key: 'goal_dues_target', setting_value: null, setting_label: 'Dues Clearance Target (₹)', setting_group: 'goals' },
  { setting_key: 'goal_founder_profit_monthly', setting_value: null, setting_label: 'Monthly Founder Profit Target (₹)', setting_group: 'goals' },

  // founders
  { setting_key: 'founder1_name', setting_value: null, setting_label: 'Founder 1 Name', setting_group: 'founders' },
  { setting_key: 'founder2_name', setting_value: null, setting_label: 'Founder 2 Name', setting_group: 'founders' }
];

const initialBuckets = [
  { bucket_key: 'reserve', bucket_name: 'Reserve Fund' },
  { bucket_key: 'profit', bucket_name: 'Founder Profit' },
  { bucket_key: 'dues', bucket_name: 'Pending Dues' }
];

const founders = [
  { username: 'founder1', password: 'founder@123', display_name: 'Founder 1' },
  { username: 'founder2', password: 'founder@123', display_name: 'Founder 2' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db');
    console.log('✅ Connected to MongoDB');

    console.log('--- Seeding Settings ---');
    for (const setting of initialSettings) {
      await Setting.findOneAndUpdate(
        { setting_key: setting.setting_key },
        { $setOnInsert: setting },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${initialSettings.length} settings.`);

    console.log('--- Seeding Money Buckets ---');
    for (const bucket of initialBuckets) {
      await MoneyBucket.findOneAndUpdate(
        { bucket_key: bucket.bucket_key },
        { $setOnInsert: bucket },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${initialBuckets.length} money buckets.`);

    console.log('--- Seeding Users ---');
    for (const founder of founders) {
      const hash = await bcrypt.hash(founder.password, SALT_ROUNDS);
      await User.findOneAndUpdate(
        { username: founder.username },
        { 
          $setOnInsert: {
            password_hash: hash,
            display_name: founder.display_name
          }
        },
        { upsert: true, new: true }
      );
      console.log(`✅ User "${founder.username}" seeded`);
    }

    console.log('\n🎉 Database seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
