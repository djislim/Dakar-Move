const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');

// Ajouter un favori (ligne ou arrêt)
router.post('/', (req, res) => favoritesController.addFavorite(req, res));

// Récupérer les favoris d'un appareil
router.get('/:device_id', (req, res) => favoritesController.getFavorites(req, res));

// Retirer un favori
router.delete('/:id', (req, res) => favoritesController.removeFavorite(req, res));

module.exports = router;