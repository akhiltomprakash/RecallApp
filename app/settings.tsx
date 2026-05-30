import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import { KIWI_THEME } from '../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <KiwiScreen>
      <KiwiTopBar title="Settings" onBackPress={() => router.back()} />
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.description}>
          LLM settings and advanced preferences are planned for the next steps.
        </Text>
        <KiwiButton label="Back" onPress={() => router.back()} style={styles.button} />
      </View>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 24,
    letterSpacing: 0,
    textAlign: 'center',
  },
  description: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
});

