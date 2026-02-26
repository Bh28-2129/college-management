// ─────────────────────────────────────────────────────
//  routes/feePayments.js
// ─────────────────────────────────────────────────────
const express = require('express');
const pool    = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

/* ══════════════════════════════════════════════════════
   GET /api/fee-payments
   Roles: admin (all), student (own)
══════════════════════════════════════════════════════ */
router.get('/', authenticate, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin') {
            result = await pool.query(
                'SELECT * FROM fee_payments ORDER BY created_at DESC'
            );
        } else if (req.user.role === 'student') {
            result = await pool.query(
                'SELECT * FROM fee_payments WHERE roll_number = $1 ORDER BY created_at DESC',
                [req.user.rollNumber]
            );
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /fee-payments]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   POST /api/fee-payments
   Roles: student
   Body: { student_name, fee_type, amount, payment_method, reference_number }
══════════════════════════════════════════════════════ */
router.post('/', authenticate, requireRole('student'), async (req, res) => {
    const {
        student_name, fee_type, amount,
        payment_method, reference_number
    } = req.body;

    if (!fee_type || !amount || !payment_method)
        return res.status(400).json({ error: 'fee_type, amount and payment_method are required' });

    try {
        const result = await pool.query(
            `INSERT INTO fee_payments
             (roll_number, student_name, fee_type, amount, payment_method, reference_number)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [req.user.rollNumber, student_name, fee_type, amount,
             payment_method, reference_number || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[POST /fee-payments]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ══════════════════════════════════════════════════════
   GET /api/fee-payments/:id
   Roles: admin | student (own)
══════════════════════════════════════════════════════ */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM fee_payments WHERE id = $1', [req.params.id]
        );
        if (!result.rows.length)
            return res.status(404).json({ error: 'Payment not found' });

        const pay = result.rows[0];
        if (req.user.role === 'student' && req.user.rollNumber !== pay.roll_number)
            return res.status(403).json({ error: 'Forbidden' });

        res.json(pay);
    } catch (err) {
        console.error('[GET /fee-payments/:id]', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
