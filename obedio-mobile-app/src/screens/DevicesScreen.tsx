import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { devicesService } from '../services';
import { Device } from '../types/api';
import { COLORS, REFRESH_INTERVALS, DEVICE_TYPES } from '../constants/config';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);

  const fetchDevices = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const result = await devicesService.getDevices({ limit: 100 });
    
    if (result.error) {
      setError(result.error);
      Alert.alert('Error', result.error);
    } else {
      setDevices(result.data);
      setFilteredDevices(result.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDevices();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchDevices();
    }, REFRESH_INTERVALS.DEVICES);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter devices based on search text
    if (searchText.trim() === '') {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(device =>
        device.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        device.room.toLowerCase().includes(searchText.toLowerCase()) ||
        device.uid.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDevices(filtered);
    }
  }, [searchText, devices]);

  const onRefresh = () => {
    fetchDevices(true);
  };

  const handleDevicePress = (device: Device) => {
    Alert.alert(
      'Device Details',
      `Name: ${device.name || 'N/A'}\nRoom: ${device.room}\nUID: ${device.uid}\nType: ${DEVICE_TYPES[device.type]}\nBattery: ${device.battery}%\nSignal: ${device.signal}%\nStatus: ${device.isActive ? 'Active' : 'Inactive'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Ping Device', onPress: () => pingDevice(device.id) },
      ]
    );
  };

  const pingDevice = async (deviceId: number) => {
    const result = await devicesService.pingDevice(deviceId);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', 'Device pinged successfully');
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery < 20) return COLORS.error;
    if (battery < 50) return COLORS.warning;
    return COLORS.success;
  };

  const getSignalColor = (signal: number) => {
    if (signal < 30) return COLORS.error;
    if (signal < 70) return COLORS.warning;
    return COLORS.success;
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleDevicePress(item)}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {item.name || `Device ${item.id}`}
          </Text>
          <Text style={styles.roomName}>{item.room}</Text>
          <Text style={styles.deviceType}>{DEVICE_TYPES[item.type]}</Text>
        </View>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.isActive ? COLORS.success : COLORS.error }
        ]} />
      </View>
      
      <View style={styles.deviceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Battery</Text>
          <Text style={[styles.statValue, { color: getBatteryColor(item.battery) }]}>
            {item.battery}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Signal</Text>
          <Text style={[styles.statValue, { color: getSignalColor(item.signal) }]}>
            {item.signal}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>UID</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {item.uid}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && devices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Devices</Text>
        <Text style={styles.headerSubtitle}>
          {filteredDevices.length} of {devices.length} devices
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search devices..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <FlatList
        data={filteredDevices}
        renderItem={renderDeviceItem}
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
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listContainer: {
    padding: 16,
  },
  deviceCard: {
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
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  deviceType: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
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