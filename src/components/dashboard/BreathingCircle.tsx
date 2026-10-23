import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BreathingPhase } from '@/store/useTimerStore';
import { useThemeStore } from '@/store/useThemeStore';
import { NeoBorders, NeoShadows } from '@/constants/theme';

interface BreathingCircleProps {
  phase: BreathingPhase;
  phaseSeconds: number;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  phase,
  phaseSeconds,
}) => {
  const { colors } = useThemeStore();
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (phase === 'inhale') {
      Animated.timing(scaleAnim, {
        toValue: 1.45,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    } else if (phase === 'exhale') {
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    }
  }, [phase, scaleAnim]);

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'INHALE DEEPLY';
      case 'hold':
        return 'HOLD BREATH';
      case 'exhale':
        return 'RELEASE SLOWLY';
      case 'rest':
        return 'RESET & PAUSE';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return colors.skyBlue;
      case 'hold':
        return colors.electricYellow;
      case 'exhale':
        return colors.mintGreen;
      case 'rest':
        return colors.lilac;
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.outerRing,
          {
            borderColor: colors.border,
            borderWidth: NeoBorders.chunky,
          },
          NeoShadows.md,
        ]}
      >
        <Animated.View
          style={[
            styles.innerCircle,
            {
              backgroundColor: getPhaseColor(),
              borderColor: colors.border,
              borderWidth: NeoBorders.default,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <View style={styles.overlay}>
          <Text style={styles.secondsText}>{phaseSeconds}</Text>
          <Text style={styles.phaseLabel}>{getPhaseInstruction()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  outerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
  },
  innerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    position: 'absolute',
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  secondsText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
