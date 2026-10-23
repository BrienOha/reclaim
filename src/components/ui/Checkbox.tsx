import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

interface CheckboxProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  label?: string;
  subtitle?: string;
  checkedColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  label,
  subtitle,
  checkedColor,
  style,
  labelStyle,
  disabled = false,
}) => {
  const { colors } = useThemeStore();

  const handlePress = () => {
    if (disabled) return;
    triggerHaptic(checked ? 'light' : 'success');
    onToggle(!checked);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: colors.border,
            borderWidth: NeoBorders.default,
            borderRadius: NeoRadii.sm,
            backgroundColor: checked
              ? checkedColor || colors.mintGreen
              : colors.cardBg,
          },
          NeoShadows.sm,
        ]}
      >
        {checked && (
          <Ionicons name="checkmark-sharp" size={18} color="#000000" />
        )}
      </View>
      {(label || subtitle) && (
        <View style={styles.textContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                  textDecorationLine: checked ? 'line-through' : 'none',
                  opacity: checked ? 0.7 : 1,
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  box: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
