const con = require('./db'); // host: localhost, db: expenses (your file) 
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/', (_, res) => res.json({ ok: true, service: 'MD03 Expense Manager' }));

// Password helper (kept for convenience)
app.get('/password/:pass', (req, res) => {
  bcrypt.hash(req.params.pass, 12, (err, hash) => {
    if (err) return res.status(500).send('Hashing error');
    res.send(hash);
  });
});

/**
 * POST /login
 * Body: { username, password }
 * Returns: { userId, username } on 200
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




// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));