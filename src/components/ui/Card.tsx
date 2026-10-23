import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  bgColor?: string;
  borderColor?: string;
  tiltDeg?: number;
  shadowSize?: 'sm' | 'md' | 'lg';
  hapticFeedback?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  bgColor,
  borderColor,
  tiltDeg = 0,
  shadowSize = 'md',
  hapticFeedback = true,
}) => {
  const { colors } = useThemeStore();

  const getShadow = (pressed: boolean) => {
    if (pressed) return NeoShadows.pressed;
    switch (shadowSize) {
      case 'sm':
        return NeoShadows.sm;
      case 'lg':
        return NeoShadows.lg;
      case 'md':
      default:
        return NeoShadows.md;
    }
  };

  const transformStyle = tiltDeg !== 0 ? [{ rotate: `${tiltDeg}deg` }] : [];

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          if (hapticFeedback) triggerHaptic('light');
          onPress();
        }}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: bgColor || colors.cardBg,
            borderColor: borderColor || colors.border,
            borderWidth: NeoBorders.default,
            borderRadius: NeoRadii.md,
            transform: pressed
              ? [...transformStyle, { translateX: 2 }, { translateY: 2 }]
              : transformStyle,
          },
          getShadow(pressed),
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bgColor || colors.cardBg,
          borderColor: borderColor || colors.border,
          borderWidth: NeoBorders.default,
          borderRadius: NeoRadii.md,
          transform: transformStyle,
        },
        getShadow(false),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: 16,
    shadowColor: '#000000',
  },
});
