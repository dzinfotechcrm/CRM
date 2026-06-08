const router = require('express').Router();
const projectsController = require('../controllers/projects.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',    projectsController.getAll);
router.get('/:id', projectsController.getById);
router.post('/',   projectsController.create);
router.put('/:id', projectsController.update);
router.delete('/:id', projectsController.delete);

module.exports = router;
