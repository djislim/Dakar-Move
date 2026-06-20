const pool = require('../../config/db.config');
const etaService = require('../services/eta.service');

const startTrip = async (req, res) => {
  const { line_id } = req.body;
  const driver_id = req.user.id;
  try {
    const result = await pool.query(
      `INSERT INTO trips (driver_id, line_id, status, started_at)
       VALUES ($1, $2, 'active', NOW()) RETURNING *`,
      [driver_id, line_id]
    );
    res.json({
      message: 'Voyage démarré — GPS actif',
      trip: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateLocation = async (req, res) => {
  const { trip_id, latitude, longitude } = req.body;
  const driver_id = req.user.id;
  try {
    await pool.query(
      `INSERT INTO bus_positions (trip_id, driver_id, latitude, longitude, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [trip_id, driver_id, latitude, longitude]
    );

    // Récupérer le line_id du trip pour cibler la bonne room
    const tripResult = await pool.query('SELECT line_id FROM trips WHERE id = $1', [trip_id]);
    const line_id = tripResult.rows[0]?.line_id;

    // Détecter le retard à chaque mise à jour de position
    const delayInfo = await etaService.updateTripDelay(trip_id);

    // Émettre vers la room de la ligne (ce que les passagers écoutent)
    req.app.get('io').to(`line:${line_id}`).emit('bus:position', {
      trip_id, line_id, latitude, longitude, timestamp: new Date(),
      delay_minutes: delayInfo ? delayInfo.delay_minutes : 0,
      is_delayed: delayInfo ? delayInfo.is_delayed : false
    });

    // Si retard détecté, déclencher une alerte
    if (delayInfo && delayInfo.is_delayed) {
      req.app.get('io').to(`line:${line_id}`).emit('alert:delay', {
        trip_id,
        line_id,
        message: `Retard de ${delayInfo.delay_minutes} minutes détecté`,
        delay_minutes: delayInfo.delay_minutes,
        current_stop_id: delayInfo.current_stop_id
      });
    }

    res.json({ 
      message: 'Position mise à jour',
      delay_info: delayInfo 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const stopTrip = async (req, res) => {
  const { trip_id } = req.body;
  try {
    await pool.query(
      `UPDATE trips SET status = 'completed', ended_at = NOW() WHERE id = $1`,
      [trip_id]
    );
    req.app.get('io').emit(`bus:${trip_id}:ended`, { trip_id });
    res.json({ message: 'Voyage terminé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { startTrip, updateLocation, stopTrip };
