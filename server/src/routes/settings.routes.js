const router = require('express').Router();
const settingsController = require('../controllers/settings.controller');
const auth = require('../middleware/auth');

// All settings routes are protected
router.use(auth);

router.get('/', settingsController.getAll);
router.get('/:group', settingsController.getByGroup);
router.put('/:group', settingsController.updateByGroup);

module.exports = router;
