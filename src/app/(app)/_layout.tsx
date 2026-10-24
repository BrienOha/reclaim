import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Slot, Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/useThemeStore';
import { ReclaimNavBar } from '@/components/navigation/ReclaimNavBar';
import { OfflineStore } from '@/lib/offlineStore';
import { isSupabaseConfigured } from '@/lib/supabase';

import { ProfileService } from '@/services/profile.service';

export default function AppLayout() {
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isDesktop = width >= 840;

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }
      try {
        // First check local store
        const localStatus = await OfflineStore.hasCompletedOnboarding(user.id);
        if (localStatus) {
          setOnboarded(true);
          setCheckingOnboarding(false);
          return;
        }

        // Check Supabase profiles table if online
        if (isSupabaseConfigured()) {
          const profile = await ProfileService.getProfile(user.id);
          if (profile?.has_completed_onboarding) {
            await OfflineStore.setOnboardingCompleted(true, user.id);
            setOnboarded(true);
            setCheckingOnboarding(false);
            return;
          }
        }

        setOnboarded(false);
      } catch {
        setOnboarded(true); // Fallback on network error
      } finally {
        setCheckingOnboarding(false);
      }
    }

    checkStatus();
  }, [user, pathname]);

  // If not logged in, redirect to the public landing page
  if (!user) {
    return <Redirect href="/landing" />;
  }

  // If onboarding is incomplete and not already on onboarding page
  if (!checkingOnboarding && !onboarded && pathname !== '/onboarding') {
    return <Redirect href="/onboarding" />;
  }

  // Focused wizard for onboarding without navigation bars
  if (pathname === '/onboarding') {
    return (
      <View style={[styles.rootContainer, { backgroundColor: colors.bg }]}>
        <Slot />
      </View>
    );
  }

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.bg }]}>
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <ReclaimNavBar />
          <View style={styles.desktopContent}>
            <Slot />
          </View>
        </View>
      ) : (
        <View style={styles.mobileLayout}>
          <View style={styles.mobileContent}>
            <Slot />
          </View>
          <ReclaimNavBar />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  desktopContent: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
  },
  mobileLayout: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  mobileContent: {
    flex: 1,
    paddingBottom: 72, // Space for bottom tab bar
  },
});
