const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import des routes
const authRoutes = require('./src/routes/auth.routes');
const linesRoutes = require('./src/routes/lines.routes');
const stopsRoutes = require('./src/routes/stops.routes');
const driverRoutes = require('./src/routes/driver.routes');
const etaRoutes = require('./src/routes/eta.routes');
const favoritesRoutes = require('./src/routes/favorites.routes');

// Import du socket
const initBusSocket = require('./src/sockets/bus.socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lines', linesRoutes);
app.use('/api/stops', stopsRoutes);
app.use('/driver', driverRoutes);
app.use('/api/eta', etaRoutes);
app.use('/api/favorites', favoritesRoutes);

// Route test
app.get('/', (req, res) => {
  res.json({ message: 'Dakar Move API opérationnelle 🚌' });
});

// WebSocket
initBusSocket(io);

// Démarrage serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚌 Dakar Move backend lancé sur le port ${PORT}`);
});