import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { EmptyState } from '@/components/ui/EmptyState';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { useTasksData } from '@/hooks/queries/useTasksData';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';
import { generateUUID } from '@/utils/uuid';

type Task = Database['public']['Tables']['tasks']['Row'];

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
type ViewMode = 'list' | 'timeline';

export default function TodosScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { tasks, createTask, updateTask, deleteTask } = useTasksData();

  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Undo snackbar state
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // New subtask input for expanded task
  const [subtaskInput, setSubtaskInput] = useState('');

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    triggerHaptic(completed ? 'success' : 'light');
    await updateTask({
      taskId,
      updates: {
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
    });
  };

  const handleQuickAdd = async () => {
    if (!quickTitle.trim() || !user) return;
    triggerHaptic('success');

    await createTask({
      id: generateUUID(),
      title: quickTitle.trim(),
      notes: null,
      deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      priority: quickPriority,
      tags: ['Personal'],
      subtasks: [],
      is_completed: false,
      position: tasks.length,
    });
    setQuickTitle('');
  };

  const handleDeleteTask = async (task: Task) => {
    triggerHaptic('warning');
    setDeletedTask(task);
    await deleteTask(task.id);

    // Show undo snackbar
    setSnackbarVisible(true);
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 4000);
  };

  const handleUndoDelete = async () => {
    if (!deletedTask) return;
    triggerHaptic('success');
    await createTask({
      id: deletedTask.id,
      title: deletedTask.title,
      notes: deletedTask.notes,
      deadline: deletedTask.deadline,
      priority: deletedTask.priority,
      tags: deletedTask.tags,
      subtasks: deletedTask.subtasks,
      is_completed: deletedTask.is_completed,
      completed_at: deletedTask.completed_at,
      position: deletedTask.position,
    });
    setDeletedTask(null);
    setSnackbarVisible(false);
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    await updateTask({
      taskId,
      updates: { subtasks: nextSubtasks },
    });
  };

  const handleAddSubtask = async (taskId: string) => {
    if (!subtaskInput.trim()) return;
    triggerHaptic('light');

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextSubtasks = [
      ...task.subtasks,
      { id: generateUUID(), title: subtaskInput.trim(), completed: false },
    ];

    await updateTask({
      taskId,
      updates: { subtasks: nextSubtasks },
    });
    setSubtaskInput('');
  };

  // Filter Tasks
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.is_completed;
    if (filter === 'overdue') {
      return !t.is_completed && t.deadline && new Date(t.deadline) < startOfToday;
    }
    if (filter === 'today') {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d >= startOfToday && d <= endOfToday;
    }
    if (filter === 'upcoming') {
      if (!t.deadline) return false;
      return new Date(t.deadline) > endOfToday && !t.is_completed;
    }
    return true; // 'all'
  });

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressRatio = tasks.length > 0 ? completedCount / tasks.length : 0;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent':
        return colors.hotPink;
      case 'high':
        return colors.energeticOrange;
      case 'medium':
        return colors.electricYellow;
      case 'low':
      default:
        return colors.mintGreen;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                NOTION-LIKE TASKS
              </Text>
              <SyncIndicator />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Clear your priorities to unlock your Free Creation Time.
            </Text>
          </View>
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.viewBtn,
                {
                  backgroundColor: viewMode === 'list' ? colors.electricYellow : colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="list" size={18} color="#000000" />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('timeline')}
              style={[
                styles.viewBtn,
                {
                  backgroundColor: viewMode === 'timeline' ? colors.electricYellow : colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="calendar" size={18} color="#000000" />
            </Pressable>
          </View>
        </View>

        {/* Overall Completion Progress */}
        <Card style={styles.progressCard}>
          <ProgressBar
            progress={progressRatio}
            label={`Total Completion (${completedCount}/${tasks.length})`}
            fillColor={colors.skyBlue}
          />
        </Card>

        {/* Quick Add Bar */}
        <Card style={styles.quickAddCard}>
          <View style={styles.quickAddRow}>
            <TextInput
              style={[
                styles.quickInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Quick add a new priority task..."
              placeholderTextColor={colors.muted}
              value={quickTitle}
              onChangeText={setQuickTitle}
              onSubmitEditing={handleQuickAdd}
            />
            <Button
              title="Add"
              onPress={handleQuickAdd}
              variant="sky"
              size="md"
              style={styles.addBtn}
            />
          </View>

          {/* Quick Priority Selector */}
          <View style={styles.prioritySelectorRow}>
            <Text style={[styles.priorityLabel, { color: colors.muted }]}>
              PRIORITY:
            </Text>
            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
              <Chip
                key={p}
                label={p.toUpperCase()}
                color={
                  p === 'urgent'
                    ? 'pink'
                    : p === 'high'
                    ? 'orange'
                    : p === 'medium'
                    ? 'yellow'
                    : 'mint'
                }
                isSelected={quickPriority === p}
                onPress={() => setQuickPriority(p)}
              />
            ))}
          </View>
        </Card>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {(['all', 'today', 'upcoming', 'overdue', 'completed'] as FilterType[]).map(
            (f) => {
              const isSelected = filter === f;
              return (
                <Chip
                  key={f}
                  label={f.toUpperCase()}
                  color={f === 'overdue' ? 'pink' : isSelected ? 'yellow' : 'outline'}
                  isSelected={isSelected}
                  onPress={() => setFilter(f)}
                />
              );
            }
          )}
        </ScrollView>

        {/* View Mode: Timeline or List */}
        {viewMode === 'timeline' ? (
          <Card style={styles.timelineCard}>
            <Text style={[styles.timelineHeader, { color: colors.text }]}>
              📅 DEADLINE TIMELINE VIEW
            </Text>
            {tasks.map((task) => {
              const dateStr = task.deadline
                ? new Date(task.deadline).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No deadline';

              return (
                <View
                  key={task.id}
                  style={[
                    styles.timelineRow,
                    {
                      borderColor: colors.border,
                      borderLeftColor: getPriorityColor(task.priority),
                    },
                  ]}
                >
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        {
                          color: colors.text,
                          textDecorationLine: task.is_completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={[styles.timelineDate, { color: colors.muted }]}>
                      ⏰ {dateStr} • {task.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        ) : (
          /* List View */
          <View style={styles.taskList}>
            {filteredTasks.length === 0 ? (
              <EmptyState
                title="NO TASKS IN THIS VIEW"
                description="Everything is clear! If all overdue and due-today tasks are done, your Free Time Engine is unlocked."
                iconName="checkmark-done-circle"
              />
            ) : (
              filteredTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

                return (
                  <Card
                    key={task.id}
                    style={styles.taskCard}
                    onPress={() =>
                      setExpandedTaskId(isExpanded ? null : task.id)
                    }
                  >
                    <View style={styles.taskRow}>
                      <Checkbox
                        checked={task.is_completed}
                        onToggle={(checked) => handleToggleTask(task.id, checked)}
                      />
                      <View style={styles.taskDetails}>
                        <Text
                          style={[
                            styles.taskTitle,
                            {
                              color: colors.text,
                              textDecorationLine: task.is_completed
                                ? 'line-through'
                                : 'none',
                              opacity: task.is_completed ? 0.6 : 1,
                            },
                          ]}
                        >
                          {task.title}
                        </Text>
                        {task.notes && (
                          <Text
                            style={[styles.taskNotes, { color: colors.muted }]}
                            numberOfLines={isExpanded ? undefined : 1}
                          >
                            {task.notes}
                          </Text>
                        )}
                        <View style={styles.taskMetaRow}>
                          <Chip
                            label={task.priority.toUpperCase()}
                            color={
                              task.priority === 'urgent'
                                ? 'pink'
                                : task.priority === 'high'
                                ? 'orange'
                                : task.priority === 'medium'
                                ? 'yellow'
                                : 'mint'
                            }
                          />
                          {task.tags.map((tag) => (
                            <Chip key={tag} label={`#${tag}`} color="outline" />
                          ))}
                          {task.subtasks.length > 0 && (
                            <Text
                              style={[
                                styles.subtaskCountLabel,
                                { color: colors.muted },
                              ]}
                            >
                              ({completedSubtasks}/{task.subtasks.length} subtasks)
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Delete button */}
                      <Pressable
                        onPress={() => handleDeleteTask(task)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                    </View>

                    {/* Expanded Subtasks & Details */}
                    {isExpanded && (
                      <View
                        style={[
                          styles.subtasksContainer,
                          {
                            borderTopColor: colors.border,
                            borderTopWidth: 2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.subtasksHeader,
                            { color: colors.text },
                          ]}
                        >
                          SUBTASKS / CHECKLIST:
                        </Text>
                        {task.subtasks.map((st) => (
                          <Checkbox
                            key={st.id}
                            checked={st.completed}
                            label={st.title}
                            onToggle={() =>
                              handleToggleSubtask(task.id, st.id)
                            }
                          />
                        ))}

                        {/* Inline Add Subtask */}
                        <View style={styles.addSubtaskRow}>
                          <TextInput
                            style={[
                              styles.subtaskInput,
                              {
                                color: colors.text,
                                borderColor: colors.border,
                              },
                            ]}
                            placeholder="Add subtask item..."
                            placeholderTextColor={colors.muted}
                            value={subtaskInput}
                            onChangeText={setSubtaskInput}
                            onSubmitEditing={() => handleAddSubtask(task.id)}
                          />
                          <Button
                            title="Add"
                            onPress={() => handleAddSubtask(task.id)}
                            variant="outline"
                            size="sm"
                          />
                        </View>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* Undo Snackbar */}
        {snackbarVisible && (
          <View
            style={[
              styles.snackbar,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              },
              NeoShadows.lg,
            ]}
          >
            <Text style={[styles.snackbarText, { color: colors.text }]}>
              Task deleted.
            </Text>
            <Button
              title="Undo"
              onPress={handleUndoDelete}
              variant="accent"
              size="sm"
            />
          </View>
        )}
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
  viewToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  viewBtn: {
    width: 36,
    height: 36,
    borderWidth: 2.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginBottom: 14,
    padding: 14,
  },
  quickAddCard: {
    marginBottom: 16,
    padding: 14,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  quickInput: {
    flex: 1,
    height: 44,
    borderWidth: 2.5,
    borderRadius: NeoRadii.md,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  addBtn: {
    height: 44,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginRight: 8,
    marginBottom: 8,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    padding: 12,
    marginBottom: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskDetails: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  taskNotes: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  subtaskCountLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  subtasksContainer: {
    marginTop: 12,
    paddingTop: 10,
  },
  subtasksHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  subtaskInput: {
    flex: 1,
    height: 36,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  timelineCard: {
    padding: 18,
  },
  timelineHeader: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    paddingLeft: 14,
    marginBottom: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    marginTop: 6,
    marginRight: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxWidth: 400,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: NeoBorders.chunky,
    borderRadius: NeoRadii.md,
  },
  snackbarText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
