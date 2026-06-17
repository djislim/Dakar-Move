const etaService = require('../services/eta.service');
const pool = require('../../config/db.config');

const getETAForLine = async (req, res) => {
  const { tripId, lineId } = req.params;
  try {
    const etas = await etaService.calculateETAForAllStops(tripId, lineId);
    if (etas.length === 0) {
      return res.status(404).json({ message: 'Aucune position GPS trouvée pour ce trajet' });
    }
    res.json(etas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getETAForStop = async (req, res) => {
  const { tripId, stopId } = req.params;
  try {
    const eta = await etaService.calculateETA(tripId, stopId);
    if (!eta) {
      return res.status(404).json({ message: 'Impossible de calculer le ETA' });
    }
    res.json(eta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getActiveTripsForStop = async (req, res) => {
  const { stopId } = req.params;
  try {
    const stopResult = await pool.query('SELECT line_id FROM stops WHERE id = $1', [stopId]);
    if (stopResult.rows.length === 0) {
      return res.status(404).json({ message: 'Arrêt introuvable' });
    }
    const lineId = stopResult.rows[0].line_id;

    const tripsResult = await pool.query(
      `SELECT id FROM trips WHERE line_id = $1 AND status = 'active'`,
      [lineId]
    );

    const etas = [];
    for (const trip of tripsResult.rows) {
      const eta = await etaService.calculateETA(trip.id, stopId);
      if (eta) {
        etas.push({ trip_id: trip.id, ...eta });
      }
    }

    res.json(etas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getETAForLine, getETAForStop, getActiveTripsForStop };