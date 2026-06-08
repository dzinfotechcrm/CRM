/**
 * Migration Script
 * 1. Creates the database if it doesn't exist
 * 2. Runs schema.sql (all tables + constraints)
 * 3. Runs seed.sql (settings keys + money_buckets)
 * 4. Runs seed-users.js (2 founder accounts)
 *
 * Usage: node db/migrate.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'dz_crm';

async function createDatabaseIfNotExists() {
  // Connect to default 'postgres' database to create our DB
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (result.rowCount === 0) {
      // Database names can't be parameterized, but this is an internal script
      await adminPool.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database "${DB_NAME}" created`);
    } else {
      console.log(`ℹ️  Database "${DB_NAME}" already exists`);
    }
  } finally {
    await adminPool.end();
  }
}

async function runSQL(filePath, description) {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: DB_NAME,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log(`✅ ${description} — completed`);
  } catch (err) {
    console.error(`❌ ${description} — failed:`, err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

async function migrate() {
  console.log('🚀 Starting migration...\n');

  // Step 1: Create database
  await createDatabaseIfNotExists();

  // Step 2: Run schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  await runSQL(schemaPath, 'Schema (8 tables)');

  // Step 3: Run seed data
  const seedPath = path.join(__dirname, 'seed.sql');
  await runSQL(seedPath, 'Seed data (settings + buckets)');

  // Step 4: Seed users
  console.log('\n📦 Seeding user accounts...');
  execSync(`node "${path.join(__dirname, 'seed-users.js')}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n============================================');
  console.log('🎉 Migration complete! All tables are ready.');
  console.log('============================================\n');
}

migrate().catch((err) => {
  console.error('\n💥 Migration failed:', err.message);
  process.exit(1);
});
