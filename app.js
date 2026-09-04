const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, ''))); // Serve static files from root (css, uploads)

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'upucc_secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Set local variables for templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.activeMenu = ''; // Default
  next();
});

// Import Routes
const indexRoutes = require('./routes/index');
// const dashboardRoutes = require('./routes/dashboard');
// const portalRoutes = require('./routes/portal');

// Use Routes
app.use('/', indexRoutes);
// app.use('/dashboard', dashboardRoutes);
// app.use('/portal', portalRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Halaman Tidak Ditemukan' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
