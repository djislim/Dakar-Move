 const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../../config/db.config');
require('dotenv').config();

exports.driverLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si le chauffeur existe
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'driver']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const driver = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, driver.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: driver.id, 
        email: driver.email,
        role: driver.role,
        name: driver.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        line_id: driver.line_id
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
