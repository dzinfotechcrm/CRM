const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Public
router.post('/login', authController.login);

// Protected
router.get('/me', auth, authController.me);

module.exports = router;
