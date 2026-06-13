 module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Nouveau client connecté : ${socket.id}`);

    // Passager s'abonne à une ligne
    socket.on('subscribe:line', (lineId) => {
      socket.join(`line:${lineId}`);
      console.log(`👤 Client abonné à la ligne ${lineId}`);
    });

    // Chauffeur envoie sa position GPS
    socket.on('driver:location', (data) => {
      const { trip_id, line_id, latitude, longitude } = data;
      
      // Broadcast à tous les passagers abonnés à cette ligne
      io.to(`line:${line_id}`).emit('bus:position', {
        trip_id,
        line_id,
        latitude,
        longitude,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Client déconnecté : ${socket.id}`);
    });
  });
};
