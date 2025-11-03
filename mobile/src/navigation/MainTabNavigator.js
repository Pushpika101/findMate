import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AddItemScreen from '../screens/items/AddItemScreen'; // ADD THIS
import COLORS from '../utils/colors';

const Tab = createBottomTabNavigator();

// ... keep ChatsScreen, NotificationsScreen, ProfileScreen as before ...

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

      {/* ... keep other tabs ... */}

      <Tab.Screen
        name="AddItem"
        component={AddItemScreen}  // CHANGE THIS
        options={({ navigation }) => ({
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <AddButton
              onPress={() => navigation.navigate('AddItem')}  // CHANGE THIS
            />
          )
        })}
      />

      {/* ... rest of tabs ... */}
    </Tab.Navigator>
  );
};

// ... keep styles ...

export default MainTabNavigator;