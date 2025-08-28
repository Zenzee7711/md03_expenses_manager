const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Get all expenses
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
  
  // Get today's expenses
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
  
  // Get expenses by search
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
  
  // Add expense
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
  
  // Delete expense by ID
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
  


// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});
