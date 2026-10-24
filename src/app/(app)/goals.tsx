import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { EmptyState } from '@/components/ui/EmptyState';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { useGoalsData } from '@/hooks/queries/useGoalsData';
import { TasksService } from '@/services/tasks.service';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

type Goal = Database['public']['Tables']['goals']['Row'];
type Milestone = Database['public']['Tables']['goal_milestones']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

type TierTab = 'small' | 'big' | 'life' | 'archived';

export default function GoalsScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [activeTier, setActiveTier] = useState<TierTab>('small');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const {
    goals,
    milestones,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    updateMilestone,
  } = useGoalsData();

  // Add Goal Modal State
  const [addGoalModalVisible, setAddGoalModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTier, setNewTier] = useState<'small' | 'big' | 'life'>('small');
  const [newCategory, setNewCategory] = useState('Creative');
  const [newMilestonesText, setNewMilestonesText] = useState('');

  // Celebration banner
  const [showCelebration, setShowCelebration] = useState(false);

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    triggerHaptic(completed ? 'success' : 'light');
    if (completed) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    await updateMilestone({
      milestoneId,
      updates: { is_completed: completed },
    });
  };

  // Convert milestone to To-Do task
  const handleLinkToTask = async (milestone: Milestone, goalTitle: string) => {
    if (!user) return;
    triggerHaptic('success');

    await TasksService.createTask({
      user_id: user.id,
      goal_id: milestone.goal_id,
      title: `[Goal: ${goalTitle}] ${milestone.title}`,
      notes: 'Generated from Goal Roadmap Milestone',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      tags: ['Goal'],
      subtasks: [],
      is_completed: false,
      is_recurring: false,
      position: 0,
    });
    router.push('/todos' as any);
  };

  // Pin as Goal of the Week
  const handlePinGoal = async (goalId: string) => {
    triggerHaptic('medium');
    await Promise.all(
      goals.map((g) =>
        updateGoal({
          goalId: g.id,
          updates: { is_pinned_of_week: g.id === goalId },
        })
      )
    );
  };

  // Archive Goal
  const handleToggleArchive = async (goalId: string) => {
    triggerHaptic('light');
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;
    await updateGoal({
      goalId,
      updates: { is_archived: !target.is_archived },
    });
  };

  // Add new Goal
  const handleCreateGoal = async () => {
    if (!newTitle.trim() || !user) return;
    triggerHaptic('success');

    const milestoneTitles = newMilestonesText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    await createGoal({
      goal: {
        tier: newTier,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        category: newCategory,
        is_pinned_of_week: false,
        is_archived: false,
      },
      milestoneTitles,
    });

    setAddGoalModalVisible(false);
    setNewTitle('');
    setNewDesc('');
    setNewMilestonesText('');
  };

  const filteredGoals = goals.filter((g) => {
    if (activeTier === 'archived') return g.is_archived;
    return g.tier === activeTier && !g.is_archived;
  });

  const pinnedGoal = goals.find((g) => g.is_pinned_of_week);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                3-TIER GOAL TRACKER
              </Text>
              <SyncIndicator />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Small, Big, and Life Aspirations with roadmap milestones.
            </Text>
          </View>
          <Button
            title="+ New Goal"
            onPress={() => setAddGoalModalVisible(true)}
            variant="primary"
            size="sm"
          />
        </View>

        {/* Milestone Celebration Banner */}
        {showCelebration && (
          <Card bgColor={colors.electricYellow} style={styles.celebrationCard}>
            <Text style={styles.celebrationTitle}>
              🎉 MILESTONE COMPLETED! KEEP THE MOMENTUM! 🔥
            </Text>
          </Card>
        )}

        {/* Spotlight: Goal of the Week */}
        {pinnedGoal && activeTier !== 'archived' && (
          <Card bgColor={colors.cardBg} style={styles.spotlightCard}>
            <View style={styles.spotlightHeader}>
              <Sticker text="⭐ PINNED GOAL OF THE WEEK" color="yellow" rotation={-1} />
              <Chip label={pinnedGoal.tier.toUpperCase()} color="pink" />
            </View>
            <Text style={[styles.spotlightTitle, { color: colors.text }]}>
              {pinnedGoal.title}
            </Text>
            {pinnedGoal.description && (
              <Text style={[styles.spotlightDesc, { color: colors.muted }]}>
                {pinnedGoal.description}
              </Text>
            )}
            <View style={styles.spotlightProgress}>
              {(() => {
                const ms = milestones.filter((m) => m.goal_id === pinnedGoal.id);
                const done = ms.filter((m) => m.is_completed).length;
                const ratio = ms.length > 0 ? done / ms.length : 0;
                return (
                  <ProgressBar
                    progress={ratio}
                    label={`Milestones: ${done}/${ms.length} Done`}
                    fillColor={colors.hotPink}
                  />
                );
              })()}
            </View>
          </Card>
        )}

        {/* 3 Tier Navigation Tabs */}
        <View style={styles.tierTabs}>
          {(
            [
              { id: 'small', label: 'Small Goals (1-4W)', color: 'mint' },
              { id: 'big', label: 'Big Goals (1-6M)', color: 'blue' },
              { id: 'life', label: 'Life / Future', color: 'pink' },
              { id: 'archived', label: 'Archive', color: 'yellow' },
            ] as const
          ).map((tab) => {
            const isSelected = activeTier === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTier(tab.id);
                }}
                style={({ pressed }) => [
                  styles.tierBtn,
                  {
                    backgroundColor: isSelected
                      ? colors.electricYellow
                      : colors.cardBg,
                    borderColor: colors.border,
                    borderWidth: NeoBorders.default,
                    borderRadius: NeoRadii.md,
                    transform: pressed ? [{ scale: 0.96 }] : [],
                  },
                  isSelected && NeoShadows.sm,
                ]}
              >
                <Text
                  style={[
                    styles.tierBtnText,
                    { color: isSelected ? '#000000' : colors.text },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <EmptyState
            title="NO GOALS IN THIS TIER YET"
            description="Set a concrete milestone goal to aim your creative energy toward."
            actionTitle="+ Create First Goal"
            onAction={() => setAddGoalModalVisible(true)}
          />
        ) : (
          filteredGoals.map((goal) => {
            const goalMs = milestones.filter((m) => m.goal_id === goal.id);
            const doneMs = goalMs.filter((m) => m.is_completed).length;
            const progress = goalMs.length > 0 ? doneMs / goalMs.length : 0;
            const isExpanded = expandedGoalId === goal.id;

            return (
              <Card key={goal.id} style={styles.goalItemCard}>
                <View style={styles.goalItemHeader}>
                  <View style={styles.goalItemTitleRow}>
                    <Chip label={goal.category.toUpperCase()} color="yellow" />
                    <Text style={[styles.goalItemTitle, { color: colors.text }]}>
                      {goal.title}
                    </Text>
                  </View>
                  <Pressable onPress={() => handlePinGoal(goal.id)}>
                    <Ionicons
                      name={goal.is_pinned_of_week ? 'star' : 'star-outline'}
                      size={20}
                      color={goal.is_pinned_of_week ? colors.electricYellow : colors.muted}
                    />
                  </Pressable>
                </View>

                {goal.description && (
                  <Text style={[styles.goalItemDesc, { color: colors.muted }]}>
                    {goal.description}
                  </Text>
                )}

                {/* Progress Bar */}
                <ProgressBar
                  progress={progress}
                  label={`Roadmap Progress (${doneMs}/${goalMs.length})`}
                  fillColor={
                    goal.tier === 'life'
                      ? colors.lilac
                      : goal.tier === 'big'
                      ? colors.skyBlue
                      : colors.mintGreen
                  }
                />

                {/* Visual Roadmap Connect-the-dots */}
                <View style={styles.roadmapContainer}>
                  <Text style={[styles.roadmapHeader, { color: colors.muted }]}>
                    ROADMAP MILESTONES:
                  </Text>
                  {goalMs.map((ms, idx) => (
                    <View key={ms.id} style={styles.roadmapRow}>
                      <Checkbox
                        checked={ms.is_completed}
                        onToggle={(checked) =>
                          handleToggleMilestone(ms.id, checked)
                        }
                      />
                      <Text
                        style={[
                          styles.milestoneTitle,
                          {
                            color: colors.text,
                            textDecorationLine: ms.is_completed
                              ? 'line-through'
                              : 'none',
                            opacity: ms.is_completed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {idx + 1}. {ms.title}
                      </Text>

                      {!ms.is_completed && (
                        <Button
                          title="+ To-Do"
                          onPress={() => handleLinkToTask(ms, goal.title)}
                          variant="outline"
                          size="sm"
                          style={styles.linkToTaskBtn}
                        />
                      )}
                    </View>
                  ))}
                </View>

                {/* Card Footer Actions */}
                <View style={styles.goalFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Button
                      title={goal.is_archived ? 'Unarchive' : 'Archive Goal'}
                      onPress={() => handleToggleArchive(goal.id)}
                      variant="ghost"
                      size="sm"
                    />
                    <Pressable
                      onPress={() => {
                        triggerHaptic('warning');
                        deleteGoal(goal.id);
                      }}
                      style={{ padding: 4 }}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.hotPink} />
                    </Pressable>
                  </View>
                  {!goal.is_pinned_of_week && (
                    <Button
                      title="Pin As Goal Of Week"
                      onPress={() => handlePinGoal(goal.id)}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </View>
              </Card>
            );
          })
        )}

        {/* Add Goal Modal */}
        <Modal
          visible={addGoalModalVisible}
          onClose={() => setAddGoalModalVisible(false)}
          title="CREATE NEW ROADMAP GOAL"
          subtitle="Break it down into concrete milestones."
          headerColor={colors.hotPink}
        >
          <Input
            label="GOAL TITLE"
            placeholder="e.g. Publish My First 5-Track Beat Tape"
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <Input
            label="DESCRIPTION / WHY THIS MATTERS"
            placeholder="Deep motivation and creative vision..."
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
            numberOfLines={2}
          />

          <Text style={[styles.modalLabel, { color: colors.text }]}>
            GOAL TIER
          </Text>
          <View style={styles.tierSelectorRow}>
            {(['small', 'big', 'life'] as const).map((t) => (
              <Chip
                key={t}
                label={`${t.toUpperCase()} GOAL`}
                color={t === 'life' ? 'pink' : t === 'big' ? 'blue' : 'mint'}
                isSelected={newTier === t}
                onPress={() => setNewTier(t)}
              />
            ))}
          </View>

          <Input
            label="ROADMAP MILESTONES (ONE PER LINE)"
            placeholder="Draft 3 chord progressions&#10;Record basslines&#10;Master final tracks"
            value={newMilestonesText}
            onChangeText={setNewMilestonesText}
            multiline
            numberOfLines={4}
          />

          <Button
            title="Create Goal & Roadmap"
            onPress={handleCreateGoal}
            variant="primary"
            size="md"
          />
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 18,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  celebrationCard: {
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  celebrationTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  spotlightCard: {
    padding: 16,
    marginBottom: 18,
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  spotlightDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  spotlightProgress: {
    marginTop: 10,
  },
  tierTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tierBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000000',
  },
  tierBtnText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  goalItemCard: {
    padding: 16,
    marginBottom: 14,
  },
  goalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goalItemTitle: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  goalItemDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  roadmapContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  roadmapHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  linkToTaskBtn: {
    marginLeft: 8,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tierSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
});
