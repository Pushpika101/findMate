import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../utils/colors';

const STORAGE_KEY = 'findmate_theme_mode'; // 'light' | 'dark' | 'system'

const ThemeContext = createContext({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
  colors: LIGHT_COLORS,
  isDark: false,
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [mode, setModeState] = useState('system');
  const [systemPref, setSystemPref] = useState(colorScheme || 'light');

  useEffect(() => {
    // listen for system changes
    const sub = Appearance.addChangeListener((p) => {
      setSystemPref(p.colorScheme || 'light');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setMode = async (m) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, m);
    } catch (e) {}
    setModeState(m);
  };

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
  };

  const isDark = useMemo(() => {
    if (mode === 'system') return systemPref === 'dark';
    return mode === 'dark';
  }, [mode, systemPref]);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
