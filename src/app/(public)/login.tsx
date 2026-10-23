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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { signInWithPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    triggerHaptic('medium');
    setErrors({});
    setServerError(null);

    const result = loginSchema.safeParse({ email, password });
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
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) {
        triggerHaptic('warning');
        setServerError(
          error.message.includes('Invalid login credentials')
            ? 'Incorrect email or password. Please try again.'
            : error.message
        );
      } else {
        triggerHaptic('success');
      }
    } catch (e: any) {
      setServerError(e.message || 'Unable to log in. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Banner */}
        <View style={styles.topBanner}>
          <Pressable onPress={() => router.push('/landing' as any)} style={styles.backLink}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backLinkText, { color: colors.text }]}>Back to Landing</Text>
          </Pressable>
          <Sticker text="WELCOME BACK" color="yellow" rotation={-2} />
        </View>

        <Card style={styles.authCard}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, NeoShadows.sm]}>
              <Ionicons name="shield-checkmark" size={24} color="#000000" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>LOG IN TO RECLAIM</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Enter your credentials to access your personal habits and creations.
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
                placeholder="Enter your password"
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

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordRow}>
              <Pressable onPress={() => router.push('/forgot-password' as any)}>
                <Text style={[styles.forgotPasswordText, { color: colors.hotPink }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            <Button
              title={isSubmitting ? 'Logging In...' : 'Log In ⚡'}
              onPress={handleLogin}
              variant="accent"
              size="lg"
              disabled={isSubmitting}
              style={styles.submitBtn}
            />
          </View>

          {/* Switch to Sign Up */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchPrompt, { color: colors.muted }]}>
              {"Don't have an account yet?"}
            </Text>
            <Pressable onPress={() => router.push('/sign-up' as any)}>
              <Text style={[styles.switchAction, { color: colors.text }]}>Sign Up Free →</Text>
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
  passwordFieldWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 36,
    padding: 4,
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '800',
  },
  submitBtn: {
    marginTop: 8,
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
