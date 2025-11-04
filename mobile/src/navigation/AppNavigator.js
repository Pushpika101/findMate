import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import AddItemScreen from '../screens/items/AddItemScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';
import MyItemsScreen from '../screens/items/MyItemsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import EditItemScreen from '../screens/items/EditItemScreen';
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="MyItems" component={MyItemsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
  <Stack.Screen name="EditItem" component={EditItemScreen} />
      <Stack.Screen 
        name="AddItem" 
        component={AddItemScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;