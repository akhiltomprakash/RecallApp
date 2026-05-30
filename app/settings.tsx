import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import { KIWI_THEME } from '../constants/theme';
import { clearLocalDemoData } from '../db/queries';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  saveGeminiApiKey,
  testGeminiConnection,
} from '../utils/llm';

export default function SettingsScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isClearingKey, setIsClearingKey] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const savedKey = await getGeminiApiKey();
      setApiKey(savedKey ?? '');
      setHasSavedKey(Boolean(savedKey));
      setStatusMessage(null);
    } catch {
      setStatusMessage('Could not read saved settings.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings])
  );

  return (
    <KiwiScreen>
      <KiwiTopBar title="Settings" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gemini API key</Text>
          <Text style={styles.cardBody}>
            Saved locally on this device only. No key means notes still save with offline fallback.
          </Text>

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setApiKey}
            placeholder="Paste Gemini API key"
            placeholderTextColor={KIWI_THEME.colors.textSecondary}
            secureTextEntry={!showKey}
            style={styles.input}
            value={apiKey}
          />

          <View style={styles.row}>
            <KiwiButton
              fullWidth={false}
              label={showKey ? 'Hide' : 'Show'}
              onPress={() => setShowKey((current) => !current)}
              style={styles.rowButton}
              variant="secondary"
            />
            <KiwiButton
              fullWidth={false}
              label="Save"
              loading={isSaving}
              onPress={async () => {
                const trimmed = apiKey.trim();
                if (!trimmed) {
                  setStatusMessage('API key cannot be empty.');
                  return;
                }

                setIsSaving(true);
                try {
                  await saveGeminiApiKey(trimmed);
                  setHasSavedKey(true);
                  setStatusMessage('API key saved.');
                } catch (error) {
                  setStatusMessage(
                    error instanceof Error ? error.message : 'Could not save API key.'
                  );
                } finally {
                  setIsSaving(false);
                }
              }}
              style={styles.rowButton}
            />
          </View>

          <View style={styles.row}>
            <KiwiButton
              fullWidth={false}
              label="Test connection"
              loading={isTesting}
              onPress={async () => {
                setIsTesting(true);
                try {
                  const result = await testGeminiConnection(apiKey.trim());
                  setStatusMessage(result.message);
                } finally {
                  setIsTesting(false);
                }
              }}
              style={styles.rowButton}
              variant="secondary"
            />
            <KiwiButton
              fullWidth={false}
              label="Clear key"
              loading={isClearingKey}
              onPress={async () => {
                setIsClearingKey(true);
                try {
                  await clearGeminiApiKey();
                  setApiKey('');
                  setHasSavedKey(false);
                  setStatusMessage('Saved key removed.');
                } catch {
                  setStatusMessage('Could not clear saved key.');
                } finally {
                  setIsClearingKey(false);
                }
              }}
              style={styles.rowButton}
              variant="secondary"
            />
          </View>

          <Text style={styles.hint}>
            {hasSavedKey ? 'A key is saved for this device.' : 'No API key saved yet.'}
          </Text>
          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data</Text>
          <Text style={styles.cardBody}>
            Clears local cards, notes, subjects, and review logs. This is destructive.
          </Text>
          <KiwiButton
            label="Clear local demo data"
            loading={isClearingData}
            onPress={() => {
              Alert.alert(
                'Clear local data?',
                'This will permanently remove local notes, cards, review history, and custom subjects.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear data',
                    style: 'destructive',
                    onPress: () => {
                      setIsClearingData(true);
                      try {
                        clearLocalDemoData();
                        setStatusMessage('Local data cleared. Default General subject was recreated.');
                      } catch {
                        setStatusMessage('Could not clear local data.');
                      } finally {
                        setIsClearingData(false);
                      }
                    },
                  },
                ]
              );
            }}
            style={styles.dangerButton}
            variant="secondary"
          />
        </View>

        <KiwiButton
          label="Open Stats"
          onPress={() => router.push('/stats')}
          style={styles.statsButton}
          variant="secondary"
        />
      </ScrollView>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    padding: 16,
  },
  cardTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
  },
  cardBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  input: {
    backgroundColor: KIWI_THEME.colors.background,
    borderColor: KIWI_THEME.colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  rowButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  hint: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    marginTop: 10,
  },
  status: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  dangerButton: {
    marginTop: 12,
  },
  statsButton: {
    marginTop: 2,
  },
});
