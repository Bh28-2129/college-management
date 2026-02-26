// ─────────────────────────────────────────────────────
//  db.js  —  PostgreSQL connection pool
// ─────────────────────────────────────────────────────
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false
});

pool.on('connect', () => {
    console.log('✅  PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('❌  PostgreSQL pool error:', err.message);
});

module.exports = pool;
