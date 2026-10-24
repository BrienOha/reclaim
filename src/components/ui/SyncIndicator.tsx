import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '@/store/useToastStore';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii } from '@/constants/theme';

export const SyncIndicator: React.FC = () => {
  const { syncStatus, syncMessage } = useToastStore();
  const { colors } = useThemeStore();

  if (syncStatus === 'idle') return null;

  const getConfig = () => {
    switch (syncStatus) {
      case 'saving':
        return {
          bg: colors.electricYellow,
          text: syncMessage || 'Saving…',
          icon: 'sync' as const,
        };
      case 'saved':
        return {
          bg: colors.mintGreen,
          text: syncMessage || 'Saved ✓',
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          bg: colors.hotPink,
          text: syncMessage || 'Failed, retry',
          icon: 'alert-circle' as const,
        };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name={config.icon} size={14} color="#000000" />
      <Text style={styles.badgeText}>{config.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: NeoBorders.hairline,
    borderRadius: NeoRadii.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});
