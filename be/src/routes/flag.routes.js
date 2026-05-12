const express = require('express');
const router = express.Router();
const flagController = require('../controllers/flag.controller');

router.get('/', flagController.getFlags);
router.post('/', flagController.createFlag);
router.put('/:id', flagController.updateFlag);
router.delete('/:id', flagController.deleteFlag);

module.exports = router;
