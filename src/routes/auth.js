const express = require('express');
const router = express.Router();
const { signup, login, resendverification } = require('../controllers/auth'); // Import controller functions

// Use controller functions directly
router.post('/signup', signup);
router.post('/login', login);
router.post('/resend-verification', resendverification);


module.exports = router;