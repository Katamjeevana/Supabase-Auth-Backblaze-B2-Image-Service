const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  resendVerification, 
  verifyToken,
  manualConfirm,
  verifyManualConfirmation,
 testDBConnection,
 repairUser
} = require('../controllers/auth');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/resend-verification', resendVerification);
router.get('/verify', verifyToken);
router.post('/manual-confirm', manualConfirm);
router.post('/verify-manual-confirmation', verifyManualConfirmation);
router.get('/test-db', testDBConnection);
router.post('/repair-user', repairUser);

module.exports = router;