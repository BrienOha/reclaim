import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  fillColor?: string;
  height?: number;
  style?: ViewStyle;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  fillColor,
  height = 18,
  style,
  showPercentage = true,
}) => {
  const { colors } = useThemeStore();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(clamped * 100);

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && (
            <Text style={[styles.label, { color: colors.text }]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentage, { color: colors.text }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            borderColor: colors.border,
            borderWidth: NeoBorders.default,
            borderRadius: NeoRadii.pill,
            backgroundColor: colors.surfaceSubtle,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: fillColor || colors.mintGreen,
              borderRadius: NeoRadii.pill,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '900',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
  },
});
