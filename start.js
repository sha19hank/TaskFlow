#!/usr/bin/env node
/**
 * start.js — Railway entry point
 * Ensures DB schema is up to date, then starts server.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const prismaSchemaPath = path.join('prisma', 'schema.prisma');
const migrationsDir = path.join(backendDir, 'prisma', 'migrations');

const hasMigrations = () => {
  try {
    return fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0;
  } catch {
    return false;
  }
};

console.log('🔄 Syncing database schema...');
try {
  const command = hasMigrations()
    ? `npx prisma migrate deploy --schema ${prismaSchemaPath}`
    : `npx prisma db push --schema ${prismaSchemaPath}`;

  execSync(command, {
    stdio: 'inherit',
    cwd: backendDir
  });
  console.log('✅ Database ready');
} catch (err) {
  console.error('❌ DB sync failed:', err?.message || err);
  console.error(
    'ℹ️  Ensure Railway Variables include DATABASE_URL (from the PostgreSQL plugin) and JWT_SECRET.'
  );
  process.exit(1);
}

console.log('🚀 Starting server...');
require('./backend/server.js');
