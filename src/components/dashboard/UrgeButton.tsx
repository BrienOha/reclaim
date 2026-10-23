import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

interface UrgeButtonProps {
  onPress: () => void;
}

export const UrgeButton: React.FC<UrgeButtonProps> = ({ onPress }) => {
  const { colors } = useThemeStore();

  return (
    <Pressable
      onPress={() => {
        triggerHaptic('heavy');
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.hotPink,
          borderColor: colors.border,
          borderWidth: NeoBorders.chunky,
          borderRadius: NeoRadii.lg,
          transform: pressed
            ? [{ translateX: 3 }, { translateY: 3 }]
            : [{ rotate: '-0.5deg' }],
        },
        pressed ? NeoShadows.pressed : NeoShadows.lg,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="flame" size={30} color="#000000" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.headline}>{"FEELING A CRAVING / URGE?"}</Text>
          <Text style={styles.subtext}>
            {"TAP HERE • 10-MIN BREATHING & CREATIVE PIVOT"}
          </Text>
        </View>
        <Ionicons name="arrow-forward-sharp" size={24} color="#000000" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 12,
    shadowColor: '#000000',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE600',
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  headline: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
