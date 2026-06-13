const express = require('express');
const router = express.Router();
const stopsController = require('../controllers/stops.controller');

// Tous les arrêts d'une ligne
router.get('/line/:lineId', (req, res) => stopsController.getStopsByLine(req, res));

// Détail d'un arrêt
router.get('/:id', (req, res) => stopsController.getStopById(req, res));

module.exports = router;