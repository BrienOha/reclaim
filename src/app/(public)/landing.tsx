import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sticker } from '@/components/ui/Sticker';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tagline: string;
  badge: string;
  badgeColor: 'yellow' | 'mint' | 'pink' | 'blue' | 'orange' | 'lilac';
  bgColor: string;
  rotation: string;
}

const FEATURE_CARDS: FeatureCardProps[] = [
  {
    icon: 'flame',
    title: 'Urge Rescue & Streaks',
    tagline: '10-minute guided box breathing & craving distraction when urges strike.',
    badge: 'ANTI-ADDICTION',
    badgeColor: 'pink',
    bgColor: '#FFE3EC',
    rotation: '-1deg',
  },
  {
    icon: 'color-palette',
    title: 'Hobbies & Free Time Engine',
    tagline: 'Unlock creation time only when your due-today tasks are cleared.',
    badge: 'CREATIVE WORKFLOW',
    badgeColor: 'orange',
    bgColor: '#FFF0DE',
    rotation: '1deg',
  },
  {
    icon: 'checkbox',
    title: 'Notion-Style To-Do List',
    tagline: 'Priority tags, subtask checklists, and deadline filtering.',
    badge: 'PRODUCTIVITY',
    badgeColor: 'blue',
    bgColor: '#E5F6FF',
    rotation: '-0.5deg',
  },
  {
    icon: 'book',
    title: 'Visual Journal Canvas',
    tagline: '15 Google Fonts, custom stickers, photo borders, and exportable art.',
    badge: 'SELF-REFLECTION',
    badgeColor: 'lilac',
    bgColor: '#F2EAFF',
    rotation: '1deg',
  },
  {
    icon: 'wallet',
    title: 'Weekly Finance & Wishlist',
    tagline: 'Weekly allowance budgeting, spend charts, and purchase goal trackers.',
    badge: 'MINDFUL SPENDING',
    badgeColor: 'mint',
    bgColor: '#E6FAF3',
    rotation: '-1deg',
  },
  {
    icon: 'trophy',
    title: 'Tiered Goals & Roadmap',
    tagline: 'Small, Big, and Life ambitions linked directly to actionable daily tasks.',
    badge: 'LONG-TERM MASTERY',
    badgeColor: 'yellow',
    bgColor: '#FFFCE0',
    rotation: '0.5deg',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Track Your Day & Urges',
    desc: 'Log cravings, track clean streak milestones, and stay mindful with daily 1-5 mood check-ins.',
    color: '#FFE600',
  },
  {
    step: '02',
    title: 'Earn Your Creation Time',
    desc: 'Our Free Time Engine unlocks hobby sessions only after your priority to-dos are conquered.',
    color: '#00E599',
  },
  {
    step: '03',
    title: 'Build Your Real Life',
    desc: 'Turn wasted doomscroll hours into drawings, films, beats, savings, and finished projects.',
    color: '#38B6FF',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;

  const [activeMobileFeature, setActiveMobileFeature] = useState(0);

  const handleGetStarted = () => {
    triggerHaptic('heavy');
    router.push('/sign-up' as any);
  };

  const handleLogIn = () => {
    triggerHaptic('light');
    router.push('/login' as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Top Floating Mini-Nav */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.logoBadge, NeoShadows.sm]}>
            <Ionicons name="shield-checkmark" size={20} color="#000000" />
          </View>
          <Text style={[styles.brandText, { color: colors.text }]}>RECLAIM</Text>
        </View>

        <View style={styles.navActions}>
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.themeToggleBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              NeoShadows.sm,
            ]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={colors.text} />
          </Pressable>

          <Button
            title="Log In"
            onPress={handleLogIn}
            variant="outline"
            size="sm"
          />

          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="accent"
            size="sm"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { maxWidth: isDesktop ? 1080 : '100%' }]}
      >
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadgesRow}>
            <Sticker text="100% INTENTIONAL" color="yellow" rotation={-2} />
            <Sticker text="ZERO DOOMSCROLLING 🚫" color="pink" rotation={3} />
          </View>

          <Text style={[styles.heroHeadline, { color: colors.text }]}>
            Break Addictions.{'\n'}
            <Text style={{ color: colors.hotPink }}>Reclaim Your Time.</Text>{'\n'}
            Build Something Real.
          </Text>

          <Text style={[styles.heroSubhead, { color: colors.muted }]}>
            The personal habit architect that transforms hours lost to algorithmic dopamine into masterclasses in drawing, film, design, music, and disciplined living.
          </Text>

          {/* Hero CTAs */}
          <View style={styles.heroCtaRow}>
            <Button
              title="Start Your Clean Life — Free 🚀"
              onPress={handleGetStarted}
              variant="accent"
              size="lg"
              style={styles.mainCtaBtn}
            />
            <Button
              title="I Have an Account →"
              onPress={handleLogIn}
              variant="outline"
              size="lg"
              style={styles.secondaryCtaBtn}
            />
          </View>

          {/* Quick Highlight Metrics */}
          <View style={styles.metricsBanner}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNum}>10m</Text>
              <Text style={styles.metricText}>Urge Surfing Breathing</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNum}>100%</Text>
              <Text style={styles.metricText}>Task-Gated Creation Time</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNum}>₱ / $</Text>
              <Text style={styles.metricText}>Weekly Finance Tracking</Text>
            </View>
          </View>
        </View>

        {/* FEATURES SECTION */}
        <View style={styles.sectionHeader}>
          <Sticker text="ALL-IN-ONE ARCHITECTURE" color="mint" rotation={-1} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Six Core Pillars To Guard Your Focus
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Everything you need to replace passive consumption with deep creative momentum.
          </Text>
        </View>

        {/* Feature Cards Grid (Desktop: 3x2 grid, Mobile: Stack or Swipeable) */}
        <View style={styles.cardsGrid}>
          {FEATURE_CARDS.map((card, idx) => (
            <View
              key={card.title}
              style={[
                styles.featureCardWrapper,
                { width: isDesktop ? '31%' : '100%' },
              ]}
            >
              <Card
                bgColor={card.bgColor}
                style={[
                  styles.featureCard,
                  { transform: [{ rotate: card.rotation }] },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Ionicons name={card.icon} size={24} color="#000000" />
                  </View>
                  <Sticker text={card.badge} color={card.badgeColor} rotation={idx % 2 === 0 ? 2 : -2} />
                </View>

                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardTagline}>{card.tagline}</Text>
              </Card>
            </View>
          ))}
        </View>

        {/* HOW IT WORKS SECTION */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <Sticker text="THE DAILY SYSTEM" color="blue" rotation={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              How Reclaim Works In 3 Steps
            </Text>
          </View>

          <View style={styles.stepsRow}>
            {HOW_IT_WORKS.map((step) => (
              <View
                key={step.step}
                style={[
                  styles.stepCardWrapper,
                  { width: isDesktop ? '31%' : '100%' },
                ]}
              >
                <Card bgColor={step.color} style={styles.stepCard}>
                  <Text style={styles.stepBadge}>{step.step}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </Card>
              </View>
            ))}
          </View>
        </View>

        {/* BIG BOTTOM CALL TO ACTION */}
        <Card bgColor="#FFE600" style={styles.bottomCtaBanner}>
          <Text style={styles.bottomCtaHeadline}>READY TO RECLAIM YOUR DAY?</Text>
          <Text style={styles.bottomCtaSubhead}>
            Join the personal productivity and anti-addiction revolution. Your future self will thank you.
          </Text>
          <Button
            title="Create Your Free Account Now 🔥"
            onPress={handleGetStarted}
            variant="danger"
            size="lg"
            style={styles.bottomCtaButton}
          />
        </Card>

        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.disclaimerBox}>
            <View style={styles.disclaimerIconRow}>
              <Ionicons name="information-circle" size={18} color={colors.hotPink} />
              <Text style={[styles.disclaimerTitle, { color: colors.text }]}>
                HEALTH & CLINICAL SUPPORT DISCLAIMER
              </Text>
            </View>
            <Text style={[styles.disclaimerText, { color: colors.muted }]}>
              Reclaim is a self-directed productivity tool and urge surfing companion. It is not clinical therapy, psychiatric treatment, or medical addiction counseling. If you are experiencing acute psychological distress, please seek licensed clinical assistance.
            </Text>
          </View>

          <View style={styles.copyrightRow}>
            <Text style={[styles.copyrightText, { color: colors.muted }]}>
              © 2026 RECLAIM. Offline-first, secure Supabase Row Level Security.
            </Text>
            <View style={styles.footerLinks}>
              <Pressable onPress={handleLogIn}>
                <Text style={[styles.footerLinkText, { color: colors.text }]}>Log In</Text>
              </Pressable>
              <Text style={{ color: colors.muted }}>•</Text>
              <Pressable onPress={handleGetStarted}>
                <Text style={[styles.footerLinkText, { color: colors.text }]}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: NeoBorders.hairline * 1.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFE600',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    padding: 8,
    borderRadius: NeoRadii.sm,
    borderWidth: NeoBorders.default,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 60,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroHeadline: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: -1.2,
    textAlign: 'center',
    marginBottom: 18,
  },
  heroSubhead: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 32,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mainCtaBtn: {
    minWidth: 260,
  },
  secondaryCtaBtn: {
    minWidth: 180,
  },
  metricsBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 680,
    ...NeoShadows.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  metricText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444444',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 2,
    height: 32,
    backgroundColor: '#000000',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 580,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 60,
  },
  featureCardWrapper: {
    marginVertical: 4,
  },
  featureCard: {
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    alignItems: 'center',
    justifyContent: 'center',
    ...NeoShadows.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
  },
  cardTagline: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#333333',
  },
  howItWorksSection: {
    marginBottom: 60,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  stepCardWrapper: {
    marginVertical: 4,
  },
  stepCard: {
    padding: 22,
    minHeight: 180,
  },
  stepBadge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#222222',
  },
  bottomCtaBanner: {
    padding: 36,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 60,
  },
  bottomCtaHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomCtaSubhead: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 24,
  },
  bottomCtaButton: {
    minWidth: 280,
  },
  footer: {
    paddingTop: 30,
    borderTopWidth: NeoBorders.hairline * 1.5,
  },
  disclaimerBox: {
    backgroundColor: '#F7F6F2',
    borderColor: '#000000',
    borderWidth: NeoBorders.default,
    borderRadius: NeoRadii.md,
    padding: 16,
    marginBottom: 24,
  },
  disclaimerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  copyrightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
