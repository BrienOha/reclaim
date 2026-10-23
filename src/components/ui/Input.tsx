import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  rightElement,
  ...rest
}) => {
  const { colors } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.hotPink : colors.border,
            borderWidth: NeoBorders.default,
            borderRadius: NeoRadii.md,
          },
          isFocused ? NeoShadows.md : NeoShadows.sm,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            inputStyle,
          ]}
          {...rest}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.hotPink }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: colors.muted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  rightElement: {
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  helper: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
