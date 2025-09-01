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
import { crewService } from '../services';
import { User } from '../types/api';
import { COLORS, REFRESH_INTERVALS } from '../constants/config';

export default function CrewScreen() {
  const [crew, setCrew] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredCrew, setFilteredCrew] = useState<User[]>([]);

  const fetchCrew = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const result = await crewService.getCrew();
    
    if (result.error) {
      setError(result.error);
      Alert.alert('Error', result.error);
    } else {
      setCrew(result.data || []);
      setFilteredCrew(result.data || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCrew();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchCrew();
    }, REFRESH_INTERVALS.CREW);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter crew based on search text
    if (searchText.trim() === '') {
      setFilteredCrew(crew);
    } else {
      const filtered = crew.filter(member =>
        member.name.toLowerCase().includes(searchText.toLowerCase()) ||
        member.role.toLowerCase().includes(searchText.toLowerCase()) ||
        member.department?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCrew(filtered);
    }
  }, [searchText, crew]);

  const onRefresh = () => {
    fetchCrew(true);
  };

  const handleCrewPress = (member: User) => {
    const shiftInfo = member.currentShift 
      ? `Current Shift: ${new Date(member.currentShift.startTime).toLocaleTimeString()} - ${new Date(member.currentShift.endTime).toLocaleTimeString()}\nHours Left: ${member.currentShift.hoursLeft}h`
      : 'No active shift';

    Alert.alert(
      'Crew Member Details',
      `Name: ${member.name}\nRole: ${member.role}\nDepartment: ${member.department || 'N/A'}\nStatus: ${member.status || 'Unknown'}\nCabin: ${member.cabin || 'N/A'}\nActive Requests: ${member.activeRequests}\n\n${shiftInfo}`,
      [
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'on_duty': return COLORS.success;
      case 'on_leave': return COLORS.warning;
      case 'off_duty': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'on_duty': return 'On Duty';
      case 'on_leave': return 'On Leave';
      case 'off_duty': return 'Off Duty';
      default: return 'Unknown';
    }
  };

  const renderCrewItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.crewCard}
      onPress={() => handleCrewPress(item)}
    >
      <View style={styles.crewHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.crewInfo}>
          <Text style={styles.crewName}>{item.name}</Text>
          <Text style={styles.crewRole}>{item.role}</Text>
          {item.department && (
            <Text style={styles.crewDepartment}>{item.department}</Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.crewStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Hours This Week</Text>
          <Text style={styles.statValue}>{item.hoursThisWeek}h</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Active Requests</Text>
          <Text style={[
            styles.statValue,
            { color: item.activeRequests > 0 ? COLORS.warning : COLORS.success }
          ]}>
            {item.activeRequests}
          </Text>
        </View>
        {item.cabin && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cabin</Text>
            <Text style={styles.statValue}>{item.cabin}</Text>
          </View>
        )}
      </View>

      {item.currentShift && (
        <View style={styles.shiftInfo}>
          <Text style={styles.shiftLabel}>Current Shift</Text>
          <Text style={styles.shiftTime}>
            {new Date(item.currentShift.startTime).toLocaleTimeString()} - 
            {new Date(item.currentShift.endTime).toLocaleTimeString()}
          </Text>
          <Text style={styles.shiftRemaining}>
            {item.currentShift.hoursLeft}h remaining
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && crew.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading crew...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crew</Text>
        <Text style={styles.headerSubtitle}>
          {filteredCrew.length} of {crew.length} members
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search crew members..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <FlatList
        data={filteredCrew}
        renderItem={renderCrewItem}
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
  crewCard: {
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
  crewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  crewRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  crewDepartment: {
    fontSize: 12,
    color: COLORS.primary,
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
  crewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  shiftInfo: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  shiftLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  shiftRemaining: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
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