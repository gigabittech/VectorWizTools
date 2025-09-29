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
  '#16a34a', // This matches our primary hsl(142, 76%, 36%)
  '#15803d',
  '#166534',
  '#14532d',
  '#052e16'
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
  primaryShade: 5, // Points to our main green color hsl(142, 76%, 36%)

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

  // Additional theme properties
  other: {
    // Consistent with CSS variables
    darkBackground: 'hsl(217, 32%, 17%)',
    lightBackground: 'hsl(0, 0%, 100%)',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(38, 92%, 50%)',
    info: 'hsl(199, 89%, 48%)',
  }
});

// Pre-computed dark theme configuration to avoid re-renders
export const darkTheme = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    // Dark color palette matching CSS variables
    dark: [
      'hsl(210, 40%, 98%)', // 0 - lightest (foreground in dark mode)
      'hsl(217, 32%, 91%)', // 1
      'hsl(217, 32%, 85%)', // 2
      'hsl(217, 32%, 78%)', // 3
      'hsl(215, 20%, 70%)', // 4 - muted foreground
      'hsl(217, 32%, 45%)', // 5
      'hsl(217, 32%, 32%)', // 6
      'hsl(217, 32%, 27%)', // 7 - border/input
      'hsl(217, 32%, 24%)', // 8 - secondary/muted
      'hsl(217, 32%, 20%)', // 9 - card
      'hsl(217, 32%, 17%)', // 10 - background
    ],
  },
  other: {
    ...theme.other,
    // Ensure dark theme uses proper dark colors
    isDarkMode: true,
  }
});