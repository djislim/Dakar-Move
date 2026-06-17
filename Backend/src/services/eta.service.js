const pool = require('../../config/db.config');

// Vitesse moyenne d'un bus DDD à Dakar (km/h), tenant compte du trafic urbain
const AVERAGE_SPEED_KMH = 18;

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * Retourne la distance en kilomètres
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calcule le temps de trajet estimé en minutes pour une distance donnée
 */
function distanceToMinutes(distanceKm) {
  const hours = distanceKm / AVERAGE_SPEED_KMH;
  return Math.round(hours * 60);
}

/**
 * Récupère la dernière position GPS connue d'un trip actif
 */
async function getLastPosition(tripId) {
  const result = await pool.query(
    `SELECT latitude, longitude, recorded_at 
     FROM bus_positions 
     WHERE trip_id = $1 
     ORDER BY recorded_at DESC 
     LIMIT 1`,
    [tripId]
  );
  return result.rows[0] || null;
}

/**
 * Calcule l'ETA pour un arrêt donné, à partir de la position actuelle du bus
 */
async function calculateETA(tripId, stopId) {
  const lastPosition = await getLastPosition(tripId);
  if (!lastPosition) return null;

  const stopResult = await pool.query(
    'SELECT latitude, longitude FROM stops WHERE id = $1',
    [stopId]
  );
  const stop = stopResult.rows[0];
  if (!stop) return null;

  const distanceKm = calculateDistance(
    lastPosition.latitude, lastPosition.longitude,
    stop.latitude, stop.longitude
  );

  const etaMinutes = distanceToMinutes(distanceKm);

  return {
    eta_minutes: etaMinutes,
    distance_km: Math.round(distanceKm * 100) / 100,
    last_update: lastPosition.recorded_at
  };
}

/**
 * Calcule l'ETA pour TOUS les arrêts restants d'une ligne, 
 * pour un trip actif donné
 */
async function calculateETAForAllStops(tripId, lineId) {
  const lastPosition = await getLastPosition(tripId);
  if (!lastPosition) return [];

  const stopsResult = await pool.query(
    'SELECT id, name, latitude, longitude, stop_order FROM stops WHERE line_id = $1 ORDER BY stop_order ASC',
    [lineId]
  );
  const stops = stopsResult.rows;

  // Trouver l'arrêt le plus proche de la position actuelle (= position approx du bus)
  let closestIndex = 0;
  let closestDistance = Infinity;
  stops.forEach((stop, index) => {
    const dist = calculateDistance(
      lastPosition.latitude, lastPosition.longitude,
      stop.latitude, stop.longitude
    );
    if (dist < closestDistance) {
      closestDistance = dist;
      closestIndex = index;
    }
  });

  // Calculer l'ETA cumulé pour chaque arrêt à venir
  const results = [];
  let cumulativeDistance = closestDistance;

  for (let i = closestIndex; i < stops.length; i++) {
    if (i > closestIndex) {
      const prevStop = stops[i - 1];
      const currentStop = stops[i];
      cumulativeDistance += calculateDistance(
        prevStop.latitude, prevStop.longitude,
        currentStop.latitude, currentStop.longitude
      );
    }

    results.push({
      stop_id: stops[i].id,
      stop_name: stops[i].name,
      stop_order: stops[i].stop_order,
      eta_minutes: distanceToMinutes(cumulativeDistance),
      distance_km: Math.round(cumulativeDistance * 100) / 100
    });
  }

  return results;
}

module.exports = {
  calculateDistance,
  calculateETA,
  calculateETAForAllStops
};