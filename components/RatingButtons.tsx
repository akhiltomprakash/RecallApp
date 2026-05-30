import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KIWI_THEME } from '../constants/theme';
import type { FSRSReviewRating } from '../hooks/useFSRS';

type RatingButtonsProps = {
  disabled?: boolean;
  onRate: (rating: FSRSReviewRating) => void;
};

const options: Array<{
  rating: FSRSReviewRating;
  label: string;
  backgroundColor: string;
  textColor: string;
}> = [
  { rating: 1, label: 'Again', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
  { rating: 2, label: 'Hard', backgroundColor: '#FEF3C7', textColor: '#92400E' },
  { rating: 3, label: 'Good', backgroundColor: '#DCFCE7', textColor: '#166534' },
  { rating: 4, label: 'Easy', backgroundColor: '#DBEAFE', textColor: '#1E3A8A' },
];

export default function RatingButtons({ disabled = false, onRate }: RatingButtonsProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Pressable
          disabled={disabled}
          key={option.rating}
          onPress={() => onRate(option.rating)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: option.backgroundColor },
            pressed && !disabled && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Text style={[styles.label, { color: option.textColor }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    borderRadius: KIWI_THEME.radius.pill,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: '47%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
});
