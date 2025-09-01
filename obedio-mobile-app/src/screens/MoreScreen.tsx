import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { authService, apiService } from '../services';
import { COLORS, APP_CONFIG, API_CONFIG } from '../constants/config';

export default function MoreScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const result = await authService.logout();
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Success', 'Logged out successfully');
            }
          }
        },
      ]
    );
  };

  const handleTestConnection = async () => {
    const isHealthy = await apiService.healthCheck();
    Alert.alert(
      'Connection Test',
      isHealthy ? 'Connection successful!' : 'Connection failed. Please check your network and server status.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About OBEDIO Mobile',
      `Version: ${APP_CONFIG.VERSION}\nBuild: ${APP_CONFIG.BUILD_NUMBER}\n\nOBEDIO Mobile is a comprehensive crew management and device monitoring application for maritime operations.`,
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Settings functionality will be implemented in future updates.',
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'For technical support, please contact your system administrator or IT department.',
      [{ text: 'OK' }]
    );
  };

  const MenuItem = ({ 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
          )}
        </View>
        {rightComponent || (showArrow && (
          <Text style={styles.menuItemArrow}>›</Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>Settings and Information</Text>
      </View>

      {/* User Profile Section */}
      <View style={styles.section}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>MS</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Maria Santos</Text>
            <Text style={styles.profileRole}>Crew Manager</Text>
            <Text style={styles.profileStatus}>On Duty • 2h 15m left</Text>
          </View>
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <MenuItem
          title="Notifications"
          subtitle="Push notifications for new requests"
          showArrow={false}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={notificationsEnabled ? 'white' : COLORS.textSecondary}
            />
          }
        />

        <MenuItem
          title="Dark Mode"
          subtitle="Switch to dark theme"
          showArrow={false}
          rightComponent={
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={darkModeEnabled ? 'white' : COLORS.textSecondary}
            />
          }
        />

        <MenuItem
          title="General Settings"
          subtitle="App preferences and configuration"
          onPress={handleSettings}
        />
      </View>

      {/* System Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        
        <MenuItem
          title="Test Connection"
          subtitle={`Server: ${API_CONFIG.BASE_URL}`}
          onPress={handleTestConnection}
        />

        <MenuItem
          title="System Status"
          subtitle="View system health and statistics"
          onPress={() => Alert.alert('Info', 'System status is available on the Dashboard')}
        />
      </View>

      {/* Support & Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Information</Text>
        
        <MenuItem
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={handleSupport}
        />

        <MenuItem
          title="About"
          subtitle={`Version ${APP_CONFIG.VERSION}`}
          onPress={handleAbout}
        />
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          OBEDIO Mobile v{APP_CONFIG.VERSION}
        </Text>
        <Text style={styles.footerText}>
          Build {APP_CONFIG.BUILD_NUMBER}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  section: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    padding: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileStatus: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuItemArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});