const router = require('express').Router();
const paymentsController = require('../controllers/payments.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',              paymentsController.getAll);
router.get('/monthly-total', paymentsController.getMonthlyTotal);
router.post('/',             paymentsController.create);
router.delete('/:id',        paymentsController.delete);

module.exports = router;
