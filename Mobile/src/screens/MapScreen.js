import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getActiveBuses, getLines } from '../services/api';
import { connectSocket, subscribeToLine, onBusPosition, offBusPosition } from '../services/socket';

export default function MapScreen({ navigation }) {
  const [buses, setBuses] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    loadData();
    const socket = connectSocket();

    // S'abonner à toutes les lignes pour recevoir les positions
    [1, 2, 3, 4].forEach(lineId => subscribeToLine(lineId));

    const handleBusPosition = (data) => {
      setBuses(prev => {
        const existing = prev.findIndex(b => b.trip_id === data.trip_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = {
            ...updated[existing],
            latitude: data.latitude,
            longitude: data.longitude,
            last_update: data.timestamp,
            delay_minutes: data.delay_minutes,
            is_delayed: data.is_delayed,
          };
          return updated;
        }
        return prev;
      });
    };

    onBusPosition(handleBusPosition);

    // Rafraîchir les bus actifs toutes les 15 secondes
    const interval = setInterval(loadActiveBuses, 15000);

    return () => {
      offBusPosition(handleBusPosition);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([loadActiveBuses(), loadLines()]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBuses = async () => {
    try {
      const response = await getActiveBuses();
      setBuses(response.data.buses);
    } catch (err) {
      console.error('Erreur bus actifs:', err);
    }
  };

  const loadLines = async () => {
    try {
      const response = await getLines();
      setLines(response.data);
    } catch (err) {
      console.error('Erreur lignes:', err);
    }
  };

  const getLineColor = (lineNumber) => {
    const colors = { '7': '#C4522A', '9': '#1A6B8A', '10': '#5A7A18', '23': '#8A3A6A' };
    return colors[lineNumber] || '#F5A623';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Carte en direct</Text>
          <Text style={styles.subtitle}>{buses.length} bus actif(s)</Text>
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 14.7167,
          longitude: -17.4677,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {buses.map((bus) => (
          <Marker
            key={bus.trip_id}
            coordinate={{
              latitude: parseFloat(bus.latitude),
              longitude: parseFloat(bus.longitude),
            }}
            title={`Ligne ${bus.line_number}`}
            description={bus.is_delayed ? `⚠️ Retard ${bus.delay_minutes} min` : '✅ À l\'heure'}
          >
            <View style={[styles.busMarker, { backgroundColor: bus.line_color || '#F5A623' }]}>
              <Text style={styles.busMarkerText}>{bus.line_number}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Légende des lignes */}
      <View style={styles.legend}>
        {lines.map(line => (
          <TouchableOpacity
            key={line.id}
            style={[styles.legendItem, { borderColor: line.color }]}
            onPress={() => navigation.navigate('LineDetail', { line })}
          >
            <View style={[styles.legendDot, { backgroundColor: line.color }]} />
            <Text style={styles.legendText}>L{line.number}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1A24',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D1A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1565C0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#90CAF9',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  busMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  busMarkerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#1A1008',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
});