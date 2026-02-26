// ─────────────────────────────────────────────────────
//  routes/faculty.js
//  Handles admin CRUD + faculty self-profile save/load
// ─────────────────────────────────────────────────────
const express  = require('express');
const pool     = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

// ── Helper: generate next T-XXX faculty ID ────────────
async function getNextFacultyId() {
    const result = await pool.query(
        `SELECT faculty_id FROM faculty
         WHERE faculty_id ~ '^T-[0-9]+$'
         ORDER BY LPAD(SPLIT_PART(faculty_id,'-',2), 10,'0') DESC LIMIT 1`
    );
    if (!result.rows.length) return 'T-000';
    const last = parseInt(result.rows[0].faculty_id.split('-')[1], 10);
    return 'T-' + String(last + 1).padStart(3, '0');
}

/* ══════════════════════════════════════════════════════
   GET /api/faculty/by-dept?dept=CSE
   Lightweight public (any auth role) endpoint used by
   student timetable to show faculty names & designations
══════════════════════════════════════════════════════ */
router.get('/by-dept', authenticate, async (req, res) => {
    const { dept } = req.query;
    if (!dept) return res.status(400).json({ error: 'dept query param required' });
    try {
        const result = await pool.query(
            `SELECT faculty_id, first_name, last_name, role, email, specialization
             FROM faculty WHERE department = $1 ORDER BY faculty_id ASC`,
            [dept]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /faculty/by-dept]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/faculty
   Query params: dept, search
   Roles: admin
══════════════════════════════════════════════════════ */
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
    const { dept, search } = req.query;
    let query  = 'SELECT * FROM faculty WHERE 1=1';
    const params = [];

    if (dept) {
        params.push(dept);
        query += ` AND department = $${params.length}`;
    }
    if (search) {
        params.push(`%${search}%`);
        query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR faculty_id ILIKE $${params.length})`;
    }
    query += ' ORDER BY faculty_id ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /faculty]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/faculty/count
   Returns { total, byDept }
   Roles: admin
══════════════════════════════════════════════════════ */
router.get('/count', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const total  = await pool.query('SELECT COUNT(*) FROM faculty');
        const byDept = await pool.query(
            `SELECT department, COUNT(*) as count
             FROM faculty GROUP BY department ORDER BY department`
        );
        res.json({
            total: parseInt(total.rows[0].count),
            byDept: byDept.rows
        });
    } catch (err) {
        console.error('[GET /faculty/count]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/faculty/next-id
   Returns next available T-XXX faculty ID
   Roles: admin
══════════════════════════════════════════════════════ */
router.get('/next-id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const id = await getNextFacultyId();
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/faculty/:fid
   Returns one faculty + qualifications + experience
   Roles: admin | faculty (own record)
══════════════════════════════════════════════════════ */
router.get('/:fid', authenticate, async (req, res) => {
    const { fid } = req.params;

    if (req.user.role === 'faculty' && req.user.facultyId !== fid)
        return res.status(403).json({ error: 'Forbidden' });

    try {
        const fac = await pool.query(
            'SELECT * FROM faculty WHERE faculty_id = $1', [fid]
        );
        if (!fac.rows.length)
            return res.status(404).json({ error: 'Faculty not found' });

        const [quals, exp] = await Promise.all([
            pool.query('SELECT * FROM faculty_qualifications WHERE faculty_id = $1 ORDER BY id', [fac.rows[0].id]),
            pool.query('SELECT * FROM faculty_experience WHERE faculty_id = $1 ORDER BY id',        [fac.rows[0].id])
        ]);
        res.json({
            ...fac.rows[0],
            qualifications: quals.rows,
            experience:     exp.rows
        });
    } catch (err) {
        console.error('[GET /faculty/:fid]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/faculty
   Add a new faculty member (admin only)
══════════════════════════════════════════════════════ */
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    const {
        first_name, last_name, department, role, date_of_birth, gender,
        mobile, email, nationality, religion, aadhar_number, city,
        highest_qualification, specialization, experience_years, previous_college
    } = req.body;

    if (!first_name || !last_name || !department)
        return res.status(400).json({ error: 'first_name, last_name and department are required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const faculty_id = await getNextFacultyId();

        const result = await client.query(
            `INSERT INTO faculty
             (faculty_id, first_name, last_name, department, role, date_of_birth, gender,
              mobile, email, nationality, religion, aadhar_number, city,
              highest_qualification, specialization, experience_years, previous_college, added_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'admin')
             RETURNING *`,
            [faculty_id, first_name, last_name, department, role, date_of_birth || null, gender,
             mobile, email, nationality, religion, aadhar_number, city,
             highest_qualification, specialization, experience_years || null, previous_college]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505')
            return res.status(409).json({ error: 'Faculty ID already exists' });
        console.error('[POST /faculty]', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

/* ══════════════════════════════════════════════════════
   PUT /api/faculty/:fid/profile
   Faculty self-profile update (faculty.html form)
   Also saves qualifications + experience (replaces)
   Roles: faculty (own), admin
══════════════════════════════════════════════════════ */
router.put('/:fid/profile', authenticate, async (req, res) => {
    const { fid } = req.params;
    if (req.user.role === 'faculty' && req.user.facultyId !== fid)
        return res.status(403).json({ error: 'Forbidden' });

    const {
        first_name, last_name, date_of_birth, gender,
        mobile, email, nationality, religion, aadhar_number, city,
        highest_qualification, specialization, experience_years, previous_college,
        qualifications,  // array
        experience        // array  [ { college, designation, from_year, to_year, cert_filename } ]
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updated = await client.query(
            `UPDATE faculty SET
               first_name=$1, last_name=$2, date_of_birth=$3, gender=$4,
               mobile=$5, email=$6, nationality=$7, religion=$8,
               aadhar_number=$9, city=$10,
               highest_qualification=$11, specialization=$12,
               experience_years=$13, previous_college=$14,
               added_by='self', updated_at=NOW()
             WHERE faculty_id=$15 RETURNING *`,
            [first_name, last_name, date_of_birth || null, gender,
             mobile, email, nationality, religion, aadhar_number, city,
             highest_qualification, specialization, experience_years || null, previous_college, fid]
        );
        if (!updated.rows.length) throw new Error('Faculty not found');

        const facDbId = updated.rows[0].id;

        // Replace qualifications
        if (Array.isArray(qualifications)) {
            await client.query('DELETE FROM faculty_qualifications WHERE faculty_id = $1', [facDbId]);
            for (const q of qualifications) {
                if (!q.qualification) continue;
                await client.query(
                    `INSERT INTO faculty_qualifications
                     (faculty_id, qualification, from_year, to_year, certificate_type, certificate_filename)
                     VALUES ($1,$2,$3,$4,$5,$6)`,
                    [facDbId, q.qualification, q.from_year||null, q.to_year||null,
                     q.cert_type||null, q.cert_filename||null]
                );
            }
        }

        // Replace experience
        if (Array.isArray(experience)) {
            await client.query('DELETE FROM faculty_experience WHERE faculty_id = $1', [facDbId]);
            for (const e of experience) {
                if (!e.college && !e.designation) continue;
                await client.query(
                    `INSERT INTO faculty_experience
                     (faculty_id, college, designation, from_year, to_year, certificate_filename)
                     VALUES ($1,$2,$3,$4,$5,$6)`,
                    [facDbId, e.college||null, e.designation||null,
                     e.from_year||null, e.to_year||null, e.cert_filename||null]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Profile updated', faculty: updated.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PUT /faculty/:fid/profile]', err.message);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
    }
});

/* ══════════════════════════════════════════════════════
   DELETE /api/faculty/:fid
   Roles: admin
══════════════════════════════════════════════════════ */
router.delete('/:fid', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM faculty WHERE faculty_id = $1 RETURNING *', [req.params.fid]
        );
        if (!result.rows.length)
            return res.status(404).json({ error: 'Faculty not found' });
        res.json({ message: 'Faculty deleted', faculty: result.rows[0] });
    } catch (err) {
        console.error('[DELETE /faculty/:fid]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
