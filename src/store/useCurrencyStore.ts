import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
}

export const AVAILABLE_CURRENCIES: CurrencyConfig[] = [
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (PHP ₱)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD $)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR €)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY ¥)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD $)' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AUD $)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD $)' },
];

interface CurrencyState {
  currency: CurrencyConfig;
  setCurrencyCode: (code: string) => void;
  formatAmount: (amount: number) => string;
}

const CURRENCY_STORAGE_KEY = 'reclaim_user_currency';

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: AVAILABLE_CURRENCIES[0], // Default: PHP ₱
  setCurrencyCode: (code: string) => {
    const found = AVAILABLE_CURRENCIES.find((c) => c.code === code) || AVAILABLE_CURRENCIES[0];
    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, found.code).catch(() => {});
    set({ currency: found });
  },
  formatAmount: (amount: number) => {
    const { symbol } = get().currency;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
}));

// Load persisted currency
AsyncStorage.getItem(CURRENCY_STORAGE_KEY).then((code) => {
  if (code) {
    useCurrencyStore.getState().setCurrencyCode(code);
  }
}).catch(() => {});
