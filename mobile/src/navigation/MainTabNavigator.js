import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AddItemScreen from '../screens/items/AddItemScreen';
import COLORS from '../utils/colors';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

// Placeholder screens
const ChatsScreen = () => (
  <View style={placeholderStyles.container}>
    <Text style={placeholderStyles.icon}>💬</Text>
    <Text style={placeholderStyles.title}>Chats</Text>
    <Text style={placeholderStyles.subtitle}>Coming soon...</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={placeholderStyles.container}>
    <Text style={placeholderStyles.icon}>🔔</Text>
    <Text style={placeholderStyles.title}>Notifications</Text>
    <Text style={placeholderStyles.subtitle}>Coming soon...</Text>
  </View>
);

const ProfileScreen = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={placeholderStyles.container}>
      <Text style={placeholderStyles.icon}>👤</Text>
      <Text style={placeholderStyles.title}>Profile</Text>
      <Text style={placeholderStyles.subtitle}>Coming soon...</Text>
      <TouchableOpacity style={placeholderStyles.logoutButton} onPress={handleLogout}>
        <Text style={placeholderStyles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Add Button Component
const AddButton = ({ onPress }) => (
  <TouchableOpacity
    style={addButtonStyles.button}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={addButtonStyles.text}>+</Text>
  </TouchableOpacity>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: tabBarStyles.bar,
        tabBarLabelStyle: tabBarStyles.label,
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
          tabBarBadge: 3
        }}
      />

      <Tab.Screen
        name="AddItem"
        component={AddItemScreen}
        options={({ navigation }) => ({
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <AddButton onPress={() => navigation.navigate('AddItem')} />
          )
        })}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🔔</Text>
          ),
          tabBarBadge: 5
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

// Separate style objects defined BEFORE they're used
const tabBarStyles = StyleSheet.create({
  bar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  label: {
    fontSize: 11,
    fontWeight: '600'
  }
});

const addButtonStyles = StyleSheet.create({
  button: {
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
  text: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
    marginTop: -4
  }
});

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24
  },
  icon: {
    fontSize: 48,
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  subtitle: {
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