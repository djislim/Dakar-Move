const pool = require('../../config/db.config');

exports.startTrip = async (req, res) => {
  const { line_id } = req.body;
  const driver_id = req.user.id;

  try {
    // Créer un nouveau voyage
    const result = await pool.query(
      `INSERT INTO trips (driver_id, line_id, status, started_at)
       VALUES ($1, $2, 'active', NOW())
       RETURNING *`,
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

exports.updateLocation = async (req, res) => {
  const { trip_id, latitude, longitude } = req.body;
  const driver_id = req.user.id;

  try {
    // Sauvegarder la position
    await pool.query(
      `INSERT INTO bus_positions (trip_id, driver_id, latitude, longitude, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [trip_id, driver_id, latitude, longitude]
    );

    // Émettre via WebSocket (disponible via req.app)
    req.app.get('io').emit(`bus:${trip_id}`, {
      trip_id,
      latitude,
      longitude,
      timestamp: new Date()
    });

    res.json({ message: 'Position mise à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.stopTrip = async (req, res) => {
  const { trip_id } = req.body;

  try {
    await pool.query(
      `UPDATE trips SET status = 'completed', ended_at = NOW()
       WHERE id = $1`,
      [trip_id]
    );

    // Notifier les passagers que le bus a terminé
    req.app.get('io').emit(`bus:${trip_id}:ended`, { trip_id });

    res.json({ message: 'Voyage terminé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};