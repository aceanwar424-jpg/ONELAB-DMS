require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const authRoutes = require('./routes/auth');
const sopRoutes = require('./routes/sop');
const userRoutes = require('./routes/users');
const pdfRoutes = require('./routes/pdf');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Init DB tables
const initDB = require('./services/initDB');
initDB(pool);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'sop-wiki-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

require('./services/passport')(passport, pool);

app.use('/api/auth', authRoutes(passport));
app.use('/api/sop', sopRoutes(pool));
app.use('/api/users', userRoutes(pool));
app.use('/api/pdf', pdfRoutes(pool));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
