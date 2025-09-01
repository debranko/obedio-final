import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { requestsService } from '../services';
import { Request } from '../types/api';
import { COLORS, REFRESH_INTERVALS, STATUS_COLORS } from '../constants/config';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const result = await requestsService.getRequests({ limit: 50 });
    
    if (result.error) {
      setError(result.error);
      Alert.alert('Error', result.error);
    } else {
      setRequests(result.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchRequests();
    }, REFRESH_INTERVALS.REQUESTS);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    fetchRequests(true);
  };

  const handleRequestPress = (request: Request) => {
    Alert.alert(
      'Request Details',
      `Device: ${request.device.name || request.device.room}\nStatus: ${request.status}\nTime: ${new Date(request.timestamp).toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Complete', onPress: () => completeRequest(request.id) },
      ]
    );
  };

  const completeRequest = async (requestId: number) => {
    const result = await requestsService.completeRequest(requestId);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      fetchRequests();
    }
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  };

  const renderRequestItem = ({ item }: { item: Request }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => handleRequestPress(item)}
    >
      <View style={styles.requestHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {item.device.name || `Device ${item.device.id}`}
          </Text>
          <Text style={styles.roomName}>{item.device.room}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        {item.assignedUser && (
          <Text style={styles.assignedTo}>
            Assigned to: {item.assignedUser.name}
          </Text>
        )}
      </View>

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading && requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Requests</Text>
        <Text style={styles.headerSubtitle}>{requests.length} total</Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  roomName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  assignedTo: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    marginTop: 8,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
});