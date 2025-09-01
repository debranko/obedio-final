import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import {
  DashboardScreen,
  RequestsScreen,
  DevicesScreen,
  CrewScreen,
  MoreScreen,
} from '../screens';
import { COLORS } from '../constants/config';

const Tab = createBottomTabNavigator();

// Custom tab bar icon component
const TabIcon = ({ 
  name, 
  focused, 
  badge 
}: { 
  name: string; 
  focused: boolean; 
  badge?: number;
}) => {
  const getIconText = (iconName: string) => {
    switch (iconName) {
      case 'dashboard': return '📊';
      case 'requests': return '📋';
      case 'devices': return '📱';
      case 'crew': return '👥';
      case 'more': return '⚙️';
      default: return '•';
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[
        styles.tabIcon,
        { color: focused ? COLORS.primary : COLORS.textSecondary }
      ]}>
        {getIconText(name)}
      </Text>
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName = route.name.toLowerCase();
          let badge: number | undefined;

          // Add badge for requests tab (simulated)
          if (route.name === 'Requests') {
            badge = 4; // This would come from your state management
          }

          return (
            <TabIcon 
              name={iconName} 
              focused={focused} 
              badge={badge}
            />
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Requests" 
        component={RequestsScreen}
        options={{
          tabBarLabel: 'Requests',
        }}
      />
      <Tab.Screen 
        name="Devices" 
        component={DevicesScreen}
        options={{
          tabBarLabel: 'Devices',
        }}
      />
      <Tab.Screen 
        name="Crew" 
        component={CrewScreen}
        options={{
          tabBarLabel: 'Crew',
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});