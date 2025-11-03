import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import AddItemScreen from '../screens/items/AddItemScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="AddItem" 
        component={AddItemScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;