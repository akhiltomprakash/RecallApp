import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KIWI_THEME } from '../constants/theme';

type KiwiScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  withBottomNavSpacing?: boolean;
  testID?: string;
};

export default function KiwiScreen({
  children,
  style,
  contentStyle,
  scrollable = false,
  withBottomNavSpacing = false,
  testID,
}: KiwiScreenProps) {
  const spacingStyle = withBottomNavSpacing ? styles.withBottomNavSpacing : undefined;

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, style]} testID={testID}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, spacingStyle, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, style]} testID={testID}>
      <View style={[styles.content, spacingStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KIWI_THEME.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: KIWI_THEME.colors.background,
  },
  scrollContent: {
    backgroundColor: KIWI_THEME.colors.background,
    flexGrow: 1,
  },
  withBottomNavSpacing: {
    paddingBottom: 112,
  },
});

