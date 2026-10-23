import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, Redirect } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/useThemeStore';

export default function PublicLayout() {
  const { user } = useAuthStore();
  const { colors } = useThemeStore();

  // If user is already authenticated, redirect to the protected application
  if (user) {
    return <Redirect href={"/(app)" as any} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
