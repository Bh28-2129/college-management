// ─────────────────────────────────────────────────────
//  routes/marks.js
// ─────────────────────────────────────────────────────
const express = require('express');
const pool    = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

/* ══════════════════════════════════════════════════════
   GET /api/marks
   Query: roll_number, dept, exam_type, sub_type
   Roles: admin (any), faculty (own dept), student (own)
══════════════════════════════════════════════════════ */
router.get('/', authenticate, async (req, res) => {
    const { roll_number, dept, exam_type, sub_type } = req.query;
    let query  = 'SELECT * FROM marks WHERE 1=1';
    const params = [];

    // Students see only their own marks
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
    if (exam_type) {
        params.push(exam_type);
        query += ` AND exam_type = $${params.length}`;
    }
    if (sub_type) {
        params.push(sub_type);
        query += ` AND sub_type = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /marks]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/marks
   Upload batch marks (faculty or admin)
   Body: { department, exam_type, sub_type, rows: [{ roll_number, student_name, marks_scored }] }
══════════════════════════════════════════════════════ */
router.post('/', authenticate, async (req, res) => {
    if (!['faculty', 'admin'].includes(req.user.role))
        return res.status(403).json({ error: 'Forbidden' });

    const { department, exam_type, sub_type, rows } = req.body;
    if (!department || !exam_type || !sub_type || !Array.isArray(rows) || !rows.length)
        return res.status(400).json({ error: 'department, exam_type, sub_type and rows[] are required' });

    const faculty_id = req.user.role === 'faculty' ? req.user.facultyId : null;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const inserted = [];
        for (const row of rows) {
            if (!row.roll_number) continue;
            const r = await client.query(
                `INSERT INTO marks (faculty_id, department, exam_type, sub_type, roll_number, student_name, marks_scored)
                 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                [faculty_id, department, exam_type, sub_type,
                 row.roll_number, row.student_name || null, row.marks_scored ?? null]
            );
            inserted.push(r.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json({ inserted: inserted.length, rows: inserted });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[POST /marks]', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
