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
    {"name": "Gare Ouakam",                         "lat": 14.7302, "lng": -17.4985},
    {"name": "Poste courant cité Assemblée Ouakam",  "lat": 14.7289, "lng": -17.4967},
    {"name": "Lycée Ouakam",                         "lat": 14.7275, "lng": -17.4952},
    {"name": "Marché Jeudi",                         "lat": 14.7261, "lng": -17.4938},
    {"name": "Arrêt station Shell Ouakam",           "lat": 14.7248, "lng": -17.4921},
    {"name": "Ecole 6",                              "lat": 14.7234, "lng": -17.4905},
    {"name": "Case des tous petits",                 "lat": 14.7219, "lng": -17.4889},
    {"name": "Pharmacie Mame Seynabou Diagne",       "lat": 14.7205, "lng": -17.4873},
    {"name": "Arrêt car rapide",                     "lat": 14.7191, "lng": -17.4857},
    {"name": "Pharmacie cité Avion",                 "lat": 14.7178, "lng": -17.4841},
    {"name": "Arret Terrain Foot",                   "lat": 14.7164, "lng": -17.4825},
    {"name": "Yum Yum Ouakam",                       "lat": 14.7150, "lng": -17.4809},
    {"name": "Sortie Ouakam",                        "lat": 14.7136, "lng": -17.4793},
    {"name": "Ecole Stella Maris",                   "lat": 14.7112, "lng": -17.4768},
    {"name": "Batrain",                              "lat": 14.7089, "lng": -17.4745},
    {"name": "Mosquée Rawane MBaye",                 "lat": 14.7067, "lng": -17.4723},
    {"name": "UVS Mermoz",                           "lat": 14.7045, "lng": -17.4701},
    {"name": "Mermoz",                               "lat": 14.7023, "lng": -17.4679},
    {"name": "Ambassade Niger",                      "lat": 14.7001, "lng": -17.4657},
    {"name": "Fann",                                 "lat": 14.6978, "lng": -17.4634},
    {"name": "UCAD 1",                               "lat": 14.6956, "lng": -17.4612},
    {"name": "UCAD 2",                               "lat": 14.6934, "lng": -17.4589},
    {"name": "Ecole Manguiers",                      "lat": 14.6912, "lng": -17.4567},
    {"name": "Police 4e",                            "lat": 14.6889, "lng": -17.4545},
    {"name": "Rue 31",                               "lat": 14.6867, "lng": -17.4523},
    {"name": "Marché Tilene",                        "lat": 14.6845, "lng": -17.4501},
    {"name": "Rue 11",                               "lat": 14.6823, "lng": -17.4478},
    {"name": "Poste Medina",                         "lat": 14.6801, "lng": -17.4456},
    {"name": "Crédit foncier Medina",                "lat": 14.6778, "lng": -17.4434},
    {"name": "Sandaga",                              "lat": 14.6756, "lng": -17.4412},
    {"name": "Peytavin",                             "lat": 14.6734, "lng": -17.4389},
    {"name": "En face Bijouterie Yoro Lam Ponty",    "lat": 14.6712, "lng": -17.4367},
    {"name": "Trésor Public",                        "lat": 14.6689, "lng": -17.4345},
    {"name": "BiCIS place de l'indépendance",        "lat": 14.6928, "lng": -17.4467},
    {"name": "Hôpital Principal",                    "lat": 14.6912, "lng": -17.4445},
    {"name": "Assemblée nationale",                  "lat": 14.6901, "lng": -17.4423},
    {"name": "Hopital Aristide Le Dantec",           "lat": 14.6889, "lng": -17.4401},
    {"name": "Gare Palais 2",                        "lat": 14.6937, "lng": -17.4441},
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