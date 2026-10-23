import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface ConfettiProps {
  active: boolean;
  count?: number;
}

const CONFETTI_COLORS = ['#FF5388', '#FFE600', '#00E599', '#38B6FF', '#FF7A00', '#B388FF'];

interface ParticleData {
  id: number;
  startX: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const ConfettiParticle: React.FC<{
  data: ParticleData;
  windowHeight: number;
}> = ({ data, windowHeight }) => {
  const translateY = useSharedValue(-50);
  const rotation = useSharedValue(data.rotation);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      data.delay,
      withTiming(windowHeight + 100, {
        duration: 2200 + Math.random() * 800,
        easing: Easing.out(Easing.quad),
      })
    );

    rotation.value = withDelay(
      data.delay,
      withTiming(data.rotation + 360 * 3, {
        duration: 2500,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      data.delay + 1800,
      withTiming(0, { duration: 600 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: data.startX,
          width: data.size,
          height: data.size * 0.6,
          backgroundColor: data.color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const Confetti: React.FC<ConfettiProps> = ({ active, count = 40 }) => {
  const { width, height } = useWindowDimensions();

  if (!active) return null;

  const particles: ParticleData[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: Math.random() * width,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 10 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 400,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} data={p} windowHeight={height} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 2,
  },
});
