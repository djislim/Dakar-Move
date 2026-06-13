const pool = require('../../config/db.config');

const getStopsByLine = async (req, res) => {
  const { lineId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM stops WHERE line_id = $1 ORDER BY stop_order ASC',
      [lineId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getStopById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM stops WHERE id = $1', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Arrêt introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getStopsByLine, getStopById };