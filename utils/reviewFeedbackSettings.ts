import * as SecureStore from 'expo-secure-store';

export type HapticLevel = 0 | 1 | 2 | 3;

export type ReviewFeedbackSettings = {
  experimentalFeedbackEnabled: boolean;
  deadZoneRatio: number;
  hapticLevel: HapticLevel;
};

const STORAGE_KEY = 'settings.review_feedback';

export const DEFAULT_REVIEW_FEEDBACK_SETTINGS: ReviewFeedbackSettings = {
  experimentalFeedbackEnabled: false,
  deadZoneRatio: 0.1,
  hapticLevel: 2,
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const normalizeSettings = (
  value: Partial<ReviewFeedbackSettings> | null | undefined
): ReviewFeedbackSettings => {
  return {
    experimentalFeedbackEnabled: Boolean(value?.experimentalFeedbackEnabled),
    deadZoneRatio: clamp(
      value?.deadZoneRatio ?? DEFAULT_REVIEW_FEEDBACK_SETTINGS.deadZoneRatio,
      0,
      0.45
    ),
    hapticLevel: clamp(
      value?.hapticLevel ?? DEFAULT_REVIEW_FEEDBACK_SETTINGS.hapticLevel,
      0,
      3
    ) as HapticLevel,
  };
};

export async function getReviewFeedbackSettings(): Promise<ReviewFeedbackSettings> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_REVIEW_FEEDBACK_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ReviewFeedbackSettings>;
    return normalizeSettings(parsed);
  } catch {
    return DEFAULT_REVIEW_FEEDBACK_SETTINGS;
  }
}

export async function saveReviewFeedbackSettings(
  settings: ReviewFeedbackSettings
): Promise<ReviewFeedbackSettings> {
  const normalized = normalizeSettings(settings);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
