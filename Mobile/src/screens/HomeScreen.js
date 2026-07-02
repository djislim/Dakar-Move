import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { getLines } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
      const response = await getLines();
      setLines(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement lignes:', err);
      setError('Impossible de charger les lignes. Vérifie que le backend est lancé.');
    } finally {
      setLoading(false);
    }
  };

  const renderLine = ({ item }) => (
    <TouchableOpacity
      style={styles.lineCard}
      onPress={() => navigation.navigate('LineDetail', { line: item })}
    >
      <View style={[styles.lineBadge, { backgroundColor: item.color }]}>
        <Text style={styles.lineBadgeText}>{item.number}</Text>
      </View>
      <View style={styles.lineInfo}>
        <Text style={styles.lineName}>Ligne {item.number}</Text>
        <Text style={styles.lineRoute}>
          {item.origin} → {item.destination}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Chargement des lignes...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLines}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dakar Move</Text>
        <Text style={styles.subtitle}>Dakar — Zone urbaine</Text>
      </View>

      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => navigation.navigate('Map')}
      >
        <Text style={styles.mapButtonText}>🗺️ Voir la carte en direct</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Lignes disponibles</Text>

      <FlatList
        data={lines}
        renderItem={renderLine}
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
    padding: 20,
  },
  header: {
    backgroundColor: '#1565C0',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#90CAF9',
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: '#1565C0',
    margin: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 12,
  },
  lineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1008',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  lineBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lineBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lineRoute: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
  errorText: {
    color: '#E07A52',
    textAlign: 'center',
    marginBottom: 16,
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
});