import { Platform } from 'react-native';

export interface NeoColorPalette {
  bg: string;
  cardBg: string;
  text: string;
  border: string;
  shadow: string;
  muted: string;
  surfaceSubtle: string;
  inputBg: string;
  hotPink: string;
  electricYellow: string;
  mintGreen: string;
  skyBlue: string;
  energeticOrange: string;
  lilac: string;
  cream: string;
}

export const NeoColors: { light: NeoColorPalette; dark: NeoColorPalette } = {
  light: {
    bg: '#FFFDF8',              // Cream / Warm off-white
    cardBg: '#FFFFFF',
    text: '#000000',
    border: '#000000',
    shadow: '#000000',
    muted: '#71717A',
    surfaceSubtle: '#F4EFE6',
    inputBg: '#FFFFFF',

    // Neo-Brutalist Vibrant Accents
    hotPink: '#FF5388',         // Panic / Urge / Streaks
    electricYellow: '#FFE600',  // Badges / Free Time Alert / Highlights
    mintGreen: '#00E599',       // Success / Completed / Savings
    skyBlue: '#38B6FF',         // To-Do / Active Tasks
    energeticOrange: '#FF7A00', // Warnings / High Priority
    lilac: '#B388FF',           // Journal / Reflection
    cream: '#FFFDF8',
  },
  dark: {
    bg: '#121217',              // Deep sleek dark
    cardBg: '#1B1B22',
    text: '#FFFFFF',
    border: '#FFFFFF',
    shadow: '#000000',
    muted: '#A1A1AA',
    surfaceSubtle: '#24242F',
    inputBg: '#1B1B22',

    // Accents stay vibrant
    hotPink: '#FF5388',
    electricYellow: '#FFE600',
    mintGreen: '#00E599',
    skyBlue: '#38B6FF',
    energeticOrange: '#FF7A00',
    lilac: '#B388FF',
    cream: '#FFFDF8',
  },
};

export type ThemeMode = 'light' | 'dark';

export const NeoBorders = {
  hairline: 1.5,
  default: 3,
  chunky: 4,
  heavy: 5,
} as const;

export const NeoRadii = {
  none: 0,
  sm: 6,
  md: 12,
  lg: 18,
  pill: 9999,
} as const;

export const NeoShadows = {
  sm: {
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  md: {
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  lg: {
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  pressed: {
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
} as const;

export const JOURNAL_FONTS = [
  'Space Grotesk',
  'Caveat',
  'Permanent Marker',
  'Playfair Display',
  'Special Elite',
  'Pacifico',
  'Bangers',
  'Press Start 2P',
  'Indie Flower',
  'DM Serif Display',
  'Courier Prime',
  'Shadows Into Light',
  'Syne',
  'Rubik Mono One',
  'Lobster',
] as const;

export type JournalFont = (typeof JOURNAL_FONTS)[number];

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 920;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Fonts = {
  sans: 'system-ui',
  serif: 'serif',
  rounded: 'normal',
  mono: 'monospace',
};

export const Colors = {
  light: {
    text: NeoColors.light.text,
    background: NeoColors.light.bg,
    backgroundElement: NeoColors.light.surfaceSubtle,
    backgroundSelected: NeoColors.light.electricYellow,
    textSecondary: NeoColors.light.muted,
  },
  dark: {
    text: NeoColors.dark.text,
    background: NeoColors.dark.bg,
    backgroundElement: NeoColors.dark.surfaceSubtle,
    backgroundSelected: NeoColors.dark.surfaceSubtle,
    textSecondary: NeoColors.dark.muted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
