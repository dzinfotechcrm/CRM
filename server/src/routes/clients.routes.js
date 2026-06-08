const router = require('express').Router();
const clientsController = require('../controllers/clients.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',    clientsController.getAll);
router.get('/:id', clientsController.getById);
router.post('/',   clientsController.create);
router.put('/:id', clientsController.update);
router.delete('/:id', clientsController.delete);

module.exports = router;
