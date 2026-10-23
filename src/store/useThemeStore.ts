import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeoColors, NeoColorPalette, ThemeMode } from '@/constants/theme';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: NeoColorPalette;
  isDark: boolean;
}

const THEME_STORAGE_KEY = 'reclaim_user_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: NeoColors.light,
  isDark: false,
  setMode: (mode: ThemeMode) => {
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
    set({
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? NeoColors.dark : NeoColors.light,
    });
  },
  toggleTheme: () => {
    const nextMode = get().mode === 'light' ? 'dark' : 'light';
    get().setMode(nextMode);
  },
}));

// Initialize theme from storage
AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
  if (saved === 'dark' || saved === 'light') {
    useThemeStore.getState().setMode(saved);
  }
}).catch(() => {});
