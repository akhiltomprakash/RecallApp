import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import ExperimentalFeedbackController from '../components/ExperimentalFeedbackController';
import FlashCard from '../components/FlashCard';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import RatingButtons from '../components/RatingButtons';
import { KIWI_THEME } from '../constants/theme';
import { getDueCards, updateCardState, type DueCardRow } from '../db/queries';
import { useFSRS, type FSRSReviewRating } from '../hooks/useFSRS';
import {
  DEFAULT_REVIEW_FEEDBACK_SETTINGS,
  getReviewFeedbackSettings,
  type ReviewFeedbackSettings,
} from '../utils/reviewFeedbackSettings';

const parseSubjectId = (rawId: string | string[] | undefined): number | null => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const experimentalOptions: Array<{
  rating: FSRSReviewRating;
  label: string;
  image: ImageSourcePropType;
  backgroundColor: string;
  textColor: string;
}> = [
  {
    rating: 1,
    label: 'Forgot all',
    image: require('../assets/feedback-forgot-all.png'),
    backgroundColor: '#FFCDC8',
    textColor: '#700900',
  },
  {
    rating: 2,
    label: 'Forgot a bit',
    image: require('../assets/feedback-forgot-a-bit.png'),
    backgroundColor: '#FEF3C7',
    textColor: KIWI_THEME.colors.textPrimary,
  },
  {
    rating: 3,
    label: 'I recalled it',
    image: require('../assets/feedback-recalled-it.png'),
    backgroundColor: '#ECFCCB',
    textColor: KIWI_THEME.colors.textPrimary,
  },
  {
    rating: 4,
    label: 'Too easy...',
    image: require('../assets/feedback-too-easy.png'),
    backgroundColor: '#BBF7D0',
    textColor: KIWI_THEME.colors.textPrimary,
  },
];

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
  const [reviewFeedbackSettings, setReviewFeedbackSettings] = useState<ReviewFeedbackSettings>(
    DEFAULT_REVIEW_FEEDBACK_SETTINGS
  );
  const [experimentalInteraction, setExperimentalInteraction] = useState<{
    isInteracting: boolean;
    rating: FSRSReviewRating | null;
  }>({ isInteracting: false, rating: null });
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
      setExperimentalInteraction({ isInteracting: false, rating: null });
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
      void getReviewFeedbackSettings()
        .then((settings) => {
          setReviewFeedbackSettings(settings);
        })
        .catch(() => {
          setReviewFeedbackSettings(DEFAULT_REVIEW_FEEDBACK_SETTINGS);
        });
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
        setExperimentalInteraction({ isInteracting: false, rating: null });
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

      <View style={styles.reviewBody}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            currentCard ? styles.contentWithBottomFeedback : null,
          ]}
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
            </>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </ScrollView>

        {currentCard ? (
          <View pointerEvents="box-none" style={styles.bottomFeedbackLayer}>
            {!showAnswer ? (
              <KiwiButton label="Show Answer" onPress={() => setShowAnswer(true)} />
            ) : (
              <View
                style={
                  reviewFeedbackSettings.experimentalFeedbackEnabled
                    ? styles.experimentalFeedbackBlock
                    : styles.ratingBlock
                }
              >
                <Text style={styles.ratePrompt}>How well did you recall this?</Text>
                {reviewFeedbackSettings.experimentalFeedbackEnabled ? (
                  <ExperimentalFeedbackController
                    deadZoneRatio={reviewFeedbackSettings.deadZoneRatio}
                    disabled={isSubmitting}
                    hapticLevel={reviewFeedbackSettings.hapticLevel}
                    onInteractionChange={setExperimentalInteraction}
                    onRate={handleRating}
                  />
                ) : (
                  <RatingButtons disabled={isSubmitting} onRate={handleRating} />
                )}
              </View>
            )}
          </View>
        ) : null}

        {currentCard &&
        showAnswer &&
        reviewFeedbackSettings.experimentalFeedbackEnabled &&
        experimentalInteraction.isInteracting ? (
          <>
            <View pointerEvents="none" style={styles.experimentalInteractionScrim} />
            <View pointerEvents="none" style={styles.experimentalOptionsOverlay}>
              {experimentalOptions.map((option) => {
                const isActive = experimentalInteraction.rating === option.rating;

                return (
                  <View key={option.rating} style={styles.experimentalOptionSlot}>
                    <View
                      style={[
                        styles.experimentalOptionBubble,
                        isActive && { backgroundColor: option.backgroundColor },
                      ]}
                    >
                      <Image
                        resizeMode="cover"
                        source={option.image}
                        style={styles.experimentalOptionImage}
                      />
                      <Text
                        style={[
                        styles.experimentalOptionText,
                        isActive && { color: option.textColor },
                        isActive && styles.experimentalOptionTextActive,
                      ]}
                    >
                        {option.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  reviewBody: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentWithBottomFeedback: {
    paddingBottom: 172,
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
  bottomFeedbackLayer: {
    bottom: 0,
    left: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
  },
  experimentalFeedbackBlock: {
    paddingTop: 8,
  },
  experimentalInteractionScrim: {
    backgroundColor: KIWI_THEME.colors.background,
    bottom: 116,
    left: 0,
    opacity: 0.85,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  experimentalOptionsOverlay: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: 36,
    flexDirection: 'row',
    height: 114,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'absolute',
    right: 16,
    top: 238,
    zIndex: 4,
  },
  experimentalOptionSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 89,
  },
  experimentalOptionBubble: {
    alignItems: 'center',
    borderRadius: 24,
    height: 90,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 12,
    width: 89,
  },
  experimentalOptionImage: {
    height: 52,
    width: 52,
  },
  experimentalOptionText: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  experimentalOptionTextActive: {
    fontFamily: 'Nunito_700Bold',
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
