import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import { KIWI_THEME } from '../constants/theme';

export default function AddCardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const subjectName = params.subjectName ? String(params.subjectName) : 'General';

  return (
    <KiwiScreen>
      <KiwiTopBar
        onBackPress={() => router.back()}
        onSettingsPress={() => router.push('/settings')}
        title="Add notes"
      />

      <View style={styles.container}>
        <Text style={styles.title}>Selected subject</Text>
        <Text style={styles.subjectName}>{subjectName}</Text>
        <Text style={styles.description}>
          Add Notes flow will be built in the next step. Navigation wiring is now complete.
        </Text>
        <KiwiButton label="Create subject" onPress={() => router.push('/create-subject')} />
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
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    letterSpacing: 0,
    textAlign: 'center',
  },
  subjectName: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 28 / 1.25,
    letterSpacing: 0,
    marginTop: 8,
    textAlign: 'center',
  },
  description: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    marginBottom: 20,
    marginTop: 8,
    textAlign: 'center',
  },
});
