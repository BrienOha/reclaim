import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/hooks/useAuth';
import { useTimerStore } from '@/store/useTimerStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sticker } from '@/components/ui/Sticker';
import { BreathingCircle } from '@/components/dashboard/BreathingCircle';
import { OfflineStore } from '@/lib/offlineStore';
import { Database } from '@/types/database.types';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

type Hobby = Database['public']['Tables']['hobbies']['Row'];
type Streak = Database['public']['Tables']['streaks']['Row'];

export default function UrgeRescueScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const {
    urgeSecondsRemaining,
    breathingPhase,
    breathingSeconds,
    startUrgeCountdown,
    tickUrgeCountdown,
    stopUrgeCountdown,
  } = useTimerStore();

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loggedOutcome, setLoggedOutcome] = useState<'resisted' | 'slipped' | null>(null);

  const loadContext = async () => {
    if (!user) return;
    const [h, s] = await Promise.all([
      OfflineStore.getHobbies(user.id),
      OfflineStore.getStreaks(user.id),
    ]);
    setHobbies(h);
    setStreaks(s);
  };

  useEffect(() => {
    loadContext();
  }, [user]);

  useEffect(() => {
    startUrgeCountdown();
    loadContext();

    const interval = setInterval(() => {
      tickUrgeCountdown();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startUrgeCountdown, tickUrgeCountdown]);

  const minutesRemaining = Math.floor(urgeSecondsRemaining / 60);
  const secondsRemaining = urgeSecondsRemaining % 60;
  const formattedTime = `${String(minutesRemaining).padStart(2, '0')}:${String(secondsRemaining).padStart(2, '0')}`;

  const handleOutcome = async (outcome: 'resisted' | 'slipped') => {
    if (!user) return;
    triggerHaptic(outcome === 'resisted' ? 'success' : 'warning');
    setLoggedOutcome(outcome);
    stopUrgeCountdown();

    // Log to streak logs
    const logs = await OfflineStore.getStreakLogs(user.id);
    logs.push({
      id: `log-${Date.now()}`,
      user_id: user.id,
      streak_id: streaks[0]?.id || 'streak-1',
      event_type: outcome === 'resisted' ? 'urge_resisted' : 'restarted',
      mood: outcome === 'resisted' ? 5 : 2,
      trigger_reason: 'Craving emergency session',
      notes: outcome === 'resisted' ? 'Resisted craving using 10-min breathing & creative pivot!' : 'Experienced a slip, restarting now.',
      occurred_at: new Date().toISOString(),
    });
    await OfflineStore.saveStreakLogs(logs, user.id);

    if (outcome === 'slipped' && streaks.length > 0) {
      const updatedStreaks = streaks.map((s, idx) =>
        idx === 0 ? { ...s, started_at: new Date().toISOString() } : s
      );
      await OfflineStore.saveStreaks(updatedStreaks, user.id);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <Button
            title="← Back"
            onPress={() => {
              stopUrgeCountdown();
              router.back();
            }}
            variant="outline"
            size="sm"
          />
          <Sticker text="URGE SURFING MODE" color="pink" rotation={-1} />
        </View>

        {!loggedOutcome ? (
          <>
            {/* Title Card */}
            <Card bgColor={colors.electricYellow} style={styles.titleCard}>
              <Text style={styles.emergencyHeadline}>URGE SURFING SESSION</Text>
              <Text style={styles.emergencySubtext}>
                Cravings are like ocean waves: they peak, then collapse in under 10 minutes. Stay with your breath.
              </Text>
            </Card>

            {/* Countdown Clock Display */}
            <View
              style={[
                styles.timerBox,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                },
                NeoShadows.lg,
              ]}
            >
              <Text style={[styles.timerNumbers, { color: colors.text }]}>
                {formattedTime}
              </Text>
              <Text style={[styles.timerLabel, { color: colors.muted }]}>
                TIME REMAINING IN SURFING WINDOW
              </Text>
            </View>

            {/* 4-4-4-4 Box Breathing Animation Circle */}
            <BreathingCircle
              phase={breathingPhase}
              phaseSeconds={breathingSeconds}
            />

            {/* Suggested Creative Pivots from Hobbies */}
            <Text style={[styles.pivotsTitle, { color: colors.text }]}>
              OR REDIRECT TO A 10-MINUTE CREATIVE PIVOT:
            </Text>

            <View style={styles.pivotsGrid}>
              {hobbies.length === 0 ? (
                <Card
                  bgColor={colors.electricYellow}
                  style={styles.pivotCard}
                  onPress={() => router.push('/hobbies' as any)}
                >
                  <View style={styles.pivotCardHeader}>
                    <Ionicons name="sparkles" size={20} color="#000000" />
                    <Text style={styles.pivotHobbyName}>ADD YOUR PASSION CRAFTS</Text>
                  </View>
                  <Text style={styles.pivotActionText}>
                    Set up Drawing, Music, or Editing in Hobbies to unlock custom micro-challenges!
                  </Text>
                </Card>
              ) : (
                hobbies.slice(0, 3).map((hobby) => {
                  const sampleAction =
                    hobby.creative_challenges?.[0] ||
                    hobby.mini_projects?.[0] ||
                    `Spend 10 minutes on ${hobby.title}`;

                  return (
                    <Card
                      key={hobby.id}
                      bgColor={hobby.color}
                      style={styles.pivotCard}
                      onPress={() => router.push('/hobbies' as any)}
                    >
                      <View style={styles.pivotCardHeader}>
                        <Ionicons name={hobby.icon as any || 'star'} size={20} color="#000000" />
                        <Text style={styles.pivotHobbyName}>{hobby.title.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.pivotActionText}>{sampleAction}</Text>
                    </Card>
                  );
                })
              )}
            </View>

            {/* Outcome Logging Trigger */}
            <Card style={styles.outcomeActionCard}>
              <Text style={[styles.outcomePrompt, { color: colors.text }]}>
                HOW DID THIS CRAVING PASS?
              </Text>
              <View style={styles.outcomeBtnRow}>
                <Button
                  title="Resisted It! 💪"
                  onPress={() => handleOutcome('resisted')}
                  variant="mint"
                  size="lg"
                  style={styles.outcomeBtn}
                />
                <Button
                  title="I Slipped 🕊️"
                  onPress={() => handleOutcome('slipped')}
                  variant="outline"
                  size="lg"
                  style={styles.outcomeBtn}
                />
              </View>
            </Card>
          </>
        ) : (
          /* Logged Outcome Feedback View */
          <Card
            bgColor={loggedOutcome === 'resisted' ? colors.mintGreen : colors.surfaceSubtle}
            style={styles.feedbackCard}
          >
            <View style={styles.feedbackIconCircle}>
              <Ionicons
                name={loggedOutcome === 'resisted' ? 'trophy' : 'heart'}
                size={40}
                color="#000000"
              />
            </View>
            <Text style={styles.feedbackTitle}>
              {loggedOutcome === 'resisted'
                ? 'VICTORY LOGGED! 🔥'
                : 'NO GUILT. CLEAN RESTART. 🌱'}
            </Text>
            <Text style={styles.feedbackBody}>
              {loggedOutcome === 'resisted'
                ? "You showed up for yourself. Every urge you surf weakens the brain's addiction pathway."
                : "A slip doesn't erase your progress. Take a deep breath, reset your streak, and redirect your focus to creation."}
            </Text>
            <Button
              title="Return To Dashboard"
              onPress={() => router.replace('/' as any)}
              variant="primary"
              size="lg"
              style={styles.returnBtn}
            />
          </Card>
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
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleCard: {
    padding: 16,
    marginBottom: 16,
  },
  emergencyHeadline: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  emergencySubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222222',
    marginTop: 4,
    lineHeight: 18,
  },
  timerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: NeoBorders.chunky,
    borderRadius: NeoRadii.md,
    marginBottom: 10,
    shadowColor: '#000000',
  },
  timerNumbers: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pivotsTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  pivotsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  pivotCard: {
    padding: 14,
  },
  pivotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pivotHobbyName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  pivotActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  outcomeActionCard: {
    padding: 18,
    marginTop: 10,
  },
  outcomePrompt: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  outcomeBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outcomeBtn: {
    flex: 1,
  },
  feedbackCard: {
    alignItems: 'center',
    padding: 28,
    marginTop: 30,
  },
  feedbackIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  feedbackBody: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
    maxWidth: 480,
  },
  returnBtn: {
    width: '100%',
    maxWidth: 320,
  },
});
