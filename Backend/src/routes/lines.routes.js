const express = require('express');
const router = express.Router();
const linesController = require('../controllers/lines.controller');

// Toutes les lignes
router.get('/', (req, res) => linesController.getAllLines(req, res));

// Bus actifs sur toutes les lignes
router.get('/active-buses', (req, res) => linesController.getActiveBuses(req, res));

// Détail d'une ligne
router.get('/:id', (req, res) => linesController.getLineById(req, res));

// Bus actifs sur une ligne spécifique
router.get('/:id/active-buses', (req, res) => linesController.getActiveBusesByLine(req, res));

module.exports = router;