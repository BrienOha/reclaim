import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from './Card';
import { Button, ButtonVariant } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconName = 'sparkles',
  actionTitle,
  onAction,
  actionVariant = 'primary',
  style,
}) => {
  const { colors } = useThemeStore();

  return (
    <Card style={StyleSheet.flatten([styles.container, style]) as ViewStyle}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.electricYellow,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name={iconName} size={32} color="#000000" />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant={actionVariant}
          size="sm"
          style={styles.actionButton}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
  },
});
