import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/home/HomeScreen';
import AddItemScreen from '../screens/items/AddItemScreen';
import COLORS from '../utils/colors';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

// Placeholder screens
const ChatsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <Text style={{ fontSize: 48 }}>💬</Text>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>Chats</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <Text style={{ fontSize: 48 }}>🔔</Text>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>Notifications</Text>
  </View>
);

const ProfileScreen = () => {
  const { logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ fontSize: 48 }}>👤</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>Profile</Text>
      <TouchableOpacity
        style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: COLORS.error, borderRadius: 8 }}
        onPress={logout}
      >
        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    // vanish animation: scale down + fade out + rotate
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start(() => {
      // navigate after animation completes
      onPress();
    });
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <TouchableOpacity
      style={{
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
        elevation: 8,
      }}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: rotation }], opacity: opacityAnim }}>
        <Text style={{ fontSize: 32, color: COLORS.white, fontWeight: '300', marginTop: -4 }}>+</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text> }} />
      <Tab.Screen name="Chats" component={ChatsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>💬</Text> }} />
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
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>🔔</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text> }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;