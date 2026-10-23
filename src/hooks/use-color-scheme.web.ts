import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const emptySubscribe = () => () => {};

/**
 * Client-side hydration-safe color scheme hook for web
 */
export function useColorScheme() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const colorScheme = useRNColorScheme();

  if (isClient) {
    return colorScheme;
  }

  return 'light';
}
