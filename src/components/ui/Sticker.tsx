import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';

interface StickerProps {
  text: string;
  color?: 'yellow' | 'pink' | 'mint' | 'blue' | 'orange' | 'lilac';
  rotation?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Sticker: React.FC<StickerProps> = ({
  text,
  color = 'yellow',
  rotation = -3,
  style,
  textStyle,
  icon,
}) => {
  const { colors } = useThemeStore();

  const getBgColor = () => {
    switch (color) {
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
      case 'yellow':
      default:
        return colors.electricYellow;
    }
  };

  return (
    <View
      style={[
        styles.sticker,
        {
          backgroundColor: getBgColor(),
          borderColor: colors.border,
          borderWidth: NeoBorders.default,
          borderRadius: NeoRadii.sm,
          transform: [{ rotate: `${rotation}deg` }],
        },
        NeoShadows.sm,
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000000',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
