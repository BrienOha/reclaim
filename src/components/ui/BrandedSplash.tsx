import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoBorders, NeoShadows, NeoRadii } from '@/constants/theme';

export const BrandedSplash: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.badge, NeoShadows.lg]}>
        <Ionicons name="shield-checkmark" size={54} color="#000000" />
      </View>
      <Text style={styles.title}>RECLAIM</Text>
      <Text style={styles.tagline}>HABIT ARCHITECT & PRODUCTIVITY</Text>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="small" color="#000000" />
        <Text style={styles.loadingText}>Restoring session...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  badge: {
    width: 90,
    height: 90,
    backgroundColor: '#FFE600',
    borderColor: '#000000',
    borderWidth: NeoBorders.chunky,
    borderRadius: NeoRadii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    transform: [{ rotate: '-3deg' }],
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
    letterSpacing: 1.5,
    marginTop: 6,
    marginBottom: 32,
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EAEAEA',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
