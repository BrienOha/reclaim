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

const signUpSchema = z
  .object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  });

function calculatePasswordStrength(pass: string): {
  score: number; // 0 to 3
  label: string;
  color: string;
} {
  if (!pass) return { score: 0, label: '', color: '#EAEAEA' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
  if (pass.length >= 10 && /[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score === 1) return { score: 1, label: 'WEAK', color: '#FF5388' };
  if (score === 2) return { score: 2, label: 'MEDIUM', color: '#FFE600' };
  return { score: 3, label: 'STRONG', color: '#00E599' };
}

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { signUpWithPassword } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = calculatePasswordStrength(password);

  const handleSignUp = async () => {
    triggerHaptic('medium');
    setErrors({});
    setServerError(null);

    const result = signUpSchema.safeParse({
      displayName,
      email,
      password,
      confirmPassword,
    });

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
      const { error } = await signUpWithPassword(email.trim(), password, displayName.trim());
      if (error) {
        triggerHaptic('warning');
        setServerError(error.message);
      } else {
        triggerHaptic('success');
        // Upon signup, auth store sets user which redirects to /(app) or onboarding
      }
    } catch (e: any) {
      setServerError(e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Banner */}
        <View style={styles.topBanner}>
          <Pressable onPress={() => router.push('/landing' as any)} style={styles.backLink}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backLinkText, { color: colors.text }]}>Back to Landing</Text>
          </Pressable>
          <Sticker text="FRESH START" color="mint" rotation={2} />
        </View>

        <Card style={styles.authCard}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, NeoShadows.sm]}>
              <Ionicons name="sparkles" size={24} color="#000000" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>CREATE ACCOUNT</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Start with a clean, personal workspace. Break bad habits and create freely.
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

          {/* Form Inputs */}
          <View style={styles.form}>
            <Input
              label="DISPLAY NAME"
              placeholder="e.g. Alex Rivera"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              autoCapitalize="words"
            />

            <Input
              label="EMAIL ADDRESS"
              placeholder="you@domain.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password with Show/Hide Toggle */}
            <View style={styles.passwordFieldWrapper}>
              <Input
                label="PASSWORD"
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

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthBars}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strength.score >= 1 ? strength.color : '#E0E0E0' },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strength.score >= 2 ? strength.color : '#E0E0E0' },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strength.score >= 3 ? strength.color : '#E0E0E0' },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            {/* Confirm Password */}
            <View style={styles.passwordFieldWrapper}>
              <Input
                label="CONFIRM PASSWORD"
                placeholder="Re-enter password"
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
              title={isSubmitting ? 'Creating Account...' : 'Sign Up Free 🚀'}
              onPress={handleSignUp}
              variant="accent"
              size="lg"
              disabled={isSubmitting}
              style={styles.submitBtn}
            />

            {/* Continue with Google placeholder */}
            <View style={styles.googleTodoBox}>
              <Ionicons name="logo-google" size={18} color={colors.muted} />
              <Text style={[styles.googleTodoText, { color: colors.muted }]}>
                Continue with Google (TODO: OAuth Config)
              </Text>
            </View>
          </View>

          {/* Switch to Log In */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchPrompt, { color: colors.muted }]}>
              Already have an account?
            </Text>
            <Pressable onPress={() => router.push('/login' as any)}>
              <Text style={[styles.switchAction, { color: colors.text }]}>Log In →</Text>
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
    paddingVertical: 30,
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
  strengthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -6,
    marginBottom: 6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#000000',
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  submitBtn: {
    marginTop: 8,
  },
  googleTodoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderColor: '#CCCCCC',
    borderWidth: 1.5,
    borderRadius: NeoRadii.md,
    backgroundColor: '#FAFAFA',
    marginTop: 4,
  },
  googleTodoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  switchPrompt: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchAction: {
    fontSize: 13,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
