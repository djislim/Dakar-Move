import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { getLineById, getActiveBusesByLine } from '../services/api';

export default function LineDetailScreen({ route, navigation }) {
  const { line } = route.params;
  const [stops, setStops] = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadActiveBuses, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const lineResponse = await getLineById(line.id);
      setStops(lineResponse.data.stops);
      await loadActiveBuses();
    } catch (err) {
      console.error('Erreur chargement ligne:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBuses = async () => {
    try {
      const response = await getActiveBusesByLine(line.id);
      setActiveBuses(response.data.buses);
    } catch (err) {
      console.error('Erreur bus actifs:', err);
    }
  };

  const renderStop = ({ item, index }) => (
    <TouchableOpacity
      style={styles.stopRow}
      onPress={() => navigation.navigate('StopDetail', { stop: item })}
    >
      <View style={styles.stopTimeline}>
        <View style={styles.stopCircle} />
        {index < stops.length - 1 && <View style={styles.stopLine} />}
      </View>
      <Text style={styles.stopName}>{item.name}</Text>
      <Text style={styles.stopArrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
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
          <Text style={styles.title}>Ligne {line.number}</Text>
          <Text style={styles.subtitle}>
            {line.origin} → {line.destination} · {stops.length} arrêts
          </Text>
        </View>
      </View>

      <View style={styles.infoCards}>
        <View style={styles.infoCard}>
          <Text style={[styles.infoValue, { color: '#5DE8A0' }]}>
            {activeBuses.length}
          </Text>
          <Text style={styles.infoLabel}>Bus actifs</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>
            {activeBuses.length > 0 ? `${activeBuses[0].delay_minutes || 0} min` : '—'}
          </Text>
          <Text style={styles.infoLabel}>Retard moyen</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Parcours — {stops.length} arrêts</Text>

      <FlatList
        data={stops}
        renderItem={renderStop}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
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
  infoCards: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  infoCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#222',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stopTimeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  stopCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1565C0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  stopLine: {
    width: 2,
    height: 24,
    backgroundColor: '#1565C0',
  },
  stopName: {
    color: '#fff',
    fontSize: 14,
    paddingTop: 1,
    paddingBottom: 14,
    flex: 1,
  },
  stopArrow: {
    color: '#888',
    fontSize: 18,
    paddingBottom: 14,
  },
});