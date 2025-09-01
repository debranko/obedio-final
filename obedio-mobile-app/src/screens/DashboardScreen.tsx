import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { systemService } from '../services';
import { SystemStatus } from '../types/api';
import { COLORS, REFRESH_INTERVALS } from '../constants/config';

export default function DashboardScreen() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemStatus = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const result = await systemService.getSystemStatus();
    
    if (result.error) {
      setError(result.error);
      Alert.alert('Error', result.error);
    } else {
      setSystemStatus(result.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSystemStatus();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, REFRESH_INTERVALS.DASHBOARD);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    fetchSystemStatus(true);
  };

  if (loading && !systemStatus) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>O</Text>
          </View>
          <View>
            <Text style={styles.appName}>OBEDIO</Text>
            <Text style={styles.subtitle}>Admin Control</Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Maria Santos</Text>
          <Text style={styles.userStatus}>On Duty • 2h 15m left</Text>
        </View>
      </View>

      {/* System Status */}
      {systemStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          {/* Device Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{systemStatus.devices.total}</Text>
              <Text style={styles.statLabel}>Total Devices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: COLORS.success }]}>
                {systemStatus.devices.online}
              </Text>
              <Text style={styles.statLabel}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: COLORS.warning }]}>
                {systemStatus.devices.lowBattery}
              </Text>
              <Text style={styles.statLabel}>Low Battery</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: COLORS.primary }]}>
                {systemStatus.requests.active}
              </Text>
              <Text style={styles.statLabel}>Active Requests</Text>
            </View>
          </View>

          {/* Alerts */}
          {systemStatus.devices.lowBattery > 0 && (
            <View style={[styles.alertCard, styles.warningAlert]}>
              <Text style={styles.alertTitle}>Low Battery Alert</Text>
              <Text style={styles.alertText}>
                {systemStatus.devices.lowBattery} devices need attention
              </Text>
            </View>
          )}

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <View style={styles.activityStats}>
              <View style={styles.activityItem}>
                <Text style={styles.activityNumber}>
                  {systemStatus.requests.today.new}
                </Text>
                <Text style={styles.activityLabel}>New Requests</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityNumber}>
                  {systemStatus.requests.today.completed}
                </Text>
                <Text style={styles.activityLabel}>Completed</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityNumber}>
                  {systemStatus.requests.averageResponseTime}m
                </Text>
                <Text style={styles.activityLabel}>Avg Response</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  userStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  alertCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  warningAlert: {
    backgroundColor: '#FFF3CD',
    borderLeftColor: COLORS.warning,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  alertText: {
    fontSize: 12,
    color: '#856404',
    marginTop: 4,
  },
  activitySection: {
    marginTop: 16,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
  },
  activityItem: {
    alignItems: 'center',
  },
  activityNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  activityLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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