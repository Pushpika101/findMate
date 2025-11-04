import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/home/HomeScreen';
import AddItemScreen from '../screens/items/AddItemScreen';
import COLORS from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ChatListScreen from '../screens/chat/ChatListScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { notificationsAPI, chatAPI } from '../services/api';
import { initializeSocket, onNewMessage, removeMessageListener } from '../services/socket';
import { DeviceEventEmitter } from 'react-native';



const Tab = createBottomTabNavigator();

// Placeholder screens
const ChatsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <Text style={{ fontSize: 48 }}>💬</Text>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>Chats</Text>
  </View>
);

// (use actual NotificationsScreen & ProfileScreen imported above)

// Animated Add Button
const AnimatedAddButton = ({ onPress, isFocused }) => {
  const navigation = useNavigation();
  // Start hidden and animate in when mounted or when navigation state changes
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [isFocused]);

  // Appear animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true })
    ]).start();

    // Re-appear when navigation state changes (e.g., returning from AddItem)
    const unsubscribe = navigation.addListener('state', () => {
      // Only animate in if currently hidden
      opacityAnim.stopAnimation((val) => {
        if (val === 0) {
          scaleAnim.setValue(0);
          opacityAnim.setValue(0);
          rotateAnim.setValue(0); // reset rotation back to plus
          Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 220, useNativeDriver: true })
          ]).start();
        }
      });
    });

    return unsubscribe;
  }, []);

  const handlePress = () => {
    // Navigate immediately for snappy UX, then run a short vanish animation for polish
    try {
      onPress();
    } catch (e) {
      // ignore navigation errors
    }

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 160, useNativeDriver: true })
    ]).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '0deg'],
  });

  return (
    <TouchableOpacity
      style={{
        width: 70,
        height: 70,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -24,
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999,
      }}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: rotation }], opacity: opacityAnim }}>
        <Text style={{ fontSize: 32, color: COLORS.black, fontWeight: '300', marginTop: -4 }}>+</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const MainTabNavigator = () => {
  const [notificationBadge, setNotificationBadge] = useState(0);
  const [chatBadge, setChatBadge] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotificationBadge = async () => {
      try {
        const response = await notificationsAPI.getUnreadCount();
        if (response && response.success) {
          setNotificationBadge(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notification badge:', error);
      }
    };

    fetchNotificationBadge();
    const interval = setInterval(fetchNotificationBadge, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchChatBadge = async () => {
      try {
        const response = await chatAPI.getUnreadCount?.();
        if (response && response.success) {
          setChatBadge(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching chat badge:', error);
      }
    };

    fetchChatBadge();
    const chatInterval = setInterval(fetchChatBadge, 10000);

    // Initialize socket and listen for incoming messages so we can update the badge instantly
    let mounted = true;
    (async () => {
      try {
        await initializeSocket();
        onNewMessage((newMessage) => {
          if (!mounted) return;

          // If the incoming message is from another user, increment badge count immediately
          if (newMessage && newMessage.sender_id && newMessage.sender_id !== user?.id) {
            setChatBadge((prev) => (prev || 0) + 1);
          }

          // Also trigger a background fetch to keep server/client in sync (debounced by interval)
        });
      } catch (err) {
        console.error('Socket init error in MainTabNavigator:', err);
      }
    })();

    const subscription = DeviceEventEmitter.addListener('chatBadgeUpdated', (newCount) => {
      setChatBadge(typeof newCount === 'number' ? newCount : (Number(newCount) || 0));
    });

    return () => {
      mounted = false;
      subscription.remove();
      removeMessageListener();
      clearInterval(chatInterval);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 80,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: COLORS.kk,
          borderTopWidth: 5,
          borderTopColor: COLORS.black,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginHorizontal: 12,
            overflow: 'visible',
          display: route.name === 'AddItem' ? 'none' : 'flex', // Hide on AddItem
          position: 'absolute',
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        }
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size ?? 24} color={color} /> }}
      />
      
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="chat" size={size ?? 24} color={color} />
              {chatBadge > 0 && (
                <View style={{ position: 'absolute', top: 0, right: -3, backgroundColor: COLORS.lost, minWidth: 20, height: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>{chatBadge > 99 ? '99+' : chatBadge}</Text>
                </View>
              )}
            </View>
          )
        }}
      />
      <Tab.Screen
        name="AddItem"
        component={AddItemScreen}
        options={({ navigation }) => ({
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <AnimatedAddButton
              onPress={() => navigation.navigate('AddItem')}
              isFocused={props.accessibilityState?.selected || false}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="notifications" size={size ?? 24} color={color} />
              {notificationBadge > 0 && (
                <View style={{ position: 'absolute', top: 0, right: -3, backgroundColor: COLORS.lost, minWidth: 20, height: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>{notificationBadge > 99 ? '99+' : notificationBadge}</Text>
                </View>
              )}
            </View>
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size ?? 24} color={color} /> }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;