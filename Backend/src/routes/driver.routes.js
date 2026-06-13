const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Toutes ces routes nécessitent un token JWT valide avec role: driver
router.use(authMiddleware);
router.use(roleMiddleware('driver'));

// Démarrer le voyage
router.post('/start', (req, res) => driverController.startTrip(req, res));

// Mettre à jour la position GPS
router.post('/location', (req, res) => driverController.updateLocation(req, res));

// Terminer le voyage
router.post('/stop', (req, res) => driverController.stopTrip(req, res));

module.exports = router;