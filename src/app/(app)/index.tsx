import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useAuthStore } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sticker } from '@/components/ui/Sticker';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UrgeButton } from '@/components/dashboard/UrgeButton';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { DailyMoodCheckIn } from '@/components/dashboard/DailyMoodCheckIn';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { useStreaksData } from '@/hooks/queries/useStreaksData';
import { useTasksData } from '@/hooks/queries/useTasksData';
import { useHobbiesData } from '@/hooks/queries/useHobbiesData';
import { useGoalsData } from '@/hooks/queries/useGoalsData';
import { useFinanceData } from '@/hooks/queries/useFinanceData';
import { computeFreeTimeStatus } from '@/hooks/useFreeTimeEngine';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

type Streak = Database['public']['Tables']['streaks']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Goal = Database['public']['Tables']['goals']['Row'];
type Milestone = Database['public']['Tables']['goal_milestones']['Row'];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { formatAmount } = useCurrencyStore();
  const { user } = useAuthStore();

  const currentMonday = new Date();
  currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7));
  const weekDateStr = currentMonday.toISOString().split('T')[0];

  const {
    streaks,
    checkin,
    updateStreak,
    createStreakLog,
    createStreak,
    upsertCheckin,
  } = useStreaksData();
  const { tasks } = useTasksData();
  const { hobbies } = useHobbiesData();
  const { goals, milestones } = useGoalsData();
  const { weekData, expenses } = useFinanceData(weekDateStr);

  const [refreshing, setRefreshing] = useState(false);
  const [currentMood, setCurrentMood] = useState<number | null>(null);

  // Restart Modal State
  const [restartModalVisible, setRestartModalVisible] = useState(false);
  const [selectedStreak, setSelectedStreak] = useState<Streak | null>(null);
  const [restartReason, setRestartReason] = useState('');
  const [restartNotes, setRestartNotes] = useState('');

  // Add Habit Streak Modal State
  const [addStreakModalVisible, setAddStreakModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Digital');

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Computations
  const freeTime = computeFreeTimeStatus(tasks, hobbies);
  const pinnedGoal = goals.find((g) => g.is_pinned_of_week) || goals[0];
  const goalMilestones = pinnedGoal
    ? milestones.filter((m) => m.goal_id === pinnedGoal.id)
    : [];
  const goalCompletedCount = goalMilestones.filter((m) => m.is_completed).length;
  const goalProgress =
    goalMilestones.length > 0 ? goalCompletedCount / goalMilestones.length : 0;

  const weeklyAllowance = weekData?.allowance_amount || 0;
  const weeklySpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const budgetRemaining = Math.max(0, weeklyAllowance - weeklySpent);

  // Restart Streak handler (Relapse-friendly)
  const handleConfirmRestart = async () => {
    if (!selectedStreak) return;
    triggerHaptic('warning');

    await updateStreak({
      streakId: selectedStreak.id,
      updates: {
        started_at: new Date().toISOString(),
      },
    });

    await createStreakLog({
      streak_id: selectedStreak.id,
      event_type: 'restarted',
      mood: checkin?.mood ?? currentMood,
      trigger_reason: restartReason || 'Trigger moment',
      notes: restartNotes,
      occurred_at: new Date().toISOString(),
    });

    setRestartModalVisible(false);
    setSelectedStreak(null);
    setRestartReason('');
    setRestartNotes('');
  };

  // Add new streak handler
  const handleAddNewStreak = async () => {
    if (!newHabitName.trim() || !user) return;
    triggerHaptic('success');

    await createStreak({
      habit_name: newHabitName.trim(),
      category: newHabitCategory,
      started_at: new Date().toISOString(),
      longest_streak_days: 0,
      icon: 'shield',
      accent_color: '#FF5388',
    });

    setNewHabitName('');
    setAddStreakModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.border}
          />
        }
      >
        {/* Top Header Banner */}
        <View style={styles.topHeader}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                WELCOME BACK 👋
              </Text>
              <SyncIndicator />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              RECLAIM YOUR TIME • FOCUS ON WHAT MATTERS
            </Text>
          </View>
          <Sticker text="DAY CLEAN" color="mint" rotation={3} />
        </View>

        {/* Big Urge Panic Button */}
        <UrgeButton onPress={() => router.push('/urge' as any)} />

        {/* Free Time Engine Snapshot Card */}
        <Card
          bgColor={freeTime.isUnlocked ? colors.electricYellow : colors.cardBg}
          style={styles.snapshotCard}
          onPress={() => router.push('/hobbies' as any)}
        >
          <View style={styles.snapshotHeader}>
            <View style={styles.snapshotTitleRow}>
              <Ionicons
                name={freeTime.isUnlocked ? 'sparkles' : 'lock-closed'}
                size={22}
                color="#000000"
              />
              <Text style={styles.snapshotHeadline}>
                {freeTime.statusHeadline}
              </Text>
            </View>
            <Text style={styles.snapshotAction}>VIEW HOBBIES →</Text>
          </View>
          <Text style={styles.snapshotSubtext}>{freeTime.statusSubtext}</Text>
        </Card>

        {/* Quick Snapshot Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Tasks Due Today */}
          <Card
            style={styles.metricCard}
            onPress={() => router.push('/todos' as any)}
          >
            <View style={styles.metricTop}>
              <Ionicons name="checkbox-outline" size={20} color={colors.skyBlue} />
              <Text style={[styles.metricLabel, { color: colors.muted }]}>
                TASKS DUE
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {freeTime.dueTodayCount}
            </Text>
            <Text style={[styles.metricHint, { color: colors.muted }]}>
              {freeTime.overdueCount > 0
                ? `${freeTime.overdueCount} Overdue!`
                : 'All on schedule'}
            </Text>
          </Card>

          {/* Budget Left This Week */}
          <Card
            style={styles.metricCard}
            onPress={() => router.push('/finance' as any)}
          >
            <View style={styles.metricTop}>
              <Ionicons name="wallet-outline" size={20} color={colors.mintGreen} />
              <Text style={[styles.metricLabel, { color: colors.muted }]}>
                BUDGET LEFT
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {formatAmount(budgetRemaining)}
            </Text>
            <Text style={[styles.metricHint, { color: colors.muted }]}>
              Allowance: {formatAmount(weeklyAllowance)}
            </Text>
          </Card>
        </View>

        {/* Pinned Goal of the Week Card */}
        {pinnedGoal && (
          <Card
            style={styles.goalCard}
            onPress={() => router.push('/goals' as any)}
          >
            <View style={styles.goalHeader}>
              <Sticker text="GOAL OF THE WEEK" color="pink" rotation={-2} />
              <Text style={[styles.goalTier, { color: colors.muted }]}>
                {pinnedGoal.tier.toUpperCase()} TIER
              </Text>
            </View>
            <Text style={[styles.goalTitle, { color: colors.text }]}>
              {pinnedGoal.title}
            </Text>
            <ProgressBar
              progress={goalProgress}
              label="Milestones Progress"
              fillColor={colors.hotPink}
            />
          </Card>
        )}

        {/* Daily Mood Check-In & Motivational Quote */}
        <DailyMoodCheckIn
          currentMood={checkin?.mood ?? currentMood}
          onSelectMood={async (mood) => {
            setCurrentMood(mood);
            await upsertCheckin({
              mood,
              journal_note: null,
            });
          }}
        />

        {/* Clean Streaks Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              CLEAN STREAK TRACKER
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Break free from dopamine loops. Each day is a victory.
            </Text>
          </View>
          <Button
            title="+ New Habit"
            onPress={() => setAddStreakModalVisible(true)}
            variant="accent"
            size="sm"
          />
        </View>

        {/* Streaks List or Empty State */}
        {streaks.length === 0 ? (
          <Card style={styles.emptyStreaksCard}>
            <Ionicons name="shield-outline" size={36} color={colors.mintGreen} />
            <Text style={[styles.emptyStreaksTitle, { color: colors.text }]}>
              NO ACTIVE STREAKS YET
            </Text>
            <Text style={[styles.emptyStreaksSub, { color: colors.muted }]}>
              Pick addictions or habits to quit and track your clean days with zero judgment.
            </Text>
            <Button
              title="+ Add Your First Clean Streak"
              onPress={() => setAddStreakModalVisible(true)}
              variant="accent"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </Card>
        ) : (
          streaks.map((streak) => (
            <StreakCard
              key={streak.id}
              streak={streak}
              onRestart={(s) => {
                setSelectedStreak(s);
                setRestartModalVisible(true);
              }}
              onLogTrigger={(s) => {
                setSelectedStreak(s);
                setRestartModalVisible(true);
              }}
            />
          ))
        )}

        {/* In-app Disclaimer */}
        <Card style={styles.disclaimerCard}>
          <Text style={[styles.disclaimerTitle, { color: colors.text }]}>
            SUPPORT TOOL DISCLAIMER
          </Text>
          <Text style={[styles.disclaimerText, { color: colors.muted }]}>
            Reclaim is a personal self-management and productivity tool designed to help you form healthy habits. It is not a substitute for clinical psychological treatment or addiction recovery programs if challenges are severe.
          </Text>
        </Card>
      </ScrollView>

      {/* Relapse-Friendly Restart Modal */}
      <Modal
        visible={restartModalVisible}
        onClose={() => setRestartModalVisible(false)}
        title="RESTART STREAK (NO SHAME)"
        subtitle="A slip is data, not defeat. Learn what triggered it and rebuild stronger."
        headerColor={colors.electricYellow}
      >
        <Text style={[styles.modalHabitLabel, { color: colors.text }]}>
          Habit: {selectedStreak?.habit_name}
        </Text>

        <Input
          label="WHAT TRIGGERED THE CRAVING / SLIP?"
          placeholder="e.g. Stress, Late night boredom, Tired after work"
          value={restartReason}
          onChangeText={setRestartReason}
        />

        <Input
          label="HOW WILL YOU PROTECT YOURSELF NEXT TIME?"
          placeholder="e.g. Leave phone outside bedroom, use Urge Button immediately"
          value={restartNotes}
          onChangeText={setRestartNotes}
          multiline
          numberOfLines={3}
        />

        <View style={styles.modalButtons}>
          <Button
            title="Cancel"
            onPress={() => setRestartModalVisible(false)}
            variant="outline"
            style={styles.modalBtn}
          />
          <Button
            title="Reset & Restart Now"
            onPress={handleConfirmRestart}
            variant="danger"
            style={styles.modalBtn}
          />
        </View>
      </Modal>

      {/* Add New Habit Streak Modal */}
      <Modal
        visible={addStreakModalVisible}
        onClose={() => setAddStreakModalVisible(false)}
        title="TRACK A NEW HABIT TO QUIT"
        subtitle="Add any compulsion or addiction eating away your time."
        headerColor={colors.mintGreen}
      >
        <Input
          label="HABIT NAME"
          placeholder="e.g. Doomscrolling Shorts, Gaming past 1 AM"
          value={newHabitName}
          onChangeText={setNewHabitName}
        />

        <Input
          label="CATEGORY"
          placeholder="Digital, Substance, Behavioral, Financial"
          value={newHabitCategory}
          onChangeText={setNewHabitCategory}
        />

        <Button
          title="Start Tracking Streak"
          onPress={handleAddNewStreak}
          variant="mint"
          size="md"
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  snapshotCard: {
    marginVertical: 10,
    padding: 14,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  snapshotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapshotHeadline: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  snapshotAction: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  snapshotSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  metricCard: {
    flex: 1,
    padding: 14,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricHint: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  goalCard: {
    marginVertical: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTier: {
    fontSize: 11,
    fontWeight: '800',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  disclaimerCard: {
    marginTop: 24,
    backgroundColor: '#F9F9FB',
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  modalHabitLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
  },
  emptyStreaksCard: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  emptyStreaksTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  emptyStreaksSub: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 400,
  },
});
