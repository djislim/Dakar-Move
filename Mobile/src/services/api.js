import axios from 'axios';
import { API_URL } from '../../config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// ── Lignes ──────────────────────────────────────
export const getLines = () => api.get('/api/lines');
export const getLineById = (id) => api.get(`/api/lines/${id}`);
export const getActiveBuses = () => api.get('/api/lines/active-buses');
export const getActiveBusesByLine = (lineId) => api.get(`/api/lines/${lineId}/active-buses`);

// ── Arrêts ──────────────────────────────────────
export const getStopsByLine = (lineId) => api.get(`/api/stops/line/${lineId}`);
export const getStopById = (id) => api.get(`/api/stops/${id}`);

// ── ETA ─────────────────────────────────────────
export const getArrivalsForStop = (stopId) => api.get(`/api/eta/stop/${stopId}/arrivals`);
export const getETAForLine = (tripId, lineId) => api.get(`/api/eta/trip/${tripId}/line/${lineId}`);
export const getTripDelay = (tripId) => api.get(`/api/eta/trip/${tripId}/delay`);

// ── Favoris ─────────────────────────────────────
export const addFavorite = (deviceId, lineId, stopId) => 
  api.post('/api/favorites', { device_id: deviceId, line_id: lineId, stop_id: stopId });
export const getFavorites = (deviceId) => api.get(`/api/favorites/${deviceId}`);
export const removeFavorite = (id, deviceId) => 
  api.delete(`/api/favorites/${id}?device_id=${deviceId}`);

// ── Auth chauffeur ──────────────────────────────
export const driverLogin = (email, password) => 
  api.post('/api/auth/driver/login', { email, password });

export default api;