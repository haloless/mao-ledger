import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Theme } from './theme';

const STORAGE_KEY = 'mao-ledger-theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const savedTheme = window.localStorage?.getItem(STORAGE_KEY);
    return savedTheme === 'cute' || savedTheme === 'cool' || savedTheme === 'minimal'
      ? savedTheme
      : 'cute';
  } catch {
    return 'cute';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage?.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable in some environments (e.g. test, private mode)
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
