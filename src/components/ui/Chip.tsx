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

export type ChipColor = 'yellow' | 'pink' | 'mint' | 'blue' | 'orange' | 'lilac' | 'dark' | 'outline';

interface ChipProps {
  label: string;
  onPress?: () => void;
  color?: ChipColor;
  isSelected?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  color = 'yellow',
  isSelected = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors, isDark } = useThemeStore();

  const getBgColor = () => {
    switch (color) {
      case 'yellow':
        return colors.electricYellow;
      case 'pink':
        return colors.hotPink;
      case 'mint':
        return colors.mintGreen;
      case 'blue':
        return colors.skyBlue;
      case 'orange':
        return colors.energeticOrange;
      case 'lilac':
        return colors.lilac;
      case 'dark':
        return isDark ? '#FFFFFF' : '#000000';
      case 'outline':
      default:
        return isSelected ? colors.electricYellow : colors.cardBg;
    }
  };

  const getTextColor = () => {
    if (color === 'dark') {
      return isDark ? '#000000' : '#FFFFFF';
    }
    return '#000000';
  };

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          triggerHaptic('light');
          onPress();
        }
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: getBgColor(),
          borderColor: colors.border,
          borderWidth: NeoBorders.hairline * 1.5,
          borderRadius: NeoRadii.pill,
          transform: pressed ? [{ scale: 0.96 }] : [],
        },
        isSelected && NeoShadows.sm,
        style,
      ]}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            marginLeft: icon ? 6 : 0,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000000',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
