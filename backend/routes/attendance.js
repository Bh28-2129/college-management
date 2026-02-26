// ─────────────────────────────────────────────────────
//  routes/attendance.js
// ─────────────────────────────────────────────────────
const express = require('express');
const pool    = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

/* ══════════════════════════════════════════════════════
   GET /api/attendance
   Query: roll_number, dept, section, date
   Roles: admin | faculty | student (own only)
══════════════════════════════════════════════════════ */
router.get('/', authenticate, async (req, res) => {
    const { roll_number, dept, section, date } = req.query;
    let query    = 'SELECT * FROM attendance WHERE 1=1';
    const params = [];

    if (req.user.role === 'student') {
        params.push(req.user.rollNumber);
        query += ` AND roll_number = $${params.length}`;
    } else if (roll_number) {
        params.push(roll_number);
        query += ` AND roll_number = $${params.length}`;
    }

    if (dept) {
        params.push(dept);
        query += ` AND department = $${params.length}`;
    }
    if (section) {
        params.push(section);
        query += ` AND section = $${params.length}`;
    }
    if (date) {
        params.push(date);
        query += ` AND attendance_date = $${params.length}`;
    }
    query += ' ORDER BY attendance_date DESC, roll_number ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /attendance]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/attendance/summary/:roll
   Returns overall % and per-dept summary for a student
   Roles: admin | faculty | student (own)
══════════════════════════════════════════════════════ */
router.get('/summary/:roll', authenticate, async (req, res) => {
    const { roll } = req.params;
    if (req.user.role === 'student' && req.user.rollNumber !== roll)
        return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await pool.query(
            `SELECT
               COUNT(*)                                            AS total_classes,
               SUM(CASE WHEN is_present THEN 1 ELSE 0 END)::int   AS present,
               ROUND(100.0 *
                 SUM(CASE WHEN is_present THEN 1 ELSE 0 END) /
                 NULLIF(COUNT(*),0), 2)                            AS percentage
             FROM attendance
             WHERE roll_number = $1`,
            [roll]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /attendance/summary/:roll]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/attendance
   Submit attendance for a class (faculty)
   Body: {
     department, section, date,
     rows: [{ roll_number, student_name, is_present }]
   }
   Roles: faculty | admin
══════════════════════════════════════════════════════ */
router.post('/', authenticate, async (req, res) => {
    if (!['faculty', 'admin'].includes(req.user.role))
        return res.status(403).json({ error: 'Forbidden' });

    const { department, section, date, rows } = req.body;
    if (!department || !section || !Array.isArray(rows) || !rows.length)
        return res.status(400).json({ error: 'department, section and rows[] are required' });

    const faculty_id      = req.user.role === 'faculty' ? req.user.facultyId : null;
    const attendance_date = date || new Date().toISOString().split('T')[0];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete existing attendance for this dept+section+date to avoid duplicates
        await client.query(
            `DELETE FROM attendance
             WHERE department=$1 AND section=$2 AND attendance_date=$3`,
            [department, section, attendance_date]
        );

        const inserted = [];
        for (const row of rows) {
            if (!row.roll_number) continue;
            const r = await client.query(
                `INSERT INTO attendance
                 (faculty_id, department, section, roll_number, student_name, is_present, attendance_date)
                 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                [faculty_id, department, section, row.roll_number,
                 row.student_name || null,
                 row.is_present !== false, attendance_date]
            );
            inserted.push(r.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json({ date: attendance_date, inserted: inserted.length, rows: inserted });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[POST /attendance]', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
