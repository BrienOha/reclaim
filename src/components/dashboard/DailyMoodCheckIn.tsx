import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/useThemeStore';
import { getRandomQuote, Quote } from '@/constants/quotes';
import { NeoBorders, NeoRadii, NeoShadows } from '@/constants/theme';
import { triggerHaptic } from '@/hooks/useHaptics';

interface DailyMoodCheckInProps {
  currentMood: number | null;
  onSelectMood: (mood: number) => void;
}

const MOODS = [
  { level: 1, emoji: '😫', label: 'Rough' },
  { level: 2, emoji: '😕', label: 'Struggling' },
  { level: 3, emoji: '😐', label: 'Neutral' },
  { level: 4, emoji: '🙂', label: 'Good' },
  { level: 5, emoji: '⚡', label: 'Unstoppable' },
];

export const DailyMoodCheckIn: React.FC<DailyMoodCheckInProps> = ({
  currentMood,
  onSelectMood,
}) => {
  const { colors } = useThemeStore();
  const [quote, setQuote] = useState<Quote>(getRandomQuote);

  const handleRefreshQuote = () => {
    triggerHaptic('light');
    setQuote(getRandomQuote());
  };

  return (
    <Card style={styles.card}>
      {/* Mood Selector Header */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {"DAILY CHECK-IN: HOW'S YOUR MINDSET?"}
      </Text>
      <View style={styles.moodRow}>
        {MOODS.map((item) => {
          const isSelected = currentMood === item.level;
          return (
            <Pressable
              key={item.level}
              onPress={() => {
                triggerHaptic('medium');
                onSelectMood(item.level);
              }}
              style={({ pressed }) => [
                styles.moodBtn,
                {
                  backgroundColor: isSelected
                    ? colors.electricYellow
                    : colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderWidth: NeoBorders.hairline * 1.5,
                  borderRadius: NeoRadii.md,
                  transform: pressed
                    ? [{ scale: 0.95 }]
                    : isSelected
                    ? [{ translateY: -2 }]
                    : [],
                },
                isSelected && NeoShadows.sm,
              ]}
            >
              <Text style={styles.emojiText}>{item.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  { color: isSelected ? '#000000' : colors.muted },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Motivational Quote Box */}
      <View
        style={[
          styles.quoteBox,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.quoteHeader}>
          <Text style={[styles.quoteCategory, { color: colors.muted }]}>
            {`DAILY SPARK • ${quote.category.toUpperCase()}`}
          </Text>
          <Pressable onPress={handleRefreshQuote}>
            <Ionicons name="refresh" size={16} color={colors.text} />
          </Pressable>
        </View>
        <Text style={[styles.quoteText, { color: colors.text }]}>
          {`"${quote.text}"`}
        </Text>
        <Text style={[styles.quoteAuthor, { color: colors.muted }]}>
          {`— ${quote.author}`}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  moodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
  },
  emojiText: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quoteBox: {
    borderWidth: 2,
    borderRadius: NeoRadii.md,
    padding: 12,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quoteCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'right',
  },
});
