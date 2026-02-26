// ─────────────────────────────────────────────────────
//  routes/auth.js  —  Login for admin, faculty, student
// ─────────────────────────────────────────────────────
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');

const router   = express.Router();

// ── Helper: sign JWT ──────────────────────────────────
function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
}

/* ══════════════════════════════════════════════════════
   POST /api/auth/admin/login
   Body: { username, password }
══════════════════════════════════════════════════════ */
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required' });

    try {
        const result = await pool.query(
            'SELECT * FROM admin_users WHERE username = $1', [username]
        );
        if (!result.rows.length)
            return res.status(401).json({ error: 'Invalid credentials' });

        const admin = result.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = signToken({ id: admin.id, username: admin.username, role: 'admin' });
        res.json({ token, role: 'admin', username: admin.username });
    } catch (err) {
        console.error('[AUTH /admin/login]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/auth/faculty/login
   Body: { facultyId, password }
   password is the faculty's mobile number by default
══════════════════════════════════════════════════════ */
router.post('/faculty/login', async (req, res) => {
    const { facultyId, password } = req.body;
    if (!facultyId || !password)
        return res.status(400).json({ error: 'Faculty ID and password are required' });

    try {
        const result = await pool.query(
            'SELECT * FROM faculty WHERE faculty_id = $1', [facultyId]
        );
        if (!result.rows.length)
            return res.status(401).json({ error: 'Invalid Faculty ID or password' });

        const fac = result.rows[0];
        // If password_hash is set use bcrypt, else fall back to mobile
        const valid = fac.password_hash
            ? await bcrypt.compare(password, fac.password_hash)
            : password === fac.mobile;
        if (!valid)
            return res.status(401).json({ error: 'Invalid Faculty ID or password' });

        const token = signToken({
            id: fac.id,
            facultyId: fac.faculty_id,
            role: 'faculty',
            department: fac.department
        });
        res.json({
            token,
            role: 'faculty',
            facultyId: fac.faculty_id,
            name: fac.first_name + ' ' + fac.last_name,
            department: fac.department
        });
    } catch (err) {
        console.error('[AUTH /faculty/login]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/auth/student/login
   Body: { rollNumber, password }
   password is the student's mobile number by default
══════════════════════════════════════════════════════ */
router.post('/student/login', async (req, res) => {
    const { rollNumber, password } = req.body;
    if (!rollNumber || !password)
        return res.status(400).json({ error: 'Roll number and password are required' });

    try {
        const result = await pool.query(
            'SELECT * FROM students WHERE roll_number = $1', [rollNumber]
        );
        if (!result.rows.length)
            return res.status(401).json({ error: 'Invalid roll number or password' });

        const stu = result.rows[0];
        // If password_hash is set use bcrypt, else fall back to mobile
        const valid = stu.password_hash
            ? await bcrypt.compare(password, stu.password_hash)
            : password === stu.mobile;
        if (!valid)
            return res.status(401).json({ error: 'Invalid roll number or password' });

        const token = signToken({
            id: stu.id,
            rollNumber: stu.roll_number,
            role: 'student',
            dept: stu.department
        });
        res.json({ token, role: 'student', rollNumber: stu.roll_number,
                   name: stu.first_name + ' ' + stu.last_name });
    } catch (err) {
        console.error('[AUTH /student/login]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   PUT /api/auth/change-password
   Body: { currentPassword, newPassword }
   Auth: Bearer JWT (student or faculty)
══════════════════════════════════════════════════════ */
const { authenticate } = require('../middleware/authenticate');

router.put('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    if (newPassword.length < 6)
        return res.status(400).json({ error: 'New password must be at least 6 characters' });

    try {
        const { role, rollNumber, facultyId } = req.user;

        if (role === 'student') {
            const result = await pool.query(
                'SELECT * FROM students WHERE roll_number = $1', [rollNumber]
            );
            if (!result.rows.length)
                return res.status(404).json({ error: 'Student not found' });

            const stu   = result.rows[0];
            const valid = stu.password_hash
                ? await bcrypt.compare(currentPassword, stu.password_hash)
                : currentPassword === stu.mobile;
            if (!valid)
                return res.status(401).json({ error: 'Current password is incorrect' });

            const hash = await bcrypt.hash(newPassword, 10);
            await pool.query(
                'UPDATE students SET password_hash = $1, updated_at = NOW() WHERE roll_number = $2',
                [hash, rollNumber]
            );
            return res.json({ message: 'Password changed successfully' });
        }

        if (role === 'faculty') {
            const result = await pool.query(
                'SELECT * FROM faculty WHERE faculty_id = $1', [facultyId]
            );
            if (!result.rows.length)
                return res.status(404).json({ error: 'Faculty not found' });

            const fac   = result.rows[0];
            const valid = fac.password_hash
                ? await bcrypt.compare(currentPassword, fac.password_hash)
                : currentPassword === fac.mobile;
            if (!valid)
                return res.status(401).json({ error: 'Current password is incorrect' });

            const hash = await bcrypt.hash(newPassword, 10);
            await pool.query(
                'UPDATE faculty SET password_hash = $1, updated_at = NOW() WHERE faculty_id = $2',
                [hash, facultyId]
            );
            return res.json({ message: 'Password changed successfully' });
        }

        return res.status(403).json({ error: 'Only students and faculty can change password here' });
    } catch (err) {
        console.error('[PUT /change-password]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/auth/seed-admin
   Creates the first admin user if none exists.
   Only works when no admin row exists in DB.
══════════════════════════════════════════════════════ */
router.post('/seed-admin', async (req, res) => {
    try {
        const check = await pool.query('SELECT COUNT(*) FROM admin_users');
        if (parseInt(check.rows[0].count) > 0)
            return res.status(409).json({ message: 'Admin already seeded' });

        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin@ecap';
        const hash     = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
            [username, hash]
        );
        res.json({ message: `Admin seeded: username="${username}"` });
    } catch (err) {
        console.error('[AUTH /seed-admin]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
