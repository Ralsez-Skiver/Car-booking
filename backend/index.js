const express = require('express');
const session = require('express-session');
const cors = require('cors');
const connection_pool = require('./database');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: 'mock-ms-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
  },
}));

app.post('/login', (req, res) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role required' });
  }

  // save usr session
  req.session.user = { username, role };
  res.json({ message: 'Login successful', user: req.session.user });
});

app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});


app.get('/requestee_past_data', async (req, res) => {
  try {
    // console.log('Session:', req.session);
    const username = req.session.user?.username

    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const [rows] = await connection_pool.query(
      'SELECT * FROM booking_request WHERE requester = ?',
      [username]
    );
    res.json(rows)
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error')
  }
})

app.listen(PORT, () => {
  console.log(`car booking backend running on http://localhost:${PORT}`);
});