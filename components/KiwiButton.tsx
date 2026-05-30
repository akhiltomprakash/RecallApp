import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { KIWI_THEME } from '../constants/theme';

type KiwiButtonVariant = 'primary' | 'secondary';

type KiwiButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: KiwiButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function KiwiButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  testID,
}: KiwiButtonProps) {
  const isDisabled = disabled || loading || !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? KIWI_THEME.colors.buttonPrimaryText
              : KIWI_THEME.colors.buttonSecondaryText
          }
        />
      ) : (
        <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: KIWI_THEME.radius.pill,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: KIWI_THEME.spacing.xxl,
    paddingVertical: KIWI_THEME.spacing.md,
  },
  primary: {
    backgroundColor: KIWI_THEME.colors.buttonPrimary,
  },
  secondary: {
    backgroundColor: KIWI_THEME.colors.buttonSecondary,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 18 / 1.125,
    letterSpacing: 0,
  },
  primaryLabel: {
    color: KIWI_THEME.colors.buttonPrimaryText,
  },
  secondaryLabel: {
    color: KIWI_THEME.colors.buttonSecondaryText,
  },
});

