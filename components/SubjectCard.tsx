import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { KIWI_THEME } from '../constants/theme';
import SubjectIcon from './SubjectIcon';

type SubjectCardProps = {
  title: string;
  subtitle: string;
  iconKey?: string | null;
  onPress?: () => void;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function SubjectCard({
  title,
  subtitle,
  iconKey,
  onPress,
  showChevron = true,
  style,
  testID,
}: SubjectCardProps) {
  const interactive = Boolean(onPress);

  return (
    <Pressable
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [styles.container, style, interactive && pressed && styles.pressed]}
      testID={testID}
    >
      <SubjectIcon iconKey={iconKey} />
      <View style={styles.textContent}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      {showChevron ? (
        <View style={styles.trailing}>
          <ChevronRight color={KIWI_THEME.colors.textPrimary} size={18} strokeWidth={2.2} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    flexDirection: 'row',
    minHeight: 90,
    paddingHorizontal: KIWI_THEME.spacing.xl,
    paddingVertical: KIWI_THEME.spacing.xl,
  },
  pressed: {
    opacity: 0.88,
  },
  textContent: {
    flex: 1,
    marginLeft: KIWI_THEME.spacing.md,
    minWidth: 0,
  },
  title: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18 / 1.125,
    letterSpacing: 0,
  },
  subtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 2,
  },
  trailing: {
    marginLeft: KIWI_THEME.spacing.sm,
  },
});
