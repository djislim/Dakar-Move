const express = require('express');
const router = express.Router();
const linesController = require('../controllers/lines.controller');

// Toutes les lignes
router.get('/', linesController.getAllLines);

// Détail d'une ligne
router.get('/:id', linesController.getLineById);

module.exports = router; 
