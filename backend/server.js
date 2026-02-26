// ═══════════════════════════════════════════════════════════
//  server.js  —  ECAP Backend Entry Point
//  Node.js + Express + PostgreSQL
// ═══════════════════════════════════════════════════════════
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const pool       = require('./db');

// ── Route modules ─────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const studentsRoutes    = require('./routes/students');
const facultyRoutes     = require('./routes/faculty');
const feeRoutes         = require('./routes/feePayments');
const marksRoutes       = require('./routes/marks');
const attendanceRoutes  = require('./routes/attendance');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ─────────────────────────────────────
app.use(cors({
    origin: '*',          // Allow all origins for local development
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '10mb' }));      // For base64 file uploads
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────
app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', time: new Date() });
    } catch {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/students',     studentsRoutes);
app.use('/api/faculty',      facultyRoutes);
app.use('/api/fee-payments', feeRoutes);
app.use('/api/marks',        marksRoutes);
app.use('/api/attendance',   attendanceRoutes);

// ── Serve frontend static files ───────────────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── 404 handler ───────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global error handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]', err.stack || err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`\n🚀  ECAP Backend running on http://localhost:${PORT}`);
    console.log(`📋  Routes:`);
    console.log(`    POST   /api/auth/admin/login`);
    console.log(`    POST   /api/auth/faculty/login`);
    console.log(`    POST   /api/auth/student/login`);
    console.log(`    POST   /api/auth/seed-admin     (first-time setup)`);
    console.log(`    GET    /api/students`);
    console.log(`    POST   /api/students`);
    console.log(`    GET    /api/students/:roll`);
    console.log(`    PUT    /api/students/:roll/profile`);
    console.log(`    DELETE /api/students/:roll`);
    console.log(`    GET    /api/faculty`);
    console.log(`    POST   /api/faculty`);
    console.log(`    GET    /api/faculty/:fid`);
    console.log(`    PUT    /api/faculty/:fid/profile`);
    console.log(`    DELETE /api/faculty/:fid`);
    console.log(`    GET    /api/fee-payments`);
    console.log(`    POST   /api/fee-payments`);
    console.log(`    GET    /api/marks`);
    console.log(`    POST   /api/marks`);
    console.log(`    GET    /api/attendance`);
    console.log(`    POST   /api/attendance`);
    console.log(`    GET    /api/attendance/summary/:roll`);
    console.log(`    GET    /health\n`);

    // Auto-run schema on startup (safe – uses IF NOT EXISTS)
    try {
        const fs = require('fs');
        const path = require('path');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schemaSql);
        console.log('✅  Database schema verified / created');
    } catch (err) {
        console.warn('⚠️   Schema auto-run failed (run schema.sql manually):', err.message);
    }
});
