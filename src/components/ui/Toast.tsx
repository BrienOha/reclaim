import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastItem } from '@/store/useToastStore';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToastStore();
  const { colors } = useThemeStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => hideToast(toast.id)}
          colors={colors}
        />
      ))}
    </View>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
  colors: any;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss, colors }) => {
  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return { bg: colors.mintGreen, border: '#000000', icon: 'checkmark-circle' as const };
      case 'error':
        return { bg: colors.hotPink, border: '#000000', icon: 'alert-circle' as const };
      case 'saving':
        return { bg: colors.skyBlue, border: '#000000', icon: 'sync-circle' as const };
      case 'info':
      default:
        return { bg: colors.electricYellow, border: '#000000', icon: 'information-circle' as const };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.toastCard,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
        },
        NeoShadows.md,
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={scheme.icon} size={22} color="#000000" style={styles.toastIcon} />
        <Text style={styles.toastText} numberOfLines={3}>
          {toast.message}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {toast.actionLabel && toast.onAction && (
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              toast.onAction?.();
              onDismiss();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>{toast.actionLabel.toUpperCase()}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => {
            triggerHaptic('light');
            onDismiss();
          }}
          style={styles.closeButton}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color="#000000" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 54,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
  },
  toastCard: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.md,
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  toastIcon: {
    flexShrink: 0,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: NeoRadii.sm,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  closeButton: {
    padding: 2,
  },
});
