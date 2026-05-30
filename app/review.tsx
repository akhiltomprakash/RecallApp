import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import FlashCard from '../components/FlashCard';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import RatingButtons from '../components/RatingButtons';
import { KIWI_THEME } from '../constants/theme';
import { getDueCards, updateCardState, type DueCardRow } from '../db/queries';
import { useFSRS, type FSRSReviewRating } from '../hooks/useFSRS';

const parseSubjectId = (rawId: string | string[] | undefined): number | null => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const subjectId = parseSubjectId(params.subjectId);
  const label = params.subjectName ? String(params.subjectName) : 'All subjects';
  const { schedule } = useFSRS();

  const [dueCards, setDueCards] = useState<DueCardRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDueCards = useCallback((refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextCards = getDueCards(subjectId ?? undefined);
      setDueCards(nextCards);
      setCurrentIndex(0);
      setReviewedCount(0);
      setShowAnswer(false);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load due cards.');
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      loadDueCards();
    }, [loadDueCards])
  );

  const totalCards = dueCards.length;
  const currentCard = currentIndex < totalCards ? dueCards[currentIndex] : null;
  const remainingCount = Math.max(totalCards - currentIndex, 0);
  const isComplete = !isLoading && totalCards > 0 && currentCard === null;
  const subtitle = useMemo(() => {
    if (totalCards === 0) {
      return label;
    }
    return `${label} · ${remainingCount} left`;
  }, [label, remainingCount, totalCards]);

  const handleRating = useCallback(
    (rating: FSRSReviewRating) => {
      if (!currentCard || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const nextState = schedule(currentCard.state, rating);
        updateCardState(currentCard.id, nextState, rating);

        setReviewedCount((count) => count + 1);
        setCurrentIndex((index) => index + 1);
        setShowAnswer(false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not save this review.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, schedule]
  );

  return (
    <KiwiScreen>
      <KiwiTopBar
        onBackPress={() => router.back()}
        onSettingsPress={() => router.push('/settings')}
        title="Review"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadDueCards(true)}
            refreshing={isRefreshing}
            tintColor={KIWI_THEME.colors.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{subtitle}</Text>

        {isComplete ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Session complete</Text>
            <Text style={styles.summaryBody}>
              You reviewed {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'}.
            </Text>
            <KiwiButton label="Back to Revise" onPress={() => router.replace('/')} style={styles.cta} />
          </View>
        ) : null}

        {!isComplete && !currentCard && !isLoading ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>No cards due</Text>
            <Text style={styles.summaryBody}>
              You are all caught up for this review scope.
            </Text>
            <KiwiButton label="Back to Revise" onPress={() => router.replace('/')} style={styles.cta} />
          </View>
        ) : null}

        {currentCard ? (
          <>
            <FlashCard
              back={currentCard.back}
              front={currentCard.front}
              onToggleAnswer={() => setShowAnswer((value) => !value)}
              showAnswer={showAnswer}
            />

            {!showAnswer ? (
              <KiwiButton label="Show Answer" onPress={() => setShowAnswer(true)} style={styles.cta} />
            ) : (
              <View style={styles.ratingBlock}>
                <Text style={styles.ratePrompt}>How well did you recall this?</Text>
                <RatingButtons disabled={isSubmitting} onRate={handleRating} />
              </View>
            )}
          </>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
  },
  summaryCard: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  summaryTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 24 / 1.25,
    textAlign: 'center',
  },
  summaryBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  cta: {
    marginTop: 16,
  },
  ratingBlock: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  ratePrompt: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: KIWI_THEME.colors.danger,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
});
