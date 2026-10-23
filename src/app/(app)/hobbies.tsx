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
import { useTimerStore } from '@/store/useTimerStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { OfflineStore } from '@/lib/offlineStore';
import { computeFreeTimeStatus } from '@/hooks/useFreeTimeEngine';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

type Hobby = Database['public']['Tables']['hobbies']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

export default function HobbiesScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const {
    isHobbyTimerActive,
    activeHobbyId,
    activeHobbyTitle,
    hobbyElapsedSeconds,
    startHobbyTimer,
    tickHobbyTimer,
    stopHobbyTimer,
  } = useTimerStore();

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);

  // Add / Edit Hobby Modal
  const [hobbyModalVisible, setHobbyModalVisible] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [editingColor, setEditingColor] = useState('#FFE600');
  const [editingIcon, setEditingIcon] = useState('brush');
  const [editingMiniProjects, setEditingMiniProjects] = useState('');

  // Live Timer Log Notes Modal
  const [timerNotesModalVisible, setTimerNotesModalVisible] = useState(false);
  const [loggedMinutes, setLoggedMinutes] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionAttachment, setSessionAttachment] = useState('');

  const loadData = async () => {
    if (!user) return;
    const [loadedHobbies, loadedTasks] = await Promise.all([
      OfflineStore.getHobbies(user.id),
      OfflineStore.getTasks(user.id),
    ]);
    setHobbies(loadedHobbies);
    setTasks(loadedTasks);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (isHobbyTimerActive) {
      interval = setInterval(() => {
        tickHobbyTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHobbyTimerActive, tickHobbyTimer]);

  const freeTime = computeFreeTimeStatus(tasks, hobbies);

  const handleStartTimer = (hobby: Hobby) => {
    triggerHaptic('medium');
    startHobbyTimer(hobby.id, hobby.title);
  };

  const handleStopTimer = () => {
    triggerHaptic('success');
    const minutes = stopHobbyTimer();
    setLoggedMinutes(minutes);
    setTimerNotesModalVisible(true);
  };

  const handleSaveSession = async () => {
    if (!activeHobbyId) return;

    // Update hobby total minutes
    const updated = hobbies.map((h) => {
      if (h.id === activeHobbyId) {
        return {
          ...h,
          total_minutes_logged: h.total_minutes_logged + loggedMinutes,
        };
      }
      return h;
    });

    setHobbies(updated);
    if (user) {
      await OfflineStore.saveHobbies(updated, user.id);
    }

    setTimerNotesModalVisible(false);
    setSessionNotes('');
    setSessionAttachment('');
  };

  const handleSaveHobby = async () => {
    if (!editingTitle.trim() || !user) return;
    triggerHaptic('success');

    const miniProjectsArray = editingMiniProjects
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newHobby: Hobby = {
      id: `hobby-${Date.now()}`,
      user_id: user.id,
      title: editingTitle.trim(),
      description: editingDesc.trim() || null,
      icon: editingIcon,
      color: editingColor,
      mini_projects: miniProjectsArray,
      creative_challenges: [
        `Dedicate 10 creative minutes to ${editingTitle.trim()} today!`,
      ],
      total_minutes_logged: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const next = [...hobbies, newHobby];
    setHobbies(next);
    await OfflineStore.saveHobbies(next, user.id);

    setHobbyModalVisible(false);
    setEditingTitle('');
    setEditingDesc('');
    setEditingMiniProjects('');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              CREATIVE HOBBIES
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Your creation sanctuary. Replaces mindless consumption.
            </Text>
          </View>
          <Button
            title="+ Add Hobby"
            onPress={() => setHobbyModalVisible(true)}
            variant="accent"
            size="sm"
          />
        </View>

        {/* Free Time Engine Gate Card */}
        <Card
          bgColor={freeTime.isUnlocked ? colors.mintGreen : colors.surfaceSubtle}
          style={styles.gateCard}
        >
          <View style={styles.gateHeader}>
            <View style={styles.gateTitleRow}>
              <Ionicons
                name={freeTime.isUnlocked ? 'lock-open-sharp' : 'lock-closed-sharp'}
                size={24}
                color="#000000"
              />
              <Text style={styles.gateHeadline}>{freeTime.statusHeadline}</Text>
            </View>
            <Sticker
              text={freeTime.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
              color={freeTime.isUnlocked ? 'yellow' : 'pink'}
              rotation={freeTime.isUnlocked ? 2 : -2}
            />
          </View>
          <Text style={styles.gateSubtext}>{freeTime.statusSubtext}</Text>
          {!freeTime.isUnlocked && (
            <Button
              title="Go To Tasks & Clear Priorities →"
              onPress={() => router.push('/todos' as any)}
              variant="primary"
              size="sm"
              style={styles.gateBtn}
            />
          )}
        </Card>

        {/* Live Active Hobby Session Bar */}
        {isHobbyTimerActive && (
          <Card bgColor={colors.electricYellow} style={styles.activeTimerCard}>
            <View style={styles.activeTimerHeader}>
              <View style={styles.activeTimerTitleRow}>
                <Ionicons name="timer" size={24} color="#000000" />
                <View>
                  <Text style={styles.activeTimerTitle}>
                    CREATION SESSION IN PROGRESS
                  </Text>
                  <Text style={styles.activeTimerHobbyName}>
                    {activeHobbyTitle?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.activeTimerClock}>
                {formatTimer(hobbyElapsedSeconds)}
              </Text>
            </View>
            <Button
              title="Finish & Log Creation Time ⏱️"
              onPress={handleStopTimer}
              variant="mint"
              size="md"
              style={styles.stopTimerBtn}
            />
          </Card>
        )}

        {/* Hobbies Grid */}
        <View style={styles.hobbiesList}>
          {hobbies.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="color-palette-outline" size={36} color={colors.skyBlue} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                NO HOBBIES CONFIGURED YET
              </Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                Add your creative crafts (drawing, film, music, editing) to unlock task-gated flow state sessions.
              </Text>
              <Button
                title="+ Add First Hobby Craft"
                onPress={() => setHobbyModalVisible(true)}
                variant="accent"
                size="sm"
                style={{ marginTop: 10 }}
              />
            </Card>
          ) : (
            hobbies.map((hobby) => {
            const hours = Math.floor(hobby.total_minutes_logged / 60);
            const mins = hobby.total_minutes_logged % 60;
            const isRunning = isHobbyTimerActive && activeHobbyId === hobby.id;

            return (
              <Card key={hobby.id} style={styles.hobbyCard}>
                <View style={styles.hobbyTop}>
                  <View style={styles.hobbyTitleRow}>
                    <View
                      style={[
                        styles.hobbyIconBox,
                        {
                          backgroundColor: hobby.color || colors.electricYellow,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={hobby.icon as any || 'brush'}
                        size={22}
                        color="#000000"
                      />
                    </View>
                    <View style={styles.hobbyTitleText}>
                      <Text style={[styles.hobbyName, { color: colors.text }]}>
                        {hobby.title}
                      </Text>
                      {hobby.description && (
                        <Text
                          style={[styles.hobbyDesc, { color: colors.muted }]}
                        >
                          {hobby.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Chip
                    label={`${hours}h ${mins}m LOGGED`}
                    color="dark"
                  />
                </View>

                {/* Creative Challenge Prompt */}
                {hobby.creative_challenges && hobby.creative_challenges.length > 0 && (
                  <View
                    style={[
                      styles.challengeBox,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.challengeHeader, { color: colors.muted }]}>
                      ⚡ CREATIVE CHALLENGE OF THE DAY:
                    </Text>
                    <Text style={[styles.challengeText, { color: colors.text }]}>
                      "{hobby.creative_challenges[0]}"
                    </Text>
                  </View>
                )}

                {/* Mini Project Ideas */}
                {hobby.mini_projects && hobby.mini_projects.length > 0 && (
                  <View style={styles.projectsContainer}>
                    <Text
                      style={[styles.projectsHeader, { color: colors.muted }]}
                    >
                      MINI PROJECTS & SPRINT IDEAS:
                    </Text>
                    {hobby.mini_projects.map((proj, idx) => (
                      <View key={idx} style={styles.projectItem}>
                        <Ionicons
                          name="arrow-forward-circle"
                          size={14}
                          color={colors.hotPink}
                        />
                        <Text
                          style={[styles.projectText, { color: colors.text }]}
                        >
                          {proj}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Button: Start Session Timer */}
                <View style={styles.hobbyActions}>
                  {isRunning ? (
                    <Button
                      title={`Session Active: ${formatTimer(hobbyElapsedSeconds)}`}
                      onPress={handleStopTimer}
                      variant="mint"
                      size="sm"
                    />
                  ) : (
                    <Button
                      title="Start Session Timer ⏱️"
                      onPress={() => handleStartTimer(hobby)}
                      variant="primary"
                      size="sm"
                    />
                  )}
                </View>
              </Card>
            );
          })
        )}
      </View>

        {/* Add Hobby Modal */}
        <Modal
          visible={hobbyModalVisible}
          onClose={() => setHobbyModalVisible(false)}
          title="ADD NEW CREATIVE HOBBY"
          subtitle="Give your mind positive creative craft to replace empty distractions."
          headerColor={colors.electricYellow}
        >
          <Input
            label="HOBBY TITLE"
            placeholder="e.g. 3D Modeling, Origami, Poetry, Creative Writing"
            value={editingTitle}
            onChangeText={setEditingTitle}
          />

          <Input
            label="DESCRIPTION / NOTES"
            placeholder="What tools or styles do you practice?"
            value={editingDesc}
            onChangeText={setEditingDesc}
          />

          <Input
            label="MINI PROJECT IDEAS (ONE PER LINE)"
            placeholder="Build 1 low poly car&#10;Write 1 sonnet"
            value={editingMiniProjects}
            onChangeText={setEditingMiniProjects}
            multiline
            numberOfLines={4}
          />

          <Button
            title="Save Hobby"
            onPress={handleSaveHobby}
            variant="accent"
            size="md"
          />
        </Modal>

        {/* Finish Session Notes Modal */}
        <Modal
          visible={timerNotesModalVisible}
          onClose={() => setTimerNotesModalVisible(false)}
          title="LOG COMPLETED SESSION"
          subtitle={`You created for ${loggedMinutes} minutes! Great work.`}
          headerColor={colors.mintGreen}
        >
          <Input
            label="WHAT DID YOU WORK ON / CREATE?"
            placeholder="e.g. Sketched 3 character concepts, cut 20 sec of footage"
            value={sessionNotes}
            onChangeText={setSessionNotes}
            multiline
            numberOfLines={3}
          />

          <Input
            label="ATTACHMENT URL (FIGMA / DRIVE / YOUTUBE LINK)"
            placeholder="https://..."
            value={sessionAttachment}
            onChangeText={setSessionAttachment}
          />

          <Button
            title="Confirm & Save To History"
            onPress={handleSaveSession}
            variant="mint"
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
  gateCard: {
    padding: 18,
    marginBottom: 18,
  },
  gateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gateHeadline: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.2,
  },
  gateSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 18,
  },
  gateBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  activeTimerCard: {
    padding: 16,
    marginBottom: 16,
  },
  activeTimerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeTimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeTimerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  activeTimerHobbyName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  activeTimerClock: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },
  stopTimerBtn: {
    width: '100%',
  },
  hobbiesList: {
    gap: 16,
  },
  hobbyCard: {
    padding: 16,
  },
  hobbyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hobbyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  hobbyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hobbyTitleText: {
    flex: 1,
  },
  hobbyName: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  hobbyDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  challengeBox: {
    borderWidth: 2,
    borderRadius: NeoRadii.sm,
    padding: 10,
    marginBottom: 12,
  },
  challengeHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  challengeText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  projectsContainer: {
    marginBottom: 14,
  },
  projectsHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  projectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hobbyActions: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 400,
  },
});
