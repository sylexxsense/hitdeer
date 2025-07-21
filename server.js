const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const db = new sqlite3.Database('./forum.db');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static('public'));

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'register.html'));
});

app.get('/forum', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'view', 'forum.html'));
});

// Handle login with inline error message
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (row) {
      req.session.user = username;
      res.redirect('/forum');
    } else {
      fs.readFile(path.join(__dirname, 'view', 'login.html'), 'utf8', (err, data) => {
        if (err) return res.status(500).send('Server error');
        const modified = data.replace('<!--LOGIN_ERROR-->', `<p class="error">Invalid username or password</p>`);
        res.send(modified);
      });
    }
  });
});

// Handle registration
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function (err) {
    if (err) {
      fs.readFile(path.join(__dirname, 'view', 'register.html'), 'utf8', (err, data) => {
        if (err) return res.status(500).send('Server error');
        const modified = data.replace('<!--REGISTER_ERROR-->', `<p class="error">Username already taken</p>`);
        res.send(modified);
      });
    } else {
      res.redirect('/');
    }
  });
});

// Message APIs
app.get('/messages', (req, res) => {
  db.all(`SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
    res.json(rows.reverse());
  });
});

app.post('/message', (req, res) => {
  const username = req.session.user;
  const { message } = req.body;
  if (!username || !message) return res.sendStatus(400);
  db.run(`INSERT INTO messages (username, message) VALUES (?, ?)`, [username, message], err => {
    res.sendStatus(err ? 500 : 200);
  });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
