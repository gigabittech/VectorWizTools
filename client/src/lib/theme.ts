import { createTheme, MantineColorsTuple } from '@mantine/core';

// Define custom color palettes based on current theme
const navy: MantineColorsTuple = [
  '#f6f8fc',
  '#e8ecf4',
  '#ccd6e9',
  '#aabddc',
  '#85a8cf',
  '#6397c6',
  '#4c88c0',
  '#3a77b8',
  '#2d5a97',
  '#253f6b'
];

const green: MantineColorsTuple = [
  '#f0fdf4',
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e', // This matches our primary hsl(158, 64%, 52%)
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d'
];

const gray: MantineColorsTuple = [
  '#fafafa',
  '#f4f4f5',
  '#e4e4e7',
  '#d4d4d8',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#27272a',
  '#18181b'
];

export const theme = createTheme({
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, monospace',
  
  // Custom colors matching current palette
  colors: {
    navy,
    green,
    gray,
  },

  // Primary and default colors
  primaryColor: 'green',
  primaryShade: 5, // Points to our main green color

  // Default radius matching current theme
  defaultRadius: 'md',

  // Component defaults
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
  },

  // Dark color scheme colors to match current dark theme
  other: {
    // Current dark background: hsl(217, 32%, 17%) = #2a3441
    darkBackground: '#2a3441',
    // Current light background: hsl(210, 40%, 98%) = #fafbfc  
    lightBackground: '#fafbfc',
  }
});

// Pre-computed dark theme configuration to avoid re-renders
export const darkTheme = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    // Dark color palette matching current CSS variables
    dark: [
      '#fafbfc', // 0 - lightest (matching --foreground in dark mode)
      '#e8ecf4',
      '#ccd6e9', 
      '#aabddc',
      '#85a8cf',
      '#6397c6',
      '#4c88c0',
      '#3a4651', // 7 - card background (matching current --card in dark)
      '#2f3949', // 8 - darker elements  
      '#2a3441', // 9 - darkest (matching --background in dark)
    ],
  },
  other: {
    ...theme.other,
    // Ensure dark theme uses proper dark colors
    isDarkMode: true,
  }
});