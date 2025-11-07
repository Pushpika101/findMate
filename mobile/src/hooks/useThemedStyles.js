import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Hook: accepts a factory that receives `colors` and returns a plain styles object.
// Returns a memoized StyleSheet that is regenerated when theme.colors changes.
export default function useThemedStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
