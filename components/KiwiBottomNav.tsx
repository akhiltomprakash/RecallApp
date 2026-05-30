import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GraduationCap, Notebook } from 'lucide-react-native';
import { KIWI_THEME } from '../constants/theme';

export type KiwiBottomTab = 'revise' | 'my-notes';

type KiwiBottomNavProps = {
  activeTab: KiwiBottomTab;
  onTabPress: (tab: KiwiBottomTab) => void;
  testID?: string;
};

type NavItemProps = {
  active: boolean;
  label: string;
  tab: KiwiBottomTab;
  onPress: (tab: KiwiBottomTab) => void;
};

function NavItem({ active, label, tab, onPress }: NavItemProps) {
  const color = active ? KIWI_THEME.colors.buttonPrimaryText : KIWI_THEME.colors.textPrimary;
  const Icon = tab === 'revise' ? GraduationCap : Notebook;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(tab)}
      style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
    >
      <Icon color={color} size={20} strokeWidth={2.2} />
      <Text numberOfLines={1} style={[styles.itemLabel, active && styles.itemLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function KiwiBottomNav({ activeTab, onTabPress, testID }: KiwiBottomNavProps) {
  return (
    <View style={styles.wrapper} testID={testID}>
      <NavItem active={activeTab === 'revise'} label="Revise" onPress={onTabPress} tab="revise" />
      <NavItem
        active={activeTab === 'my-notes'}
        label="My notes"
        onPress={onTabPress}
        tab="my-notes"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.navSurface,
    borderTopLeftRadius: KIWI_THEME.radius.screen,
    borderTopRightRadius: KIWI_THEME.radius.screen,
    flexDirection: 'row',
    gap: KIWI_THEME.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 94,
    paddingBottom: 26,
    paddingHorizontal: 36,
    paddingTop: 12,
  },
  item: {
    alignItems: 'center',
    borderRadius: KIWI_THEME.radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: KIWI_THEME.spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: KIWI_THEME.spacing.xl,
    paddingVertical: KIWI_THEME.spacing.md,
  },
  itemActive: {
    backgroundColor: KIWI_THEME.colors.buttonPrimary,
  },
  itemPressed: {
    opacity: 0.85,
  },
  itemLabel: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    letterSpacing: 0,
  },
  itemLabelActive: {
    color: KIWI_THEME.colors.buttonPrimaryText,
  },
});

