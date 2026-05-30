import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Settings2 } from 'lucide-react-native';
import { KIWI_THEME } from '../constants/theme';

type KiwiTopBarProps = {
  title: string;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  hideBackButton?: boolean;
  hideSettingsButton?: boolean;
  testID?: string;
};

export default function KiwiTopBar({
  title,
  onBackPress,
  onSettingsPress,
  hideBackButton = false,
  hideSettingsButton = false,
  testID,
}: KiwiTopBarProps) {
  const showBackButton = !hideBackButton && Boolean(onBackPress);
  const showSettingsButton = !hideSettingsButton && Boolean(onSettingsPress);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.side}>
        {showBackButton ? (
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={onBackPress}
            style={styles.iconButton}
          >
            <ChevronLeft color={KIWI_THEME.colors.textPrimary} size={20} strokeWidth={2.25} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>
        {showSettingsButton ? (
          <Pressable
            accessibilityLabel="Open settings"
            hitSlop={8}
            onPress={onSettingsPress}
            style={styles.iconButton}
          >
            <Settings2 color={KIWI_THEME.colors.textPrimary} size={20} strokeWidth={2.25} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: KIWI_THEME.spacing.lg,
    paddingVertical: KIWI_THEME.spacing.sm,
  },
  side: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 40,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    color: KIWI_THEME.colors.textPrimary,
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 34 / 1.45,
    marginHorizontal: KIWI_THEME.spacing.md,
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  iconPlaceholder: {
    height: 32,
    width: 32,
  },
});

