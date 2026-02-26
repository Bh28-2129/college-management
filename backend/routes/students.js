// ─────────────────────────────────────────────────────
//  routes/students.js
//  Handles admin CRUD + student self-profile save/load
// ─────────────────────────────────────────────────────
const express  = require('express');
const pool     = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

// ── Department → roll base map ────────────────────────
const DEPT_ROLL_BASE = {
    AIML: 6101, CSE: 7101, MECH: 8101, ECE: 9101,
    EEE:  5101, CIVIL: 4101, IT: 3101, MBA: 2101, MCA: 1101
};

// ── Helper: next roll number for a department ─────────
async function getNextRoll(dept) {
    const base = DEPT_ROLL_BASE[dept?.toUpperCase()];
    if (!base) throw new Error(`Unknown department: ${dept}`);

    const result = await pool.query(
        `SELECT roll_number FROM students
         WHERE department = $1
         ORDER BY roll_number::bigint DESC LIMIT 1`, [dept]
    );
    if (!result.rows.length) return String(base);
    const last = parseInt(result.rows[0].roll_number, 10);
    return String(last + 1);
}

/* ══════════════════════════════════════════════════════
   GET /api/students
   Query params: dept, search
   Roles: admin
══════════════════════════════════════════════════════ */
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
    const { dept, search } = req.query;
    let query  = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (dept) {
        params.push(dept);
        query += ` AND department = $${params.length}`;
    }
    if (search) {
        params.push(`%${search}%`);
        query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR roll_number ILIKE $${params.length})`;
    }
    query += ' ORDER BY roll_number ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /students]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/students/count
   Returns { total, byDept }
   Roles: admin
══════════════════════════════════════════════════════ */
router.get('/count', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM students');
        const byDept = await pool.query(
            `SELECT department, COUNT(*) as count
             FROM students GROUP BY department ORDER BY department`
        );
        res.json({
            total: parseInt(total.rows[0].count),
            byDept: byDept.rows
        });
    } catch (err) {
        console.error('[GET /students/count]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/students/by-class
   Query: dept (required), section (optional)
   Returns roll_number, first_name, last_name for a class
   Roles: admin | faculty
══════════════════════════════════════════════════════ */
router.get('/by-class', authenticate, async (req, res) => {
    if (!['admin', 'faculty'].includes(req.user.role))
        return res.status(403).json({ error: 'Forbidden' });

    const { dept, section } = req.query;
    if (!dept) return res.status(400).json({ error: 'dept is required' });

    let query = `SELECT roll_number, first_name, last_name, section, current_year
                 FROM students WHERE department = $1`;
    const params = [dept];

    if (section) {
        params.push(section);
        query += ` AND section = $${params.length}`;
    }
    query += ' ORDER BY roll_number ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /students/by-class]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/students/next-roll/:dept
   Returns the next available roll number for a dept
   Roles: admin
══════════════════════════════════════════════════════ */
router.get('/next-roll/:dept', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const roll = await getNextRoll(req.params.dept);
        res.json({ roll });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/students/:roll
   Returns one student + qualifications
   Roles: admin | student (own record only)
══════════════════════════════════════════════════════ */
router.get('/:roll', authenticate, async (req, res) => {
    const { roll } = req.params;

    // Students can only see their own record
    if (req.user.role === 'student' && req.user.rollNumber !== roll)
        return res.status(403).json({ error: 'Forbidden' });

    try {
        const stu = await pool.query(
            'SELECT * FROM students WHERE roll_number = $1', [roll]
        );
        if (!stu.rows.length)
            return res.status(404).json({ error: 'Student not found' });

        const quals = await pool.query(
            'SELECT * FROM student_qualifications WHERE student_id = $1 ORDER BY id',
            [stu.rows[0].id]
        );
        res.json({ ...stu.rows[0], qualifications: quals.rows });
    } catch (err) {
        console.error('[GET /students/:roll]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/students
   Add a new student (admin only)
   Body: student fields (snake_case)
══════════════════════════════════════════════════════ */
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    const {
        first_name, last_name, department, date_of_birth, gender,
        mobile, email, nationality, religion, aadhar_number, city,
        admission_year, current_year, section,
        parent_name, parent_mobile, address
    } = req.body;

    if (!first_name || !last_name || !department)
        return res.status(400).json({ error: 'first_name, last_name and department are required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const roll = await getNextRoll(department);

        const result = await client.query(
            `INSERT INTO students
             (roll_number, first_name, last_name, department, date_of_birth, gender,
              mobile, email, nationality, religion, aadhar_number, city,
              admission_year, current_year, section,
              parent_name, parent_mobile, address, added_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'admin')
             RETURNING *`,
            [roll, first_name, last_name, department, date_of_birth || null, gender,
             mobile, email, nationality, religion, aadhar_number, city,
             admission_year || null, current_year, section,
             parent_name, parent_mobile, address]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505')
            return res.status(409).json({ error: 'Roll number already exists' });
        console.error('[POST /students]', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

/* ══════════════════════════════════════════════════════
   PUT /api/students/:roll/profile
   Student self-profile update (student.html form)
   Also saves qualifications (replaces existing)
   Roles: student (own), admin
══════════════════════════════════════════════════════ */
router.put('/:roll/profile', authenticate, async (req, res) => {
    const { roll } = req.params;
    if (req.user.role === 'student' && req.user.rollNumber !== roll)
        return res.status(403).json({ error: 'Forbidden' });

    const {
        first_name, last_name, date_of_birth, gender,
        mobile, email, nationality, religion, aadhar_number, city,
        admission_year, current_year, section,
        parent_name, parent_mobile, address,
        qualifications  // array of { qualification, from_year, to_year, cert_type, cert_filename }
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update student personal details
        const updated = await client.query(
            `UPDATE students SET
               first_name=$1, last_name=$2, date_of_birth=$3, gender=$4,
               mobile=$5, email=$6, nationality=$7, religion=$8,
               aadhar_number=$9, city=$10, admission_year=$11, current_year=$12,
               section=$13, parent_name=$14, parent_mobile=$15, address=$16,
               added_by='self', updated_at=NOW()
             WHERE roll_number=$17 RETURNING *`,
            [first_name, last_name, date_of_birth || null, gender,
             mobile, email, nationality, religion, aadhar_number, city,
             admission_year || null, current_year, section,
             parent_name, parent_mobile, address, roll]
        );
        if (!updated.rows.length)
            throw new Error('Student not found');

        const stuId = updated.rows[0].id;

        // Replace qualifications
        if (Array.isArray(qualifications)) {
            await client.query(
                'DELETE FROM student_qualifications WHERE student_id = $1', [stuId]
            );
            for (const q of qualifications) {
                if (!q.qualification) continue;
                await client.query(
                    `INSERT INTO student_qualifications
                     (student_id, qualification, from_year, to_year, certificate_type, certificate_filename)
                     VALUES ($1,$2,$3,$4,$5,$6)`,
                    [stuId, q.qualification, q.from_year || null, q.to_year || null,
                     q.cert_type || null, q.cert_filename || null]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Profile updated', student: updated.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PUT /students/:roll/profile]', err.message);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
    }
});

/* ══════════════════════════════════════════════════════
   DELETE /api/students/:roll
   Roles: admin
══════════════════════════════════════════════════════ */
router.delete('/:roll', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM students WHERE roll_number = $1 RETURNING *',
            [req.params.roll]
        );
        if (!result.rows.length)
            return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student deleted', student: result.rows[0] });
    } catch (err) {
        console.error('[DELETE /students/:roll]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
