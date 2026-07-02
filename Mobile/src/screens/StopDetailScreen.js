import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { getArrivalsForStop, getStopById } from '../services/api';

export default function StopDetailScreen({ route, navigation }) {
  const { stop } = route.params;
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArrivals();
    // Rafraîchir toutes les 15 secondes
    const interval = setInterval(loadArrivals, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadArrivals = async () => {
    try {
      const response = await getArrivalsForStop(stop.id);
      setArrivals(response.data);
    } catch (err) {
      console.error('Erreur ETA:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArrivals();
  };

  const renderArrival = ({ item }) => (
    <View style={styles.arrivalCard}>
      <View style={styles.arrivalLeft}>
        <View style={styles.tripBadge}>
          <Text style={styles.tripBadgeText}>Bus {item.trip_id}</Text>
        </View>
        <View style={styles.arrivalInfo}>
          <Text style={styles.arrivalLine}>Ligne en service</Text>
          <Text style={styles.arrivalUpdate}>
            Mis à jour : {new Date(item.last_update).toLocaleTimeString()}
          </Text>
        </View>
      </View>
      <View style={styles.arrivalRight}>
        <Text style={[
          styles.etaMinutes,
          { color: item.eta_minutes <= 5 ? '#5DE8A0' : item.eta_minutes <= 10 ? '#F5A623' : '#fff' }
        ]}>
          {item.eta_minutes}
        </Text>
        <Text style={styles.etaUnit}>min</Text>
        <Text style={styles.etaDistance}>{item.distance_km} km</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Calcul des temps d'arrivée...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{stop.name}</Text>
          <Text style={styles.subtitle}>Arrêt Dakar Dem Dikk</Text>
        </View>
      </View>

      {arrivals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚌</Text>
          <Text style={styles.emptyTitle}>Aucun bus en approche</Text>
          <Text style={styles.emptySubtitle}>
            Il n'y a pas de bus actif sur cette ligne pour l'instant.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadArrivals}>
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.nextBusCard}>
            <Text style={styles.nextBusLabel}>Prochain bus</Text>
            <Text style={styles.nextBusEta}>
              dans {arrivals[0]?.eta_minutes} min
            </Text>
            <Text style={styles.nextBusDetail}>
              à {arrivals[0]?.distance_km} km de cet arrêt
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Tous les passages</Text>

          <FlatList
            data={arrivals}
            renderItem={renderArrival}
            keyExtractor={(item) => item.trip_id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F5A623"
              />
            }
          />
        </>
      )}
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
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#90CAF9',
    marginTop: 2,
  },
  nextBusCard: {
    backgroundColor: '#1565C0',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextBusLabel: {
    fontSize: 12,
    color: '#90CAF9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextBusEta: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  nextBusDetail: {
    fontSize: 13,
    color: '#90CAF9',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 12,
  },
  arrivalCard: {
    backgroundColor: '#1A1008',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrivalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripBadge: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
  },
  tripBadgeText: {
    color: '#1A0800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  arrivalInfo: {
    flex: 1,
  },
  arrivalLine: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  arrivalUpdate: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  arrivalRight: {
    alignItems: 'flex-end',
  },
  etaMinutes: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  etaUnit: {
    color: '#888',
    fontSize: 12,
  },
  etaDistance: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1A0800',
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
});