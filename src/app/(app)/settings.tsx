import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useCurrencyStore, AVAILABLE_CURRENCIES } from '@/store/useCurrencyStore';
import { useAuthStore } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { useProfileData } from '@/hooks/queries/useProfileData';
import { TasksService } from '@/services/tasks.service';
import { StreaksService } from '@/services/streaks.service';
import { HobbiesService } from '@/services/hobbies.service';
import { JournalService } from '@/services/journal.service';
import { FinanceService } from '@/services/finance.service';
import { GoalsService } from '@/services/goals.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { OfflineStore } from '@/lib/offlineStore';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';
import { queryClient } from '@/app/_layout';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useThemeStore();
  const { currency, setCurrencyCode } = useCurrencyStore();
  const { user, signOut } = useAuthStore();
  const { profile, updateProfile } = useProfileData();

  const [displayName, setDisplayName] = useState(
    profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  );
  const [profileSavedBanner, setProfileSavedBanner] = useState(false);
  const [exportSuccessBanner, setExportSuccessBanner] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  // Notifications toggles
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [dailyCheckinEnabled, setDailyCheckinEnabled] = useState(true);
  const [urgeNudgeEnabled, setUrgeNudgeEnabled] = useState(true);

  React.useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  const handleSaveProfile = async () => {
    triggerHaptic('success');
    if (user) {
      await updateProfile({
        display_name: displayName.trim(),
        currency: currency.code,
      });
    }
    setProfileSavedBanner(true);
    setTimeout(() => setProfileSavedBanner(false), 3000);
  };

  const handleExportDataJSON = async () => {
    if (!user) return;
    triggerHaptic('success');
    const [streaks, tasks, hobbies, entries, expenses, goals] = await Promise.all([
      StreaksService.getStreaks(user.id),
      TasksService.getTasks(user.id),
      HobbiesService.getHobbies(user.id),
      JournalService.getJournalEntries(user.id),
      FinanceService.getExpenses(user.id),
      GoalsService.getGoals(user.id),
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      user: user.email,
      userId: user.id,
      streaks,
      tasks,
      hobbies,
      journalEntries: entries,
      expenses,
      goals,
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `reclaim_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    setExportSuccessBanner(true);
    setTimeout(() => setExportSuccessBanner(false), 4000);
  };

  const handleConfirmResetData = async () => {
    if (!user) return;
    triggerHaptic('warning');
    await Promise.all([
      OfflineStore.saveStreaks([], user.id),
      OfflineStore.saveTasks([], user.id),
      OfflineStore.saveExpenses([], user.id),
      OfflineStore.saveJournalEntries([], user.id),
      OfflineStore.saveGoals([], user.id),
    ]);
    queryClient.clear();
    setDeleteModalVisible(false);
    router.replace('/' as any);
  };

  const handleConfirmSignOut = async () => {
    triggerHaptic('warning');
    if (user) {
      await OfflineStore.clearUserLocalData(user.id);
    }
    queryClient.clear();
    await signOut();
    setSignOutModalVisible(false);
    router.replace('/landing' as any);
  };

  const cloudConnected = isSupabaseConfigured();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                SETTINGS & PREFERENCES
              </Text>
              <SyncIndicator />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Personalize your theme, currency, data backup, and account.
            </Text>
          </View>
          <Button
            title="← Back"
            onPress={() => router.back()}
            variant="outline"
            size="sm"
          />
        </View>

        {profileSavedBanner && (
          <Card bgColor={colors.mintGreen} style={styles.alertBanner}>
            <Text style={styles.alertText}>✓ PROFILE PREFERENCES SAVED!</Text>
          </Card>
        )}

        {exportSuccessBanner && (
          <Card bgColor={colors.electricYellow} style={styles.alertBanner}>
            <Text style={styles.alertText}>
              ✓ ALL DATA EXPORTED AS JSON BACKUP FILE!
            </Text>
          </Card>
        )}

        {/* Cloud Sync & Supabase Status */}
        <Card style={styles.sectionCard}>
          <View style={styles.cloudRow}>
            <View style={styles.cloudLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: cloudConnected ? colors.mintGreen : colors.electricYellow },
                ]}
              />
              <View>
                <Text style={[styles.cardHeadline, { color: colors.text }]}>
                  {cloudConnected ? 'CLOUD SYNC ACTIVE' : 'LOCAL OFFLINE-FIRST MODE'}
                </Text>
                <Text style={[styles.cardSubtext, { color: colors.muted }]}>
                  {cloudConnected
                    ? 'Connected to Supabase Postgres & Storage with Row Level Security.'
                    : 'Operating offline with persistent local storage. Add credentials in .env to sync.'}
                </Text>
              </View>
            </View>
            <Sticker
              text={cloudConnected ? 'SYNCED' : 'OFFLINE'}
              color={cloudConnected ? 'mint' : 'yellow'}
              rotation={1}
            />
          </View>
        </Card>

        {/* Profile Card */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeadline, { color: colors.text }]}>
            PROFILE & IDENTITY
          </Text>
          <Input
            label="DISPLAY NAME"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Input
            label="ACCOUNT EMAIL"
            value={user?.email || 'reclaim@personal.app'}
            editable={false}
          />
          <Button
            title="Update Profile"
            onPress={handleSaveProfile}
            variant="accent"
            size="sm"
          />
        </Card>

        {/* Theme Settings */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeadline, { color: colors.text }]}>
            NEO-BRUTALIST THEME MODE
          </Text>
          <Text style={[styles.cardSubtext, { color: colors.muted }]}>
            Switch between crisp cream light mode and sleek obsidian dark mode.
          </Text>
          <View style={styles.pillsRow}>
            <Chip
              label="LIGHT MODE (CREAM & VIBRANT)"
              color="yellow"
              isSelected={mode === 'light'}
              onPress={() => setMode('light')}
            />
            <Chip
              label="DARK MODE (OBSIDIAN)"
              color="dark"
              isSelected={mode === 'dark'}
              onPress={() => setMode('dark')}
            />
          </View>
        </Card>

        {/* Currency Selector (Default PHP ₱) */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeadline, { color: colors.text }]}>
            DEFAULT CURRENCY
          </Text>
          <Text style={[styles.cardSubtext, { color: colors.muted }]}>
            Used across the Weekly Finance Tracker and Purchase Wishlist.
          </Text>
          <View style={styles.currencyPillsRow}>
            {AVAILABLE_CURRENCIES.map((curr) => (
              <Chip
                key={curr.code}
                label={curr.label}
                color="mint"
                isSelected={currency.code === curr.code}
                onPress={() => setCurrencyCode(curr.code)}
              />
            ))}
          </View>
        </Card>

        {/* Notification Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeadline, { color: colors.text }]}>
            NOTIFICATION NUDGES
          </Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                Task Deadline Reminders
              </Text>
              <Text style={[styles.toggleDesc, { color: colors.muted }]}>
                Alerts 1 hour before scheduled to-do deadlines.
              </Text>
            </View>
            <Button
              title={remindersEnabled ? 'ON' : 'OFF'}
              onPress={() => setRemindersEnabled(!remindersEnabled)}
              variant={remindersEnabled ? 'mint' : 'outline'}
              size="sm"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                Daily Mindset Check-In Prompt
              </Text>
              <Text style={[styles.toggleDesc, { color: colors.muted }]}>
                Gentle evening reminder to log mood and streak.
              </Text>
            </View>
            <Button
              title={dailyCheckinEnabled ? 'ON' : 'OFF'}
              onPress={() => setDailyCheckinEnabled(!dailyCheckinEnabled)}
              variant={dailyCheckinEnabled ? 'mint' : 'outline'}
              size="sm"
            />
          </View>
        </Card>

        {/* Data Backup & Export */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeadline, { color: colors.text }]}>
            DATA EXPORT & PORTABILITY
          </Text>
          <Text style={[styles.cardSubtext, { color: colors.muted }]}>
            Export your complete personal data (streaks, logs, tasks, finance, journal) at any time.
          </Text>
          <Button
            title="Export All Data as JSON File 💾"
            onPress={handleExportDataJSON}
            variant="sky"
            size="md"
            style={styles.exportBtn}
          />
        </Card>

        {/* Clinical Support Disclaimer */}
        <Card bgColor={colors.surfaceSubtle} style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="information-circle" size={22} color={colors.hotPink} />
            <Text style={[styles.disclaimerTitle, { color: colors.text }]}>
              HEALTH & RECOVERY DISCLAIMER
            </Text>
          </View>
          <Text style={[styles.disclaimerBody, { color: colors.text }]}>
            Reclaim is built as a personal habit architect, productivity enhancer, and urge surfing support tool. It is not intended to replace professional psychiatric consultation, clinical addiction therapy, or medical intervention for severe dependency disorders. If you are experiencing acute psychological distress, please seek licensed clinical assistance.
          </Text>
        </Card>

        {/* Sign Out Card */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeadline, { color: colors.text }]}>
            SESSION & AUTHENTICATION
          </Text>
          <Text style={[styles.cardSubtext, { color: colors.muted }]}>
            Logged in as {user?.email}. Sign out to end your session on this device.
          </Text>
          <Button
            title="Log Out of Reclaim 🚪"
            onPress={() => setSignOutModalVisible(true)}
            variant="outline"
            size="md"
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* Danger Zone: Reset Data */}
        <Card style={styles.dangerCard}>
          <Text style={[styles.dangerTitle, { color: colors.hotPink }]}>
            DANGER ZONE
          </Text>
          <Text style={[styles.dangerDesc, { color: colors.muted }]}>
            Clear all local and stored data. This action cannot be reversed.
          </Text>
          <Button
            title="Reset All App Data ⚠️"
            onPress={() => setDeleteModalVisible(true)}
            variant="danger"
            size="md"
          />
        </Card>

        {/* Sign Out Confirmation Modal */}
        <Modal
          visible={signOutModalVisible}
          onClose={() => setSignOutModalVisible(false)}
          title="LOG OUT OF RECLAIM"
          subtitle="Are you sure you want to end your session?"
          headerColor={colors.electricYellow}
        >
          <Text style={styles.deleteConfirmPrompt}>
            Your local cache will be cleared so no personal habits or journal pages are left behind on this device. Your data remains safe in Supabase cloud.
          </Text>
          <View style={styles.deleteModalBtnRow}>
            <Button
              title="Cancel"
              onPress={() => setSignOutModalVisible(false)}
              variant="outline"
              style={styles.modalBtn}
            />
            <Button
              title="Yes, Log Out"
              onPress={handleConfirmSignOut}
              variant="accent"
              style={styles.modalBtn}
            />
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          title="CONFIRM DATA RESET"
          subtitle="Are you sure you want to clear your streaks, tasks, and journals?"
          headerColor={colors.hotPink}
        >
          <Text style={styles.deleteConfirmPrompt}>
            This will permanently erase all local streak counts, journal canvas pages, and expense records.
          </Text>
          <View style={styles.deleteModalBtnRow}>
            <Button
              title="Cancel"
              onPress={() => setDeleteModalVisible(false)}
              variant="outline"
              style={styles.modalBtn}
            />
            <Button
              title="Yes, Reset Everything"
              onPress={handleConfirmResetData}
              variant="danger"
              style={styles.modalBtn}
            />
          </View>
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
  alertBanner: {
    padding: 12,
    marginBottom: 14,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  cloudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cloudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  cardHeadline: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  toggleText: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  toggleDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  exportBtn: {
    marginTop: 6,
  },
  disclaimerCard: {
    padding: 16,
    marginBottom: 16,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  disclaimerBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  dangerCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: NeoBorders.chunky,
    borderColor: '#FF5388',
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dangerDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  deleteConfirmPrompt: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 18,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
