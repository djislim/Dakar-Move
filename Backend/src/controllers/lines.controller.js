const pool = require('../../config/db.config');

exports.getAllLines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lines ORDER BY number ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getLineById = async (req, res) => {
  const { id } = req.params;
  try {
    const line = await pool.query(
      'SELECT * FROM lines WHERE id = $1', [id]
    );

    if (line.rows.length === 0) {
      return res.status(404).json({ message: 'Ligne introuvable' });
    }

    const stops = await pool.query(
      'SELECT * FROM stops WHERE line_id = $1 ORDER BY stop_order ASC', [id]
    );

    res.json({
      ...line.rows[0],
      stops: stops.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getActiveBuses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id as trip_id,
        t.line_id,
        t.driver_id,
        t.delay_minutes,
        t.started_at,
        l.number as line_number,
        l.name as line_name,
        l.color as line_color,
        l.origin,
        l.destination,
        u.name as driver_name,
        bp.latitude,
        bp.longitude,
        bp.recorded_at as last_update
      FROM trips t
      JOIN lines l ON l.id = t.line_id
      JOIN users u ON u.id = t.driver_id
      JOIN LATERAL (
        SELECT latitude, longitude, recorded_at
        FROM bus_positions
        WHERE trip_id = t.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) bp ON true
      WHERE t.status = 'active'
      ORDER BY t.started_at ASC
    `);

    res.json({
      total_active_buses: result.rows.length,
      buses: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getActiveBusesByLine = async (req, res) => {
  const { id } = req.params;
  const lineId = parseInt(id);
  try {
    const result = await pool.query(`
      SELECT 
        t.id as trip_id,
        t.line_id,
        t.delay_minutes,
        t.started_at,
        l.number as line_number,
        l.color as line_color,
        u.name as driver_name,
        bp.latitude,
        bp.longitude,
        bp.recorded_at as last_update
      FROM trips t
      JOIN lines l ON l.id = t.line_id
      JOIN users u ON u.id = t.driver_id
      JOIN LATERAL (
        SELECT latitude, longitude, recorded_at
        FROM bus_positions
        WHERE trip_id = t.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) bp ON true
      WHERE t.status = 'active' AND t.line_id = $1
      ORDER BY t.started_at ASC
    `, [lineId]);

    res.json({
      line_id: lineId,
      total_active_buses: result.rows.length,
      buses: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};