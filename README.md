# 🚌 Dakar Move

**Application de suivi des bus Dakar Dem Dikk en temps réel**

> Développé par **Djibril Gueye & Mamadou Lamine Toure** — ISI Dakar 2026

[![Node.js](https://img.shields.io/badge/Node.js-v24-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-purple)](https://expo.dev)

---

## 📱 Présentation

Dakar Move permet aux usagers des bus **Dakar Dem Dikk** de :
- Voir la position des bus **en temps réel** sur une carte
- Connaître le **temps d'attente exact** à leur arrêt
- Recevoir des **alertes** en cas de retard ou déviation

Les chauffeurs DDD disposent d'un espace sécurisé pour transmettre leur position GPS depuis leur téléphone.

---

## 🏗️ Architecture
---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js v18+
- PostgreSQL 16
- Python 3.12+

### Backend

```bash
cd backend
npm install
```

Crée un fichier `.env` :
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dakarmove
DB_USER=postgres
DB_PASSWORD=tonmotdepasse
JWT_SECRET=dakar_move_secret_key_2026
JWT_EXPIRES_IN=8h
REDIS_URL=redis://localhost:6379
```

Crée la base de données :
```bash
psql -U postgres -c "CREATE DATABASE dakarmove;"
psql -U postgres -d dakarmove -f database.sql
```

Lance le serveur :
```bash
npm run dev
```

### Simulation GPS

```bash
cd simulation
pip install requests psycopg2-binary
python simulate_buses.py 1   # Simule la ligne 7
python simulate_buses.py 2   # Simule la ligne 9
python simulate_buses.py 3   # Simule la ligne 10
python simulate_buses.py 4   # Simule la ligne 23
```

---

## 📡 API Reference

**Base URL :** `http://localhost:3000`

### 🔓 Routes publiques (passagers)

#### Lignes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/lines` | Liste toutes les lignes |
| GET | `/api/lines/:id` | Détail d'une ligne + arrêts |
| GET | `/api/lines/active-buses` | Tous les bus actifs (carte) |
| GET | `/api/lines/:id/active-buses` | Bus actifs d'une ligne |

#### Arrêts
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/stops/line/:lineId` | Arrêts d'une ligne |
| GET | `/api/stops/:id` | Détail d'un arrêt |

#### ETA (Temps d'arrivée)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/eta/stop/:stopId/arrivals` | ETA de tous les bus à un arrêt |
| GET | `/api/eta/trip/:tripId/line/:lineId` | ETA pour tous les arrêts restants |
| GET | `/api/eta/trip/:tripId/stop/:stopId` | ETA pour un arrêt spécifique |
| GET | `/api/eta/trip/:tripId/delay` | Retard d'un bus |

### 🔐 Routes chauffeur (JWT requis)

#### Authentification
```http
POST /api/auth/driver/login
Content-Type: application/json

{
  "email": "chauffeur@dakarmove.sn",
  "password": "motdepasse"
}
```

**Réponse :**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGci...",
  "driver": {
    "id": 1,
    "name": "Moussa Diallo",
    "email": "moussa@dakarmove.sn",
    "line_id": 1
  }
}
```

#### Gestion du voyage
```http
POST /driver/start
Authorization: Bearer <token>

{ "line_id": 1 }
```

```http
POST /driver/location
Authorization: Bearer <token>

{
  "trip_id": 1,
  "latitude": 14.7302,
  "longitude": -17.4985
}
```

```http
POST /driver/stop
Authorization: Bearer <token>

{ "trip_id": 1 }
```

---

## 🔌 WebSocket

**Connexion :** `ws://localhost:3000`

### Événements côté passager

```javascript
// S'abonner à une ligne
socket.emit('subscribe:line', lineId);

// Recevoir les positions GPS en temps réel
socket.on('bus:position', (data) => {
  console.log(data);
  // { trip_id, line_id, latitude, longitude, timestamp }
});
```

### Événements côté chauffeur

```javascript
// Envoyer la position GPS
socket.emit('driver:location', {
  trip_id: 1,
  line_id: 1,
  latitude: 14.7302,
  longitude: -17.4985
});
```

---

## 🗄️ Base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `lines` | Lignes de bus DDD (7, 9, 10, 23) |
| `stops` | 142 arrêts réels (données app DemDikk) |
| `users` | Comptes chauffeurs |
| `trips` | Voyages en cours et historique |
| `bus_positions` | Positions GPS enregistrées |

### Lignes disponibles

| ID | Numéro | Trajet | Arrêts |
|----|--------|--------|--------|
| 1 | 7 | Gare Ouakam → Gare Palais 2 | 38 |
| 2 | 9 | Gare Liberté 6 → Gare Palais 2 | 29 |
| 3 | 10 | Gare Dieuppeul → Gare Palais 2 | 29 |
| 4 | 23 | Gare Parcelles Assainies → Gare Palais 2 | 46 |

---

## 👥 Équipe

| Membre | Rôle | Responsabilité |
|--------|------|----------------|
| **Djibril Gueye** | Backend | API, BDD, WebSocket, Simulation GPS |
| **Mamadou Lamine Toure** | Frontend | App mobile React Native, UI/UX |

---

## 📄 Licence

Projet éducatif — ISI Dakar 2026. Tous droits réservés.

---

*Dakar Move — Fini l'attente au hasard* 🚌