import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

export type ButtonVariant =
  | 'primary'   // hotPink
  | 'accent'    // electricYellow
  | 'mint'      // mintGreen
  | 'sky'       // skyBlue
  | 'orange'    // energeticOrange
  | 'lilac'     // lilac
  | 'outline'   // white/cardBg with border
  | 'ghost'     // transparent
  | 'danger';   // hotPink/red

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  hapticFeedback = true,
}) => {
  const { colors, isDark } = useThemeStore();

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#33333E' : '#E4E4E7';
    switch (variant) {
      case 'primary':
        return colors.hotPink;
      case 'accent':
        return colors.electricYellow;
      case 'mint':
        return colors.mintGreen;
      case 'sky':
        return colors.skyBlue;
      case 'orange':
        return colors.energeticOrange;
      case 'lilac':
        return colors.lilac;
      case 'outline':
        return colors.cardBg;
      case 'danger':
        return colors.hotPink;
      case 'ghost':
        return 'transparent';
      default:
        return colors.hotPink;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.muted;
    if (variant === 'ghost' || variant === 'outline') {
      return colors.text;
    }
    // High contrast black text on vibrant neo-brutalist buttons
    return '#000000';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 28 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 17;
      case 'md':
      default:
        return 15;
    }
  };

  const handlePress = () => {
    if (disabled) return;
    if (hapticFeedback) {
      triggerHaptic('light');
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: colors.border,
          borderWidth: variant === 'ghost' ? 0 : NeoBorders.default,
          borderRadius: NeoRadii.md,
        },
        variant !== 'ghost' && (pressed ? NeoShadows.pressed : NeoShadows.md),
        pressed && !disabled && {
          transform: [{ translateX: 2 }, { translateY: 2 }],
        },
        style,
      ]}
    >
      {icon && iconPosition === 'left' && <>{icon}</>}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            marginLeft: icon && iconPosition === 'left' ? 8 : 0,
            marginRight: icon && iconPosition === 'right' ? 8 : 0,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {icon && iconPosition === 'right' && <>{icon}</>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
  },
  text: {
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
});
