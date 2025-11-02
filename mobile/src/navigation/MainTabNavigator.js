import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import COLORS from '../utils/colors';

const Tab = createBottomTabNavigator();

// Placeholder screens for now
const ChatsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>💬 Chats</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>🔔 Notifications</Text>
    <Text style={styles.placeholderSubtext}>Coming soon...</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { logout } = require('../context/AuthContext').useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>👤 Profile</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Add Button Component
const AddButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.addButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.addButtonText}>+</Text>
  </TouchableOpacity>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: true
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🏠</Text>
          )
        }}
      />

      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>💬</Text>
          ),
          tabBarBadge: 3 // Example badge
        }}
      />

      <Tab.Screen
        name="Add"
        component={HomeScreen} // Placeholder, we'll create AddItemScreen later
        options={{
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <AddButton
              onPress={() => {
                // TODO: Navigate to Add Item Screen
                alert('Add Item screen coming soon!');
              }}
            />
          )
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🔔</Text>
          ),
          tabBarBadge: 5 // Example badge
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>👤</Text>
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 0,
    paddingTop: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    // Position the tab bar slightly above the bottom so it doesn't sit flush with device bottom/safe-area
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 16,
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  addButtonText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
    marginTop: -4
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24
  },
  placeholderText: {
    fontSize: 32,
    marginBottom: 8
  },
  placeholderSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  logoutButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.error,
    borderRadius: 8
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default MainTabNavigator;