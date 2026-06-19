const pool = require('../../config/db.config');

exports.addFavorite = async (req, res) => {
  const { device_id, line_id, stop_id } = req.body;
  
  if (!device_id) {
    return res.status(400).json({ message: 'device_id requis' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO favorites (device_id, line_id, stop_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (device_id, line_id, stop_id) DO NOTHING
       RETURNING *`,
      [device_id, line_id || null, stop_id || null]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'Déjà dans les favoris' });
    }

    res.json({ message: 'Ajouté aux favoris', favorite: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.removeFavorite = async (req, res) => {
  const { id } = req.params;
  const { device_id } = req.query;

  try {
    const result = await pool.query(
      'DELETE FROM favorites WHERE id = $1 AND device_id = $2 RETURNING *',
      [id, device_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Favori introuvable' });
    }

    res.json({ message: 'Retiré des favoris' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getFavorites = async (req, res) => {
  const { device_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        f.id,
        f.line_id,
        f.stop_id,
        f.created_at,
        l.number as line_number,
        l.name as line_name,
        l.color as line_color,
        l.origin,
        l.destination,
        s.name as stop_name
      FROM favorites f
      LEFT JOIN lines l ON l.id = f.line_id
      LEFT JOIN stops s ON s.id = f.stop_id
      WHERE f.device_id = $1
      ORDER BY f.created_at DESC
    `, [device_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};