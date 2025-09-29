import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
type ColorScheme = 'light' | 'dark';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider');
  }
  return context;
}

interface ColorSchemeProviderProps {
  children: ReactNode;
}

export function ColorSchemeProvider({ children }: ColorSchemeProviderProps) {
  // Initialize from the DOM attribute set by ColorSchemeScript to avoid flash
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      const mantineScheme = document.documentElement.getAttribute('data-mantine-color-scheme');
      return (mantineScheme === 'dark' ? 'dark' : 'light');
    }
    return 'light';
  });

  // Sync with DOM changes (in case dark mode is toggled elsewhere)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const newScheme = isDark ? 'dark' : 'light';
      if (newScheme !== colorScheme) {
        setColorScheme(newScheme);
        document.documentElement.setAttribute('data-mantine-color-scheme', newScheme);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [colorScheme]);

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    
    // Update DOM state (single source of truth)
    if (newScheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Update Mantine attribute and React state
    document.documentElement.setAttribute('data-mantine-color-scheme', newScheme);
    setColorScheme(newScheme);
  };

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}