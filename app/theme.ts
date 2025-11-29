/**
 * Dark Theme Design System
 * Based on modern best practices (Discord, Telegram, Slack)
 */

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0F0F0F',      // Main background
    secondary: '#1A1A1A',    // Cards, elevated surfaces
    tertiary: '#242424',     // Inputs, hover states
  },
  
  // Text
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#B3B3B3',    // Secondary text
    tertiary: '#737373',     // Disabled, timestamps
  },
  
  // Accent (Purple/Violet - modern, premium feel)
  accent: {
    primary: '#8B5CF6',      // Main actions
    hover: '#7C3AED',        // Hover state
    pressed: '#6D28D9',      // Pressed state
    subtle: '#8B5CF620',     // Backgrounds (20% opacity)
  },
  
  // Semantic
  success: '#10B981',        // Green
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red
  info: '#3B82F6',           // Blue
  
  // Borders
  border: {
    subtle: '#2A2A2A',       // Subtle dividers
    default: '#3A3A3A',      // Default borders
    strong: '#4A4A4A',       // Emphasized borders
  },
  
  // Type-specific colors (with subtle backgrounds)
  types: {
    preference: {
      color: '#8B5CF6',
      bg: '#8B5CF620',
    },
    fact: {
      color: '#10B981',
      bg: '#10B98120',
    },
    conversation: {
      color: '#3B82F6',
      bg: '#3B82F620',
    },
    event: {
      color: '#F59E0B',
      bg: '#F59E0B20',
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const typography = {
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  
  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  
  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Helper function to get type colors
export const getTypeColor = (type?: string) => {
  switch (type) {
    case 'preference': return colors.types.preference.color;
    case 'fact': return colors.types.fact.color;
    case 'conversation': return colors.types.conversation.color;
    case 'event': return colors.types.event.color;
    default: return colors.text.tertiary;
  }
};

export const getTypeBg = (type?: string) => {
  switch (type) {
    case 'preference': return colors.types.preference.bg;
    case 'fact': return colors.types.fact.bg;
    case 'conversation': return colors.types.conversation.bg;
    case 'event': return colors.types.event.bg;
    default: return colors.bg.tertiary;
  }
};

export const getTypeIcon = (type?: string) => {
  switch (type) {
    case 'preference': return '⚙️';
    case 'fact': return '📌';
    case 'conversation': return '💬';
    case 'event': return '📅';
    default: return '📝';
  }
};
