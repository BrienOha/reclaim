import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/useThemeStore';
import { useCurrencyStore, AVAILABLE_CURRENCIES } from '@/store/useCurrencyStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { useProfileData } from '@/hooks/queries/useProfileData';
import { PRESET_HOBBY_TEMPLATES, OfflineStore } from '@/lib/offlineStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

const POPULAR_HABITS_TO_QUIT = [
  { name: 'Doomscrolling Shorts / Reels', category: 'Digital', icon: 'phone-portrait', color: '#FF5388' },
  { name: 'Binge Eating Late Night', category: 'Behavioral', icon: 'fast-food', color: '#FFE600' },
  { name: 'Vaping / Nicotine', category: 'Substance', icon: 'shield', color: '#00E599' },
  { name: 'Excessive Video Gaming', category: 'Digital', icon: 'game-controller', color: '#38B6FF' },
  { name: 'Compulsive Online Shopping', category: 'Financial', icon: 'cart', color: '#FF7A00' },
  { name: 'Pornography / Compulsion', category: 'Behavioral', icon: 'flame', color: '#B388FF' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const { currency, setCurrencyCode } = useCurrencyStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 2: Selected habits to quit
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    'Doomscrolling Shorts / Reels',
  ]);
  const [customHabit, setCustomHabit] = useState('');

  // Step 3: Selected hobbies (all 5 pre-selected by default)
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    PRESET_HOBBY_TEMPLATES.map((h) => h.title)
  );
  const [customHobby, setCustomHobby] = useState('');

  // Step 4: Budget
  const [allowance, setAllowance] = useState('5000');
  const [savings, setSavings] = useState('1500');

  const [isFinishing, setIsFinishing] = useState(false);

  const toggleHabit = (name: string) => {
    triggerHaptic('light');
    if (selectedHabits.includes(name)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== name));
    } else {
      setSelectedHabits([...selectedHabits, name]);
    }
  };

  const handleAddCustomHabit = () => {
    if (!customHabit.trim()) return;
    triggerHaptic('success');
    if (!selectedHabits.includes(customHabit.trim())) {
      setSelectedHabits([...selectedHabits, customHabit.trim()]);
    }
    setCustomHabit('');
  };

  const toggleHobby = (title: string) => {
    triggerHaptic('light');
    if (selectedHobbies.includes(title)) {
      setSelectedHobbies(selectedHobbies.filter((h) => h !== title));
    } else {
      setSelectedHobbies([...selectedHobbies, title]);
    }
  };

  const handleAddCustomHobby = () => {
    if (!customHobby.trim()) return;
    triggerHaptic('success');
    if (!selectedHobbies.includes(customHobby.trim())) {
      setSelectedHobbies([...selectedHobbies, customHobby.trim()]);
    }
    setCustomHobby('');
  };

  const { completeOnboarding } = useProfileData();

  const handleFinishOnboarding = async () => {
    if (!user) return;
    triggerHaptic('heavy');
    setIsFinishing(true);

    try {
      const allowanceNum = parseFloat(allowance) || 0;
      const savingsNum = parseFloat(savings) || 0;

      const currentMonday = new Date();
      currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7));
      const weekDateStr = currentMonday.toISOString().split('T')[0];

      // Prepare streaks
      const streaksPayload = selectedHabits.map((habitName) => {
        const found = POPULAR_HABITS_TO_QUIT.find((h) => h.name === habitName);
        return {
          habit_name: habitName,
          category: found?.category || 'General',
          started_at: new Date().toISOString(),
          longest_streak_days: 0,
          icon: found?.icon || 'shield',
          accent_color: found?.color || '#FF5388',
        };
      });

      // Prepare hobbies
      const hobbiesPayload = selectedHobbies.map((hobbyTitle) => {
        const template = PRESET_HOBBY_TEMPLATES.find((h) => h.title === hobbyTitle);
        return {
          title: hobbyTitle,
          description: template?.description || 'Personal craft practice',
          icon: template?.icon || 'color-palette',
          color: template?.color || '#FFE600',
          mini_projects: template?.mini_projects || [],
          creative_challenges: template?.creative_challenges || [],
        };
      });

      // Complete onboarding via ProfileService which writes directly to Supabase with toast feedback
      await completeOnboarding({
        currency: currency.code,
        streaks: streaksPayload,
        hobbies: hobbiesPayload,
        weeklyBudget: {
          weekStartDate: weekDateStr,
          allowance: allowanceNum,
          savings: savingsNum,
        },
      });

      // Sync local offline cache flag
      await OfflineStore.setOnboardingCompleted(true, user.id);

      // Navigate to Home dashboard!
      router.replace('/' as any);
    } catch (e) {
      console.error('Error during onboarding save:', e);
      await OfflineStore.setOnboardingCompleted(true, user.id);
      router.replace('/' as any);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar & Header */}
        <View style={styles.topProgress}>
          <Text style={[styles.stepCounter, { color: colors.muted }]}>
            STEP {step} OF 4
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        {/* STEP 1: WELCOME & CURRENCY */}
        {step === 1 && (
          <Card style={styles.card}>
            <View style={[styles.logoBadge, NeoShadows.sm]}>
              <Ionicons name="sparkles" size={32} color="#000000" />
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>WELCOME TO RECLAIM</Text>
            <Text style={[styles.subhead, { color: colors.muted }]}>
              {"Let's tailor your personal workspace in 60 seconds. First, choose your default currency."}
            </Text>

            <View style={styles.currencyGrid}>
              {AVAILABLE_CURRENCIES.map((curr) => {
                const isSelected = currency.code === curr.code;
                return (
                  <Pressable
                    key={curr.code}
                    onPress={() => {
                      triggerHaptic('light');
                      setCurrencyCode(curr.code);
                    }}
                    style={[
                      styles.currencyBox,
                      {
                        backgroundColor: isSelected ? colors.electricYellow : colors.cardBg,
                        borderColor: colors.border,
                      },
                      isSelected && NeoShadows.sm,
                    ]}
                  >
                    <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                    <Text style={styles.currencyCode}>{curr.code}</Text>
                    <Text style={styles.currencyLabel}>{curr.label.split('(')[0]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Button
              title="Next: Habits to Quit →"
              onPress={() => setStep(2)}
              variant="accent"
              size="lg"
              style={styles.nextBtn}
            />
          </Card>
        )}

        {/* STEP 2: HABITS TO QUIT */}
        {step === 2 && (
          <Card style={styles.card}>
            <Sticker text="RECOVERY SHIELD" color="pink" rotation={-1} />
            <Text style={[styles.headline, { color: colors.text, marginTop: 8 }]}>
              WHAT ARE YOU QUITTING?
            </Text>
            <Text style={[styles.subhead, { color: colors.muted }]}>
              Pick the addictions or bad habits you want to break. We will create clean streak counters for each.
            </Text>

            <View style={styles.optionsList}>
              {POPULAR_HABITS_TO_QUIT.map((habit) => {
                const isSelected = selectedHabits.includes(habit.name);
                return (
                  <Pressable
                    key={habit.name}
                    onPress={() => toggleHabit(habit.name)}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected ? habit.color : colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                      isSelected && NeoShadows.sm,
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={habit.icon as any}
                        size={20}
                        color={isSelected ? '#000000' : colors.text}
                      />
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected ? '#000000' : colors.text,
                            fontWeight: isSelected ? '900' : '700',
                          },
                        ]}
                      >
                        {habit.name}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? '#000000' : colors.muted}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Habit Input */}
            <View style={styles.customAddRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="ADD CUSTOM HABIT"
                  placeholder="e.g. Nail biting, sugar..."
                  value={customHabit}
                  onChangeText={setCustomHabit}
                />
              </View>
              <Button
                title="+ Add"
                onPress={handleAddCustomHabit}
                variant="outline"
                size="md"
                style={{ marginTop: 22 }}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="← Back"
                onPress={() => setStep(1)}
                variant="outline"
                size="md"
              />
              <Button
                title="Next: Creative Hobbies →"
                onPress={() => setStep(3)}
                variant="accent"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* STEP 3: CREATIVE HOBBIES */}
        {step === 3 && (
          <Card style={styles.card}>
            <Sticker text="CREATION ENGINE" color="yellow" rotation={2} />
            <Text style={[styles.headline, { color: colors.text, marginTop: 8 }]}>
              CHOOSE YOUR CRAFTS
            </Text>
            <Text style={[styles.subhead, { color: colors.muted }]}>
              Replace consumption with creation. Select the hobbies you want to master. We pre-configured 5 creative disciplines for you:
            </Text>

            <View style={styles.optionsList}>
              {PRESET_HOBBY_TEMPLATES.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby.title);
                return (
                  <Pressable
                    key={hobby.title}
                    onPress={() => toggleHobby(hobby.title)}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected ? hobby.color : colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                      isSelected && NeoShadows.sm,
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={hobby.icon as any}
                        size={20}
                        color={isSelected ? '#000000' : colors.text}
                      />
                      <View>
                        <Text
                          style={[
                            styles.optionTitle,
                            {
                              color: isSelected ? '#000000' : colors.text,
                              fontWeight: isSelected ? '900' : '700',
                            },
                          ]}
                        >
                          {hobby.title}
                        </Text>
                        <Text
                          style={[
                            styles.optionDesc,
                            { color: isSelected ? '#333333' : colors.muted },
                          ]}
                        >
                          {hobby.description}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? '#000000' : colors.muted}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Hobby Input */}
            <View style={styles.customAddRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="ADD CUSTOM HOBBY"
                  placeholder="e.g. 3D Modeling, Writing..."
                  value={customHobby}
                  onChangeText={setCustomHobby}
                />
              </View>
              <Button
                title="+ Add"
                onPress={handleAddCustomHobby}
                variant="outline"
                size="md"
                style={{ marginTop: 22 }}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="← Back"
                onPress={() => setStep(2)}
                variant="outline"
                size="md"
              />
              <Button
                title="Next: Weekly Budget →"
                onPress={() => setStep(4)}
                variant="accent"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* STEP 4: BUDGET & LAUNCH */}
        {step === 4 && (
          <Card style={styles.card}>
            <Sticker text="FINANCIAL FREEDOM" color="mint" rotation={-1} />
            <Text style={[styles.headline, { color: colors.text, marginTop: 8 }]}>
              WEEKLY BUDGET & SAVINGS
            </Text>
            <Text style={[styles.subhead, { color: colors.muted }]}>
              {`Set your weekly allowance and savings target in ${currency.symbol}. You can change this anytime.`}
            </Text>

            <View style={styles.form}>
              <Input
                label={`WEEKLY ALLOWANCE (${currency.symbol})`}
                placeholder="5000"
                value={allowance}
                onChangeText={setAllowance}
                keyboardType="numeric"
              />

              <Input
                label={`SAVINGS ALLOCATION (${currency.symbol})`}
                placeholder="1500"
                value={savings}
                onChangeText={setSavings}
                keyboardType="numeric"
              />
            </View>

            <Card bgColor="#FFFCE0" style={styles.readySummaryCard}>
              <Text style={styles.readyTitle}>🚀 YOUR CLEAN WORKSPACE IS READY</Text>
              <Text style={styles.readyText}>
                • {selectedHabits.length} Clean streak counters initialized.{'\n'}
                • {selectedHobbies.length} Creative hobbies active in Free Time Engine.{'\n'}
                • Weekly budget set to {currency.symbol}{allowance || '0'} with {currency.symbol}{savings || '0'} savings target.
              </Text>
            </Card>

            <View style={styles.btnRow}>
              <Button
                title="← Back"
                onPress={() => setStep(3)}
                variant="outline"
                size="md"
              />
              <Button
                title={isFinishing ? 'Building Workspace...' : 'Launch Reclaim 🔥'}
                onPress={handleFinishOnboarding}
                variant="accent"
                size="lg"
                disabled={isFinishing}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 30,
  },
  topProgress: {
    marginBottom: 20,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFE600',
  },
  card: {
    padding: 26,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFE600',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    transform: [{ rotate: '-3deg' }],
  },
  headline: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subhead: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  currencyBox: {
    width: '31%',
    padding: 12,
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.md,
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  currencyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.md,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  optionDesc: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  customAddRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  readySummaryCard: {
    padding: 16,
    marginBottom: 24,
  },
  readyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
  },
  readyText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#222222',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  nextBtn: {
    width: '100%',
  },
});
