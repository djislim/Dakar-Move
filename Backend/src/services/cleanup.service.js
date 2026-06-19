const pool = require('../../config/db.config');

/**
 * Supprime les positions GPS de plus de 24h
 * (on garde un historique court, pas besoin de tout conserver indéfiniment)
 */
async function cleanOldPositions() {
  try {
    const result = await pool.query(
      `DELETE FROM bus_positions WHERE recorded_at < NOW() - INTERVAL '24 hours'`
    );
    if (result.rowCount > 0) {
      console.log(`🧹 ${result.rowCount} positions GPS anciennes supprimées`);
    }
  } catch (err) {
    console.error('❌ Erreur nettoyage positions:', err.message);
  }
}

/**
 * Marque comme "completed" les trips actifs depuis plus de 2h
 * (un voyage de bus à Dakar ne devrait jamais durer aussi longtemps,
 * c'est probablement un trip oublié/abandonné)
 */
async function closeStaleTrips() {
  try {
    const result = await pool.query(
      `UPDATE trips 
       SET status = 'completed', ended_at = NOW() 
       WHERE status = 'active' 
       AND started_at < NOW() - INTERVAL '2 hours'
       RETURNING id`
    );
    if (result.rowCount > 0) {
      console.log(`🧹 ${result.rowCount} trip(s) inactif(s) fermé(s) automatiquement`);
    }
  } catch (err) {
    console.error('❌ Erreur fermeture trips:', err.message);
  }
}

/**
 * Supprime les trips terminés depuis plus de 7 jours
 * (et leurs positions associées, via la contrainte CASCADE si elle existe)
 */
async function cleanOldTrips() {
  try {
    const result = await pool.query(
      `DELETE FROM trips 
       WHERE status = 'completed' 
       AND ended_at < NOW() - INTERVAL '7 days'`
    );
    if (result.rowCount > 0) {
      console.log(`🧹 ${result.rowCount} ancien(s) trip(s) supprimé(s)`);
    }
  } catch (err) {
    console.error('❌ Erreur nettoyage trips:', err.message);
  }
}

/**
 * Lance toutes les tâches de nettoyage
 */
async function runCleanup() {
  await closeStaleTrips();
  await cleanOldPositions();
  await cleanOldTrips();
}

/**
 * Démarre le nettoyage automatique périodique
 * @param {number} intervalMinutes - fréquence d'exécution en minutes
 */
function startCleanupSchedule(intervalMinutes = 30) {
  console.log(`🧹 Nettoyage automatique activé — toutes les ${intervalMinutes} minutes`);
  runCleanup(); // Exécution immédiate au démarrage
  setInterval(runCleanup, intervalMinutes * 60 * 1000);
}

module.exports = { runCleanup, startCleanupSchedule };