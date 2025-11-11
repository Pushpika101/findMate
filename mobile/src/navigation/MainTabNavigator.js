import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, Platform, Animated, StyleSheet, Dimensions } from 'react-native';
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

  // Custom tab bar that measures tab positions and animates an absolute bubble/pill
  const CustomTabBar = ({ state, descriptors, navigation }) => {
    const { colors } = useTheme();
    const containerWidth = useRef(Dimensions.get('window').width);
    const layoutRef = useRef({}); // routeName -> { x, width }
    const [measured, setMeasured] = useState(false);
    const bubbleX = useRef(new Animated.Value(0)).current;
    const bubbleW = useRef(new Animated.Value(64)).current;
    const containerLeft = useRef(0);

    const onContainerLayout = (e) => {
      containerLeft.current = e.nativeEvent.layout.x || 0;
    };

    // Called when each tab measures
    const onMeasure = (routeKey, e) => {
      const { x, width } = e.nativeEvent.layout;
      layoutRef.current[routeKey] = { x, width };
      // When we've measured all routes we can animate the bubble to the active one
      if (Object.keys(layoutRef.current).length >= state.routes.length) {
        setMeasured(true);
      }
    };

    // animate when active index changes and we've measured
    useEffect(() => {
      if (!measured) return;
      const activeRoute = state.routes[state.index];
      const m = layoutRef.current[activeRoute.key];
      if (!m) return;
  const targetW = Math.max(64, m.width + 12);
  // Small nudge for specific tabs to avoid overlapping the centered Add button
  // apply same left nudge for Chats and Profile
  const lateralNudge = (activeRoute.name === 'Chats' || activeRoute.name === 'Profile') ? -18 : 0; // move left when on Chats or Profile
  const targetX = m.x + m.width / 2 - targetW / 2 + lateralNudge;

  

      Animated.parallel([
        // use JS driver for both to avoid mixing native and JS-driven animations
        Animated.spring(bubbleX, { toValue: targetX, useNativeDriver: false, speed: 20, bounciness: 8 }),
        Animated.timing(bubbleW, { toValue: targetW, duration: 180, useNativeDriver: false }),
      ]).start();
    }, [state.index, measured]);

    // helper for icon name mapping (keep in sync with Tab.Screen icons)
    const iconFor = (name) => {
      switch (name) {
        case 'Home': return 'home';
        case 'Chats': return 'chat';
        case 'Notifications': return 'notifications';
        case 'Profile': return 'person';
        default: return 'circle';
      }
    };

    return (
      <View onLayout={onContainerLayout} style={[styles.tabBarContainer, { backgroundColor: colors.kk2 }]}>
        {/* animated bubble: hide when AddItem is active */}
        {state.routes[state.index] && state.routes[state.index].name !== 'AddItem' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              {
                backgroundColor: colors.primary,
                transform: [{ translateX: bubbleX }],
              },
              { width: bubbleW },
            ]}
          >
            {/* Render the active icon+label inside the bubble */}
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name={iconFor(state.routes[state.index].name)} size={22} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{descriptors[state.routes[state.index].key].options.title ?? state.routes[state.index].name}</Text>

              {/* Render unread badge inside the bubble when active */}
              {state.routes[state.index].name === 'Chats' && chatBadge > 0 && (
                <View style={[styles.bubbleBadge, { backgroundColor: colors.lost }]}> 
                  <Text style={styles.badgeText}>{chatBadge > 99 ? '99+' : chatBadge}</Text>
                </View>
              )}
              {state.routes[state.index].name === 'Notifications' && notificationBadge > 0 && (
                <View style={[styles.bubbleBadge, { backgroundColor: colors.lost }]}> 
                  <Text style={styles.badgeText}>{notificationBadge > 99 ? '99+' : notificationBadge}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Tab buttons (icons + badges). They remain in normal flow so layout doesn't change. */}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];

          // center AddItem as a special button
          if (route.name === 'AddItem') {
            return (
              <View key={route.key} onLayout={(e) => onMeasure(route.key, e)} style={styles.tabItemContainer}>
                <AnimatedAddButton onPress={() => navigation.navigate('AddItem')} isFocused={focused} />
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
              onLayout={(e) => onMeasure(route.key, e)}
              style={styles.tabItemContainer}
            >
              <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name={iconFor(route.name)} size={24} color={focused ? colors.white : colors.black} />
                {/* badges: keep rendered above bubble, but only when not focused (active tab shows badge inside bubble) */}
                {route.name === 'Chats' && chatBadge > 0 && !focused && (
                  <View style={[styles.badge, { backgroundColor: colors.lost }]}> 
                    <Text style={styles.badgeText}>{chatBadge > 99 ? '99+' : chatBadge}</Text>
                  </View>
                )}
                {route.name === 'Notifications' && notificationBadge > 0 && !focused && (
                  <View style={[styles.badge, { backgroundColor: colors.lost }]}> 
                    <Text style={styles.badgeText}>{notificationBadge > 99 ? '99+' : notificationBadge}</Text>
                  </View>
                )}
              </View>
              {/* label - hide for focused since bubble shows it */}
              <Text style={{ fontSize: 11, fontWeight: '600', color: focused ? 'transparent' : colors.textSecondary, marginTop: 6 }}>{options.title ?? route.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />

      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{ title: 'Chats' }}
      />
      <Tab.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: 'Add' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};
export default MainTabNavigator;

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 80,
    paddingBottom: 8,
    paddingTop: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginHorizontal: 5,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    overflow: 'visible',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItemContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    bottom: 12,
    height: 56,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    left: 12,
    zIndex: 1,
    elevation: 6,
    paddingHorizontal: 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  bubbleBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 30,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  }
});