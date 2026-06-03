import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { KIWI_THEME } from '../constants/theme';
import type { FSRSReviewRating } from '../hooks/useFSRS';
import type { HapticLevel } from '../utils/reviewFeedbackSettings';

type ControllerLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ExperimentalFeedbackControllerProps = {
  disabled?: boolean;
  deadZoneRatio: number;
  hapticLevel: HapticLevel;
  onInteractionChange?: (state: {
    isInteracting: boolean;
    rating: FSRSReviewRating | null;
  }) => void;
  onRate: (rating: FSRSReviewRating) => void;
};

const ratingOptions: Array<{
  rating: FSRSReviewRating;
  label: string;
  backgroundColor: string;
  textColor: string;
}> = [
  { rating: 1, label: 'Again', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
  { rating: 2, label: 'Hard', backgroundColor: '#FEF3C7', textColor: '#92400E' },
  { rating: 3, label: 'Good', backgroundColor: '#ECFCCB', textColor: '#365314' },
  { rating: 4, label: 'Easy', backgroundColor: '#BBF7D0', textColor: '#166534' },
];

const handleSize = 72;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const getRatingFromX = (localX: number, width: number): FSRSReviewRating => {
  const normalized = clamp(localX / Math.max(width, 1), 0, 0.999999);
  const index = Math.min(3, Math.floor(normalized * 4));
  return ratingOptions[index].rating;
};

const getGestureState = (
  localX: number,
  width: number,
  deadZoneRatio: number
): { inDeadZone: boolean; rating: FSRSReviewRating } => {
  const rating = getRatingFromX(localX, width);
  const deadZonePx = Math.min(width * deadZoneRatio, width / 2 - 1);
  const inDeadZone = Math.abs(localX - width / 2) <= Math.max(deadZonePx, 0);

  return { inDeadZone, rating };
};

const getHapticAction = async (level: HapticLevel): Promise<void> => {
  if (level === 0) {
    return;
  }

  if (level === 1) {
    await Haptics.selectionAsync();
    return;
  }

  if (level === 2) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export default function ExperimentalFeedbackController({
  disabled = false,
  deadZoneRatio,
  hapticLevel,
  onInteractionChange,
  onRate,
}: ExperimentalFeedbackControllerProps) {
  const containerRef = useRef<View>(null);
  const lastZoneRef = useRef<FSRSReviewRating | null>(null);
  const [layout, setLayout] = useState<ControllerLayout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbX, setThumbX] = useState(0);
  const [visualRating, setVisualRating] = useState<FSRSReviewRating | null>(null);

  const measureLayout = useCallback(() => {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setLayout({ x, y, width, height });
        setThumbX(width / 2);
      }
    });
  }, []);

  useEffect(() => {
    measureLayout();
  }, [measureLayout]);

  const updateGesture = useCallback(
    (pageX: number) => {
      if (!layout) {
        return;
      }

      const localX = clamp(pageX - layout.x, 0, layout.width);
      const { inDeadZone, rating } = getGestureState(localX, layout.width, deadZoneRatio);

      setThumbX(localX);
      setVisualRating(inDeadZone ? null : rating);
      onInteractionChange?.({ isInteracting: true, rating: inDeadZone ? null : rating });

      if (!inDeadZone && lastZoneRef.current !== rating) {
        lastZoneRef.current = rating;
        void getHapticAction(hapticLevel);
      }
    },
    [deadZoneRatio, hapticLevel, layout, onInteractionChange]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && Boolean(layout),
        onMoveShouldSetPanResponder: () => !disabled && Boolean(layout),
        onPanResponderGrant: (evt) => {
          if (disabled) {
            return;
          }

          setIsDragging(true);
          lastZoneRef.current = null;
          onInteractionChange?.({ isInteracting: true, rating: null });
          updateGesture(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (_, gestureState) => {
          if (disabled) {
            return;
          }

          updateGesture(gestureState.moveX);
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (disabled || !layout) {
            return;
          }

          const pageX = gestureState.moveX || evt.nativeEvent.pageX;
          const finalLocalX = clamp(pageX - layout.x, 0, layout.width);
          const { inDeadZone, rating } = getGestureState(finalLocalX, layout.width, deadZoneRatio);
          setIsDragging(false);
          setVisualRating(null);
          lastZoneRef.current = null;
          setThumbX(layout.width / 2);
          onInteractionChange?.({ isInteracting: false, rating: null });
          if (inDeadZone) {
            return;
          }
          onRate(rating);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setVisualRating(null);
          lastZoneRef.current = null;
          onInteractionChange?.({ isInteracting: false, rating: null });
          if (layout) {
            setThumbX(layout.width / 2);
          }
        },
      }),
    [deadZoneRatio, disabled, layout, onInteractionChange, onRate, updateGesture]
  );

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      measureLayout();
    },
    [measureLayout]
  );

  const thumbTranslateX = useMemo(() => {
    if (!layout) {
      return 0;
    }
    return clamp(thumbX - handleSize / 2, 0, layout.width - handleSize);
  }, [layout, thumbX]);

  const activeOption = useMemo(() => {
    if (!visualRating) {
      return null;
    }

    return ratingOptions.find((option) => option.rating === visualRating) ?? null;
  }, [visualRating]);
  const showRestHints = !isDragging && !activeOption;

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[styles.container, disabled && styles.disabled]}
      {...panResponder.panHandlers}
    >
      {ratingOptions.map((option) => {
        return (
          <View key={option.rating} style={styles.zone}>
            <View style={styles.zoneFill} />
          </View>
        );
      })}

      {showRestHints ? (
        <View pointerEvents="none" style={styles.restHints}>
          <Text style={[styles.hintLabel, styles.leftHint]}>Missed it</Text>
          <Text style={[styles.hintLabel, styles.rightHint]}>Got it</Text>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: thumbTranslateX }],
          },
          activeOption
            ? { backgroundColor: activeOption.backgroundColor, borderColor: activeOption.textColor }
            : styles.thumbNeutral,
          !isDragging && styles.thumbResting,
        ]}
      >
        <Text style={[styles.thumbText, activeOption ? { color: activeOption.textColor } : null]}>
          Swipe
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    flexDirection: 'row',
    height: 94,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  zone: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  zoneFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: KIWI_THEME.radius.cardLarge,
    opacity: 0.9,
  },
  restHints: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 42,
    zIndex: 1,
  },
  hintLabel: {
    alignSelf: 'center',
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  leftHint: {
    textAlign: 'left',
  },
  rightHint: {
    textAlign: 'right',
  },
  thumb: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: handleSize,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 11,
    width: handleSize,
    zIndex: 3,
  },
  thumbNeutral: {
    backgroundColor: '#FFFFFF',
    borderColor: KIWI_THEME.colors.borderSoft,
  },
  thumbResting: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumbText: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },
});
