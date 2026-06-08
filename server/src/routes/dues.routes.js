const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dues.controller');

router.get('/',     auth, ctrl.getAll);
router.post('/',    auth, ctrl.create);
router.put('/:id',  auth, ctrl.update);
router.delete('/:id', auth, ctrl.delete);

module.exports = router;
