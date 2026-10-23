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
import { z } from 'zod';
import { useAuthStore } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sticker } from '@/components/ui/Sticker';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { resetPasswordForEmail } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    triggerHaptic('medium');
    setError(null);
    setServerError(null);

    const result = forgotSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Invalid email');
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: resetErr } = await resetPasswordForEmail(email.trim());
      if (resetErr) {
        triggerHaptic('warning');
        setServerError(resetErr.message);
      } else {
        triggerHaptic('success');
        setIsSuccess(true);
      }
    } catch (e: any) {
      setServerError(e.message || 'Failed to send password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBanner}>
          <Pressable onPress={() => router.push('/login' as any)} style={styles.backLink}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backLinkText, { color: colors.text }]}>Back to Log In</Text>
          </Pressable>
          <Sticker text="ACCOUNT RECOVERY" color="pink" rotation={-2} />
        </View>

        <Card style={styles.authCard}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, NeoShadows.sm]}>
              <Ionicons name="key" size={24} color="#000000" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>RESET PASSWORD</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Enter your registered email. We will send you a secure link to create a new password.
            </Text>
          </View>

          {serverError && (
            <Card bgColor="#FFE3EC" style={styles.errorBanner}>
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={18} color="#FF5388" />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            </Card>
          )}

          {isSuccess ? (
            <Card bgColor="#E6FAF3" style={styles.successCard}>
              <View style={styles.successIconBox}>
                <Ionicons name="mail-unread" size={36} color="#00E599" />
              </View>
              <Text style={styles.successTitle}>CHECK YOUR INBOX!</Text>
              <Text style={styles.successDesc}>
                We sent a password reset link to <Text style={{ fontWeight: '900' }}>{email}</Text>. Click the link in your email to choose a new password.
              </Text>
              <Button
                title="Return to Log In →"
                onPress={() => router.push('/login' as any)}
                variant="accent"
                size="md"
                style={{ marginTop: 16 }}
              />
            </Card>
          ) : (
            <View style={styles.form}>
              <Input
                label="ACCOUNT EMAIL"
                placeholder="you@domain.com"
                value={email}
                onChangeText={setEmail}
                error={error || undefined}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                title={isSubmitting ? 'Sending Link...' : 'Send Reset Link 📩'}
                onPress={handleSubmit}
                variant="accent"
                size="lg"
                disabled={isSubmitting}
                style={styles.submitBtn}
              />
            </View>
          )}

          <View style={styles.switchRow}>
            <Pressable onPress={() => router.push('/login' as any)}>
              <Text style={[styles.switchAction, { color: colors.text }]}>← Remembered password? Log In</Text>
            </Pressable>
          </View>
        </Card>
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
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 40,
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '800',
  },
  authCard: {
    padding: 28,
  },
  header: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFE600',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    transform: [{ rotate: '-2deg' }],
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBanner: {
    padding: 12,
    marginBottom: 18,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5388',
    flex: 1,
  },
  form: {
    gap: 14,
  },
  submitBtn: {
    marginTop: 8,
  },
  successCard: {
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  switchAction: {
    fontSize: 13,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
