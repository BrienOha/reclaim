import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/hooks/useAuth';
import { BrandedSplash } from '@/components/ui/BrandedSplash';
import { ToastContainer } from '@/components/ui/Toast';
import '../global.css';

export const queryClient = new QueryClient();

export default function RootLayout() {
  const { colors, isDark } = useThemeStore();
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={[styles.rootContainer, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {isLoading ? <BrandedSplash /> : <Slot />}
        <ToastContainer />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
