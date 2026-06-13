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
