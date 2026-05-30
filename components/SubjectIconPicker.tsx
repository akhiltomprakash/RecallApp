import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SubjectIconOption } from '../db/queries';
import { KIWI_THEME } from '../constants/theme';
import SubjectIcon from './SubjectIcon';

type SubjectIconPickerProps = {
  options: SubjectIconOption[];
  selectedIconKey: string;
  onSelect: (option: SubjectIconOption) => void;
};

export default function SubjectIconPicker({
  options,
  selectedIconKey,
  onSelect,
}: SubjectIconPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Choose an icon</Text>
      <ScrollView
        contentContainerStyle={styles.optionsRow}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {options.map((option) => {
          const isSelected = option.iconKey === selectedIconKey;

          return (
            <Pressable
              accessibilityLabel={`Select ${option.label} icon`}
              key={`${option.iconKey}-${option.colorKey}`}
              onPress={() => onSelect(option)}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
            >
              <SubjectIcon iconKey={option.iconKey} size={40} />
              <Text numberOfLines={1} style={styles.optionLabel}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    letterSpacing: 0,
    marginBottom: KIWI_THEME.spacing.md,
  },
  optionsRow: {
    gap: KIWI_THEME.spacing.sm,
    paddingBottom: KIWI_THEME.spacing.sm,
  },
  optionCard: {
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderColor: KIWI_THEME.colors.borderSoft,
    borderRadius: KIWI_THEME.radius.card,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: KIWI_THEME.spacing.sm,
    paddingVertical: KIWI_THEME.spacing.md,
  },
  optionCardSelected: {
    borderColor: KIWI_THEME.colors.textPrimary,
    borderWidth: 1.5,
  },
  optionLabel: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    letterSpacing: 0,
    marginTop: KIWI_THEME.spacing.sm,
  },
});

