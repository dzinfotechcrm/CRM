const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/finance.controller');

router.get('/overview', auth, ctrl.getOverview);
router.get('/goals',    auth, ctrl.getGoals);

module.exports = router;
