const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Home page
router.get('/', indexController.getHomePage);

// TODO: Add routes for /informasi, /prestasi, /struktur, /sejarah, /acara, /login

module.exports = router;
