import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      {/* Add more screens here later like ItemDetail, EditItem, etc. */}
    </Stack.Navigator>
  );
};

export default MainNavigator;