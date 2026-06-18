const express = require('express');
const router = express.Router();
const etaController = require('../controllers/eta.controller');

// ETA pour tous les arrêts restants d'un trip sur une ligne
router.get('/trip/:tripId/line/:lineId', (req, res) => etaController.getETAForLine(req, res));

// ETA pour un arrêt spécifique d'un trip
router.get('/trip/:tripId/stop/:stopId', (req, res) => etaController.getETAForStop(req, res));

// ETA de tous les bus actifs arrivant à un arrêt donné
router.get('/stop/:stopId/arrivals', (req, res) => etaController.getActiveTripsForStop(req, res));
// Retard d'un trip actif
router.get('/trip/:tripId/delay', (req, res) => etaController.getTripDelay(req, res));

module.exports = router;