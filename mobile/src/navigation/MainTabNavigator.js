import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppState } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import AddItemScreen from '../screens/items/AddItemScreen';
import { useAuth } from '../context/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ChatListScreen from '../screens/chat/ChatListScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { notificationsAPI, chatAPI } from '../services/api';
import { initializeSocket, onNewMessage, removeMessageListener, onNotification, removeNotificationListener, getSocket } from '../services/socket';
import { DeviceEventEmitter } from 'react-native';
import { useTheme } from '../context/ThemeContext';



const Tab = createBottomTabNavigator();

// Placeholder screens
const ChatsScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 48 }}>💬</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16, color: colors.textPrimary }}>Chats</Text>
    </View>
  );
};

// (use actual NotificationsScreen & ProfileScreen imported above)

// Static Add Button (no animation)
const AnimatedAddButton = ({ onPress, isFocused }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{
        width: 70,
        height: 70,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: '50%',
        marginLeft: -35, // half width to center
        top: -24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999,
      }}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View>
        <Text style={{ fontSize: 32, color: colors.black, fontWeight: '300', marginTop: -4 }}>+</Text>
      </View>
    </TouchableOpacity>
  );
};

// Tab icon with optional bubble background when focused and optional badge
const TabIconBubble = ({ name, size = 24, focused, badgeCount, label }) => {
  const { colors } = useTheme();
  const iconSize = size ?? 24;
  // Use a consistent bubble size for all tabs (matches Notifications size)
  const bubbleWidth = 56;
  const bubbleHeight = 56;
  const iconColor = focused ? colors.white : colors.black;

  const bubbleStyle = {
    width: bubbleWidth,
    height: bubbleHeight,
    borderRadius: bubbleWidth / 2,
    backgroundColor: focused ? colors.primary : 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    // Keep a subtle shadow only when focused
    shadowColor: focused ? colors.primary : 'transparent',
    shadowOffset: { width: 0, height: focused ? 4 : 0 },
    shadowOpacity: focused ? 0.3 : 0,
    shadowRadius: focused ? 8 : 0,
    elevation: focused ? 6 : 0,
  };

  return (
    <View style={{ width: bubbleWidth + 4, height: bubbleHeight + 4, justifyContent: 'center', alignItems: 'center' }}>
      <View style={bubbleStyle}>
        {/* Icon placed above label when focused, otherwise center icon */}
        {focused && label ? (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <MaterialIcons name={name} size={iconSize - 2} color={iconColor} />
            <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{label}</Text>
          </View>
        ) : (
          <MaterialIcons name={name} size={iconSize} color={iconColor} />
        )}
      </View>
      {badgeCount > 0 && (
        <View style={{ position: 'absolute', top: 6, right: 8, backgroundColor: colors.lost, minWidth: 18, height: 18, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
};

const MainTabNavigator = () => {
  const [notificationBadge, setNotificationBadge] = useState(0);
  const [chatBadge, setChatBadge] = useState(0);
  const { user } = useAuth();
  const { colors } = useTheme();

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

    let mounted = true;
    let appState = AppState.currentState;

    const handleAppStateChange = (nextAppState) => {
      appState = nextAppState;
      // if app becomes active, trigger an immediate refresh
      if (appState === 'active' && mounted) fetchNotificationBadge();
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Run initial fetch once. Real-time updates will come from socket 'new_notification' events.
    fetchNotificationBadge();

    // Listen for explicit badge updates emitted by screens (e.g., when user
    // deletes or marks notifications as read) so the tab badge stays in sync.
    const notificationSubscription = DeviceEventEmitter.addListener('notificationBadgeUpdated', (newCount) => {
      setNotificationBadge(typeof newCount === 'number' ? newCount : (Number(newCount) || 0));
    });

    // Initialize socket and listen for new notifications to update badge instantly
    (async () => {
      try {
        await initializeSocket();
        // subscribe to notification events
        onNotification((notification) => {
          if (!mounted) return;
          setNotificationBadge((prev) => (prev || 0) + 1);
        });
      } catch (err) {
        console.error('Socket init error (notifications) in MainTabNavigator:', err);
      }
    })();

    return () => {
      mounted = false;
      // remove the AppState listener via the subscription returned by addEventListener
      if (appStateSubscription && typeof appStateSubscription.remove === 'function') {
        appStateSubscription.remove();
      }
      if (notificationSubscription && typeof notificationSubscription.remove === 'function') notificationSubscription.remove();
      // remove socket listeners for notifications
      try {
        removeNotificationListener();
      } catch (e) {}
    };
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

  let mounted = true;

  fetchChatBadge();

  // Initialize socket and listen for incoming messages so we can update the badge instantly
  (async () => {
    try {
      await initializeSocket();
      onNewMessage((newMessage) => {
        if (!mounted) return;
        if (newMessage && newMessage.sender_id && newMessage.sender_id !== user?.id) {
          setChatBadge((prev) => (prev || 0) + 1);
        }
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
  };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Keep labels consistent: Notifications -> Alerts, Profile -> You
        tabBarLabel: ({ focused, color }) => (
          focused ? null : (
            <Text style={{ fontSize: 11, fontWeight: '600', color: color ?? colors.textSecondary }}>
              {route.name === 'Notifications' ? 'Alerts' : route.name === 'Profile' ? 'You' : route.name}
            </Text>
          )
        ),
        tabBarStyle: {
          height: 80,
          paddingBottom: 8,
          paddingTop: 10,
          backgroundColor: colors.kk2,
          borderTopWidth: 4,
          borderTopColor: colors.black,
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
        options={{ tabBarIcon: ({ focused, size }) => <TabIconBubble name="home" size={size ?? 24} focused={focused} label="Home" /> }}
      />
      
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabIconBubble name="chat" size={size ?? 24} focused={focused} badgeCount={chatBadge} label="Chats" />
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
          tabBarIcon: ({ focused, size }) => (
            <TabIconBubble name="notifications" size={size ?? 24} focused={focused} badgeCount={notificationBadge} label="Alerts" />
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused, size }) => <TabIconBubble name="person" size={size ?? 24} focused={focused} label="You" /> }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;