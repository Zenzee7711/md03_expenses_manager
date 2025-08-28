const con = require('./db');                 
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/', (_, res) => res.json({ ok: true, service: 'MD03 Expense Manager' }));

// Dev helper – quick bcrypt hash (optional)
app.get('/password/:pass', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.params.pass, 12);
    res.send(hash);
  } catch {
    res.status(500).send('Hashing error');
  }
});

/**
 * POST /login
 * Body: { username, password }
 * 200: { userId, username } | 401: "Wrong username"/"Wrong password"
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).send('Missing credentials');

  const sql = 'SELECT id, password FROM users WHERE BINARY username = ?';
  con.query(sql, [username], (err, rows) => {
    if (err) return res.status(500).send('Database server error');
    if (rows.length !== 1) return res.status(401).send('Wrong username');

    bcrypt.compare(password, rows[0].password, (e, ok) => {
      if (e) return res.status(500).send('Hashing error');
      if (!ok) return res.status(401).send('Wrong password');
      res.json({ userId: rows[0].id, username });
    });
  });
});

/**
 * GET /expenses?userId=#
 * All expenses (standardized keys for the CLI)
 */
app.get('/expenses', (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sql = `
    SELECT id,
           item  AS title,
           paid  AS amount,
           DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.000') AS paid_at
    FROM expense
    WHERE user_id = ?
    ORDER BY date DESC, id DESC`;
  con.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

/**
 * GET /expenses/today?userId=#
 * Today’s expenses (same shape)
 */
app.get('/expenses/today', (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sql = `
    SELECT id,
           item  AS title,
           paid  AS amount,
           DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.000') AS paid_at
    FROM expense
    WHERE user_id = ? AND DATE(date) = CURDATE()
    ORDER BY date DESC, id DESC`;
  con.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

/**
 * GET /expenses/search?userId=#&q=keyword
 * Search by substring in item (case-insensitive by default collation)
 */
app.get('/expenses/search', (req, res) => {
  const userId = Number(req.query.userId);
  const q = (req.query.q || '').toString();
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sql = `
    SELECT id,
           item  AS title,
           paid  AS amount,
           DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.000') AS paid_at
    FROM expense
    WHERE user_id = ? AND item LIKE ?
    ORDER BY date DESC, id DESC`;
  con.query(sql, [userId, `%${q}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

/**
 * POST /expenses
 * Body: { userId, title, amount }
 * 201: { id }
 */
app.post('/expenses', (req, res) => {
  const { userId, title, amount } = req.body || {};
  if (!userId || !title || amount == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const sql = 'INSERT INTO expense (user_id, item, paid, date) VALUES (?,?,?,NOW())';
  con.query(sql, [Number(userId), String(title), Number(amount)], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ id: result.insertId });
  });
});

/**
 * DELETE /expenses/:id?userId=#
 * Deletes only if the row belongs to userId
 */
app.delete('/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.query.userId);
  if (!id || !userId) return res.status(400).json({ error: 'id and userId required' });

  const sql = 'DELETE FROM expense WHERE id = ? AND user_id = ?';
  con.query(sql, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: id });
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));