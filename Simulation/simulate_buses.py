import time
import random
import requests
import psycopg2
import sys

# ── Configuration ──────────────────────────────────────
API_URL = "http://localhost:3000"
DRIVER_EMAIL = "moussa@dakarmove.sn"
DRIVER_PASSWORD = "postgres1"
INTERVAL = 5  # secondes entre chaque mise à jour GPS

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "dakarmove",
    "user": "postgres",
    "password": "postgres1"
}

def get_stops_for_line(line_id):
    """Récupère les vrais arrêts d'une ligne depuis la base de données"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(
        "SELECT name, latitude, longitude FROM stops WHERE line_id = %s ORDER BY stop_order ASC",
        (line_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"name": r[0], "lat": float(r[1]), "lng": float(r[2])} for r in rows]

def get_line_info(line_id):
    """Récupère le nom de la ligne"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT number, name, origin, destination FROM lines WHERE id = %s", (line_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {"number": row[0], "name": row[1], "origin": row[2], "destination": row[3]}
    return None

def interpolate(start, end, steps):
    """Génère des points GPS entre deux arrêts"""
    points = []
    for i in range(steps):
        t = i / steps
        lat = start["lat"] + (end["lat"] - start["lat"]) * t
        lng = start["lng"] + (end["lng"] - start["lng"]) * t
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

def start_trip(token, line_id):
    """Démarrer le voyage"""
    print("🚌 Démarrage du voyage...")
    response = requests.post(
        f"{API_URL}/driver/start",
        json={"line_id": line_id},
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

def simulate(line_id=1):
    """Simulation complète d'un bus sur une ligne donnée"""
    print("=" * 50)
    print("🚌 DAKAR MOVE — Simulation GPS")
    print("=" * 50)

    # Récupérer infos de la ligne et ses arrêts depuis la BDD
    line_info = get_line_info(line_id)
    if not line_info:
        print(f"❌ Ligne {line_id} introuvable dans la base de données")
        return

    stops = get_stops_for_line(line_id)
    if len(stops) < 2:
        print(f"❌ Pas assez d'arrêts pour la ligne {line_id}")
        return

    print(f"📋 Ligne {line_info['number']} — {line_info['origin']} → {line_info['destination']}")
    print(f"📍 {len(stops)} arrêts chargés depuis la base de données\n")

    # Login
    token = login()
    if not token:
        return

    # Démarrer le voyage
    trip_id = start_trip(token, line_id)
    if not trip_id:
        return

    print(f"\n📍 Départ : {stops[0]['name']}")
    print(f"🏁 Arrivée : {stops[-1]['name']}")
    print(f"⏱️  Mise à jour toutes les {INTERVAL} secondes\n")

    try:
        for i in range(len(stops) - 1):
            start = stops[i]
            end = stops[i + 1]

            print(f"➡️  {start['name']} → {end['name']}")

            steps = random.randint(3, 6)
            delay = random.choice([0, 0, 0, 2, 5])
            if delay > 0:
                print(f"   ⚠️  Embouteillage détecté — retard {delay}s")

            points = interpolate(start, end, steps)
            for point in points:
                success = send_location(token, trip_id, point["lat"], point["lng"])
                status = "✅" if success else "❌"
                print(f"   {status} GPS envoyé : {point['lat']:.4f}, {point['lng']:.4f}")
                time.sleep(INTERVAL + delay)

            print(f"   🛑 Arrêt : {end['name']}\n")
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n⚠️  Simulation arrêtée manuellement")
    finally:
        stop_trip(token, trip_id)

if __name__ == "__main__":
    # Permet de choisir la ligne en argument : py simulate_buses.py 1
    line_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    simulate(line_id)