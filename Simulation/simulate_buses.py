import time
import math
import random
import requests
import json

# ── Configuration ──────────────────────────────────────
API_URL = "http://localhost:3000"
DRIVER_EMAIL = "moussa@dakarmove.sn"
DRIVER_PASSWORD = "postgres1"
LINE_ID = 1
INTERVAL = 5  # secondes entre chaque mise à jour GPS

# ── Arrêts de la ligne 7 (Gare Palais → Ouakam) ───────
STOPS = [
    {"name": "Gare Palais",            "lat": 14.6937, "lng": -17.4441},
    {"name": "Place de l'Indépendance","lat": 14.6928, "lng": -17.4467},
    {"name": "Kermel",                 "lat": 14.6912, "lng": -17.4423},
    {"name": "HLM",                    "lat": 14.7089, "lng": -17.4502},
    {"name": "Liberté 5",              "lat": 14.7198, "lng": -17.4587},
    {"name": "Liberté 6",              "lat": 14.7243, "lng": -17.4623},
    {"name": "Fann Résidence",         "lat": 14.7312, "lng": -17.4701},
    {"name": "Point E",                "lat": 14.7356, "lng": -17.4734},
    {"name": "Mermoz",                 "lat": 14.7289, "lng": -17.4812},
    {"name": "Ouakam",                 "lat": 14.7198, "lng": -17.4923},
]

def interpolate(start, end, steps):
    """Génère des points GPS entre deux arrêts"""
    points = []
    for i in range(steps):
        t = i / steps
        lat = start["lat"] + (end["lat"] - start["lat"]) * t
        lng = start["lng"] + (end["lng"] - start["lng"]) * t
        # Légère variation pour simuler la route réelle
        lat += random.uniform(-0.0002, 0.0002)
        lng += random.uniform(-0.0002, 0.0002)
        points.append({"lat": lat, "lng": lng})
    return points

def login():
    """Connexion chauffeur et récupération du token JWT"""
    print("🔐 Connexion chauffeur...")
    response = requests.post(f"{API_URL}/api/auth/driver/login", json={
        "email": DRIVER_EMAIL,
        "password": DRIVER_PASSWORD
    })
    data = response.json()
    if response.status_code == 200:
        print(f"✅ Connecté : {data['driver']['name']}")
        return data["token"]
    else:
        print(f"❌ Erreur login : {data}")
        return None

def start_trip(token):
    """Démarrer le voyage"""
    print("🚌 Démarrage du voyage...")
    response = requests.post(
        f"{API_URL}/driver/start",
        json={"line_id": LINE_ID},
        headers={"Authorization": f"Bearer {token}"}
    )
    data = response.json()
    if response.status_code == 200:
        print(f"✅ Voyage démarré — ID : {data['trip']['id']}")
        return data["trip"]["id"]
    else:
        print(f"❌ Erreur démarrage : {data}")
        return None

def send_location(token, trip_id, lat, lng):
    """Envoyer position GPS au serveur"""
    response = requests.post(
        f"{API_URL}/driver/location",
        json={"trip_id": trip_id, "latitude": lat, "longitude": lng},
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.status_code == 200

def stop_trip(token, trip_id):
    """Terminer le voyage"""
    requests.post(
        f"{API_URL}/driver/stop",
        json={"trip_id": trip_id},
        headers={"Authorization": f"Bearer {token}"}
    )
    print("🏁 Voyage terminé !")

def simulate():
    """Simulation complète d'un bus sur la ligne 7"""
    print("=" * 50)
    print("🚌 DAKAR MOVE — Simulation GPS Bus Ligne 7")
    print("=" * 50)

    # Login
    token = login()
    if not token:
        return

    # Démarrer le voyage
    trip_id = start_trip(token)
    if not trip_id:
        return

    print(f"\n📍 Départ : {STOPS[0]['name']}")
    print(f"🏁 Arrivée : {STOPS[-1]['name']}")
    print(f"⏱️  Mise à jour toutes les {INTERVAL} secondes\n")

    try:
        # Parcourir chaque segment entre deux arrêts
        for i in range(len(STOPS) - 1):
            start = STOPS[i]
            end = STOPS[i + 1]

            print(f"➡️  {start['name']} → {end['name']}")

            # Simuler embouteillage aléatoire
            steps = random.randint(5, 10)
            delay = random.choice([0, 0, 0, 2, 5])  # 30% chance de retard
            if delay > 0:
                print(f"   ⚠️  Embouteillage détecté — retard {delay}s")

            points = interpolate(start, end, steps)
            for point in points:
                success = send_location(token, trip_id, point["lat"], point["lng"])
                status = "✅" if success else "❌"
                print(f"   {status} GPS envoyé : {point['lat']:.4f}, {point['lng']:.4f}")
                time.sleep(INTERVAL + delay)

            print(f"   🛑 Arrêt : {end['name']}\n")
            time.sleep(3)  # Pause à l'arrêt

    except KeyboardInterrupt:
        print("\n⚠️  Simulation arrêtée manuellement")
    finally:
        stop_trip(token, trip_id)

if __name__ == "__main__":
    simulate()