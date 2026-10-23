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

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { updatePassword } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    triggerHaptic('medium');
    setErrors({});
    setServerError(null);

    const result = resetSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        triggerHaptic('warning');
        setServerError(error.message);
      } else {
        triggerHaptic('success');
        setIsSuccess(true);
      }
    } catch (e: any) {
      setServerError(e.message || 'Failed to update password.');
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
          <Sticker text="SECURITY UPDATE" color="mint" rotation={1} />
        </View>

        <Card style={styles.authCard}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, NeoShadows.sm]}>
              <Ionicons name="lock-closed" size={24} color="#000000" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>SET NEW PASSWORD</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Enter a strong password to secure your Reclaim account.
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
              <Ionicons name="checkmark-circle" size={48} color="#00E599" />
              <Text style={styles.successTitle}>PASSWORD UPDATED!</Text>
              <Text style={styles.successDesc}>
                Your password has been changed successfully. You can now use your new password.
              </Text>
              <Button
                title="Go to Dashboard ⚡"
                onPress={() => router.replace('/' as any)}
                variant="accent"
                size="md"
                style={{ marginTop: 16 }}
              />
            </Card>
          ) : (
            <View style={styles.form}>
              <View style={styles.passwordFieldWrapper}>
                <Input
                  label="NEW PASSWORD"
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View style={styles.passwordFieldWrapper}>
                <Input
                  label="CONFIRM NEW PASSWORD"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  error={errors.confirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <Button
                title={isSubmitting ? 'Updating...' : 'Update Password 🔒'}
                onPress={handleUpdate}
                variant="accent"
                size="lg"
                disabled={isSubmitting}
                style={styles.submitBtn}
              />
            </View>
          )}
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
  passwordFieldWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 36,
    padding: 4,
  },
  submitBtn: {
    marginTop: 8,
  },
  successCard: {
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginTop: 10,
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
  },
});
