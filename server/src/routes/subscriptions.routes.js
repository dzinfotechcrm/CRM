const router = require('express').Router();
const subscriptionsController = require('../controllers/subscriptions.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',    subscriptionsController.getAll);
router.get('/:id', subscriptionsController.getById);
router.post('/',   subscriptionsController.create);
router.put('/:id', subscriptionsController.update);
router.delete('/:id', subscriptionsController.delete);

module.exports = router;
