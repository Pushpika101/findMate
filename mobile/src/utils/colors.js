export const LIGHT_COLORS = {
  // Primary Colors
  primary: '#1bb0f5ff',
  primaryDark: '#4338CA',
  primaryLight: '#66a7bdff',
  
  // Secondary Colors
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#94eecdff',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Lost & Found Specific
  lost: '#e32525ff',
  found: '#05c182ff',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  kk: '#c4e8f8ff',
  kk2: '#dcecf3ff',
  
  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Background Colors
  background: '#000000ff',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Transparent
  transparent: 'transparent'
};

export const DARK_COLORS = {
  // Primary tuned for dark background
  primary: '#60a5fa',
  primaryDark: '#2563EB',
  primaryLight: '#93c5fd',

  // Secondary
  secondary: '#34d399',
  secondaryDark: '#10b981',
  secondaryLight: '#6ee7b7',

  // Status
  success: '#34d399',
  warning: '#f59e0b',
  error: '#f87171',
  info: '#60a5fa',

  // Lost & Found Specific
  lost: '#f87171',
  found: '#34d399',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  kk: '#0c1b38ff',
  kk2: '#071224',

  // Gray Scale (dark theme equivalents)
  gray50: '#0b1220',
  gray100: '#0f1724',
  gray200: '#111827',
  gray300: '#1f2937',
  gray400: '#374151',
  gray500: '#4b5563',
  gray600: '#6b7280',
  gray700: '#9ca3af',
  gray800: '#d1d5db',
  gray900: '#f3f4f6',

  // Backgrounds
  background: '#0B1220',
  backgroundSecondary: '#071224',
  backgroundTertiary: '#0f1724',

  // Text
  textPrimary: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#0B1220',

  // Borders
  border: '#1f2937',
  borderLight: '#111827',
  borderDark: '#0b1220',

  // Shadow/overlay
  shadow: 'rgba(0,0,0,0.6)',
  shadowMedium: 'rgba(0,0,0,0.7)',
  shadowDark: 'rgba(0,0,0,0.85)',

  overlay: 'rgba(255,255,255,0.06)',
  overlayLight: 'rgba(255,255,255,0.03)',

  transparent: 'transparent'
};

export const GRADIENTS = {
  primary: ['#4F46E5', '#7C3AED'],
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626']
};

// For backward compatibility default to LIGHT_COLORS object
export const COLORS = LIGHT_COLORS;

export default COLORS;