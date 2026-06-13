const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login chauffeur
router.post('/driver/login', authController.driverLogin);

module.exports = router;
