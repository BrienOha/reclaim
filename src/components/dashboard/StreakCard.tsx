import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sticker } from '@/components/ui/Sticker';
import { useThemeStore } from '@/store/useThemeStore';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii } from '@/constants/theme';

type Streak = Database['public']['Tables']['streaks']['Row'];

interface StreakCardProps {
  streak: Streak;
  onRestart: (streak: Streak) => void;
  onLogTrigger: (streak: Streak) => void;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streak,
  onRestart,
  onLogTrigger,
}) => {
  const { colors } = useThemeStore();

  const [now] = useState(() => Date.now());

  const { days, hours } = useMemo(() => {
    const started = new Date(streak.started_at).getTime();
    const diffMs = Math.max(0, now - started);
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days: d, hours: h };
  }, [now, streak.started_at]);

  // Milestone badge
  const milestone = useMemo(() => {
    if (days >= 30) return { title: '30D TITAN', color: 'mint' as const };
    if (days >= 14) return { title: '2-WEEK WARRIOR', color: 'yellow' as const };
    if (days >= 7) return { title: '7D MILESTONE', color: 'blue' as const };
    if (days >= 3) return { title: '3D MOMENTUM', color: 'orange' as const };
    if (days >= 1) return { title: 'DAY 1 COMPLETE', color: 'lilac' as const };
    return { title: 'FRESH RESTART', color: 'yellow' as const };
  }, [days]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: streak.accent_color || colors.electricYellow,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name={streak.icon as any || 'shield'} size={20} color="#000000" />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.habitName, { color: colors.text }]}>
              {streak.habit_name}
            </Text>
            <Text style={[styles.category, { color: colors.muted }]}>
              {`${streak.category.toUpperCase()} • BEST: ${streak.longest_streak_days} DAYS`}
            </Text>
          </View>
        </View>

        <Sticker text={milestone.title} color={milestone.color} rotation={2} />
      </View>

      {/* Days Counter Display */}
      <View
        style={[
          styles.counterBox,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.counterNumber, { color: colors.text }]}>{days}</Text>
        <Text style={[styles.counterLabel, { color: colors.muted }]}>
          {`DAYS CLEAN ${hours > 0 ? `(${hours}h)` : ''}`}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Button
          title="Log Urge / Note"
          onPress={() => onLogTrigger(streak)}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
        <Button
          title="Restart Streak"
          onPress={() => onRestart(streak)}
          variant="danger"
          size="sm"
          style={styles.actionBtn}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleTextContainer: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  counterBox: {
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  counterNumber: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
