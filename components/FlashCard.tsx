import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KIWI_THEME } from '../constants/theme';

type FlashCardProps = {
  front: string;
  back: string;
  showAnswer: boolean;
  onToggleAnswer?: () => void;
};

export default function FlashCard({ front, back, showAnswer, onToggleAnswer }: FlashCardProps) {
  return (
    <Pressable
      disabled={!onToggleAnswer}
      onPress={onToggleAnswer}
      style={({ pressed }) => [styles.card, onToggleAnswer && pressed && styles.pressed]}
    >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Prompt</Text>
        <Text style={styles.sectionText}>{front}</Text>
      </View>

      {showAnswer ? (
        <View style={[styles.section, styles.answerSection]}>
          <Text style={styles.sectionLabel}>Answer</Text>
          <Text style={styles.sectionText}>{back}</Text>
        </View>
      ) : (
        <Text style={styles.tapHint}>Tap to reveal answer</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    minHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pressed: {
    opacity: 0.9,
  },
  section: {
    gap: 8,
  },
  answerSection: {
    borderTopColor: KIWI_THEME.colors.borderSoft,
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 16,
  },
  sectionLabel: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  sectionText: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20 / 1.25,
    letterSpacing: 0,
    lineHeight: 31,
  },
  tapHint: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    letterSpacing: 0,
    marginTop: 16,
  },
});
