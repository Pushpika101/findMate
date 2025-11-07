import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const AnimatedAddButton = ({ onPress, isFocused }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const { colors } = useTheme();

  useEffect(() => {
    if (isFocused) {
      // When AddItem screen is focused, rotate the button
      Animated.spring(rotateAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [isFocused]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
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
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { rotate: rotation },
          ],
        }}
      >
        <Text
          style={{
            fontSize: 32,
            color: colors.white,
            fontWeight: '300',
            marginTop: -4,
          }}
        >
          +
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedAddButton;