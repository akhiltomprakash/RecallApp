import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import { KIWI_THEME } from '../constants/theme';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  saveGeminiApiKey,
  testGeminiConnection,
} from '../utils/llm';
import {
  DEFAULT_REVIEW_FEEDBACK_SETTINGS,
  getReviewFeedbackSettings,
  saveReviewFeedbackSettings,
  type HapticLevel,
  type ReviewFeedbackSettings,
} from '../utils/reviewFeedbackSettings';

type RequestStatus = 'idle' | 'sent' | 'success' | 'error';
type ResponseStatus = 'none' | 'waiting' | 'received';

const DEAD_ZONE_STEP = 0.05;
const DEAD_ZONE_MIN = 0;
const DEAD_ZONE_MAX = 0.3;
const hapticLabels: Record<HapticLevel, string> = {
  0: 'Off',
  1: 'Subtle',
  2: 'Default',
  3: 'Strong',
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export default function SettingsScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reviewFeedbackStatus, setReviewFeedbackStatus] = useState<string | null>(null);
  const [reviewFeedbackSettings, setReviewFeedbackSettings] = useState<ReviewFeedbackSettings>(
    DEFAULT_REVIEW_FEEDBACK_SETTINGS
  );
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isClearingKey, setIsClearingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'empty' | 'added'>('empty');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>('none');
  const [lastApiMessage, setLastApiMessage] = useState<string>('No API call yet.');
  const [lastApiTimestamp, setLastApiTimestamp] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const [savedKeyResult, savedFeedbackResult] = await Promise.allSettled([
      getGeminiApiKey(),
      getReviewFeedbackSettings(),
    ]);

    if (savedKeyResult.status === 'fulfilled') {
      setApiKey(savedKeyResult.value ?? '');
      setHasSavedKey(Boolean(savedKeyResult.value));
      setKeyStatus(savedKeyResult.value ? 'added' : 'empty');
      setStatusMessage(null);
    } else {
      setStatusMessage('Could not read saved API key.');
    }

    if (savedFeedbackResult.status === 'fulfilled') {
      setReviewFeedbackSettings(savedFeedbackResult.value);
      setReviewFeedbackStatus(null);
    } else {
      setReviewFeedbackStatus('Could not read experimental feedback settings.');
    }
  }, []);

  const persistReviewFeedbackSettings = useCallback(
    (updater: (current: ReviewFeedbackSettings) => ReviewFeedbackSettings) => {
      setReviewFeedbackSettings((current) => {
        const next = updater(current);
        void saveReviewFeedbackSettings(next)
          .then(() => {
            setReviewFeedbackStatus(null);
          })
          .catch(() => {
            setReviewFeedbackStatus('Could not save experimental feedback settings.');
          });
        return next;
      });
    },
    []
  );

  const adjustDeadZone = useCallback(
    (direction: -1 | 1) => {
      persistReviewFeedbackSettings((current) => ({
        ...current,
        deadZoneRatio: clamp(
          current.deadZoneRatio + direction * DEAD_ZONE_STEP,
          DEAD_ZONE_MIN,
          DEAD_ZONE_MAX
        ),
      }));
    },
    [persistReviewFeedbackSettings]
  );

  const adjustHaptics = useCallback(
    (direction: -1 | 1) => {
      persistReviewFeedbackSettings((current) => ({
        ...current,
        hapticLevel: clamp(current.hapticLevel + direction, 0, 3) as HapticLevel,
      }));
    },
    [persistReviewFeedbackSettings]
  );

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
                  setKeyStatus('added');
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
                const keyToTest = apiKey.trim();
                if (!keyToTest) {
                  setKeyStatus('empty');
                  setRequestStatus('idle');
                  setResponseStatus('none');
                  setLastApiMessage('API key is empty. Save a key before testing.');
                  setStatusMessage('API key cannot be empty.');
                  return;
                }

                setKeyStatus('added');
                setRequestStatus('sent');
                setResponseStatus('waiting');
                setLastApiMessage('API request sent.');
                setStatusMessage('API request sent.');
                setIsTesting(true);
                try {
                  const result = await testGeminiConnection(keyToTest);
                  setRequestStatus(result.ok ? 'success' : 'error');
                  setResponseStatus('received');
                  setLastApiMessage(result.message);
                  setLastApiTimestamp(new Date().toLocaleString());
                  setStatusMessage(result.message);
                } catch {
                  setRequestStatus('error');
                  setResponseStatus('none');
                  setLastApiMessage('API request failed before response.');
                  setLastApiTimestamp(new Date().toLocaleString());
                  setStatusMessage('Could not test Gemini connection.');
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
                  setKeyStatus('empty');
                  setRequestStatus('idle');
                  setResponseStatus('none');
                  setLastApiMessage('No API call yet.');
                  setLastApiTimestamp(null);
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
          <Text style={styles.cardTitle}>Libraries</Text>
          <Text style={styles.cardBody}>
            Browse pre-made study libraries and manage the ones already added to this device.
          </Text>
          <KiwiButton
            label="Load libraries"
            onPress={() => router.push('/libraries')}
            style={styles.libraryButton}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>LLM troubleshooting</Text>
          <Text style={styles.cardBody}>
            Use these statuses to debug key storage and Gemini API connectivity.
          </Text>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticLabel}>Key status</Text>
            <Text style={styles.diagnosticValue}>
              {keyStatus === 'added' ? 'Key added' : 'Key empty'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticLabel}>API request</Text>
            <Text style={styles.diagnosticValue}>
              {requestStatus === 'idle'
                ? 'Not sent'
                : requestStatus === 'sent'
                  ? 'Sent'
                  : requestStatus === 'success'
                    ? 'Success'
                    : 'Failed'}
            </Text>
          </View>
          <View style={styles.diagnosticRow}>
            <Text style={styles.diagnosticLabel}>API response</Text>
            <Text style={styles.diagnosticValue}>
              {responseStatus === 'none'
                ? 'Not received'
                : responseStatus === 'waiting'
                  ? 'Waiting'
                  : 'Received'}
            </Text>
          </View>
          <Text style={styles.hint}>Last API message: {lastApiMessage}</Text>
          {lastApiTimestamp ? <Text style={styles.hint}>Last checked: {lastApiTimestamp}</Text> : null}

          <KiwiButton
            label="Open LLM logs"
            onPress={() => router.push('/llm-log')}
            style={styles.logButton}
            variant="secondary"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Experimental review feedback</Text>
          <Text style={styles.cardBody}>
            Replace the four review buttons with the horizontal swipe controller on the review
            screen.
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.settingLabel}>Enable swipe controller</Text>
              <Text style={styles.hint}>
                This applies immediately and persists across app restarts.
              </Text>
            </View>
            <Switch
              onValueChange={(value) => {
                persistReviewFeedbackSettings((current) => ({
                  ...current,
                  experimentalFeedbackEnabled: value,
                }));
              }}
              thumbColor={
                reviewFeedbackSettings.experimentalFeedbackEnabled
                  ? KIWI_THEME.colors.buttonPrimaryText
                  : '#FFFFFF'
              }
              trackColor={{
                false: KIWI_THEME.colors.borderSoft,
                true: '#111111',
              }}
              value={reviewFeedbackSettings.experimentalFeedbackEnabled}
            />
          </View>

          {reviewFeedbackSettings.experimentalFeedbackEnabled ? (
            <>
              <View style={styles.settingGroup}>
                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingLabel}>Dead zone</Text>
                    <Text style={styles.hint}>
                      {Math.round(reviewFeedbackSettings.deadZoneRatio * 100)}% of the control.
                    </Text>
                  </View>
                  <Text style={styles.settingValue}>
                    {Math.round(reviewFeedbackSettings.deadZoneRatio * 100)}%
                  </Text>
                </View>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityLabel="Decrease dead zone"
                    hitSlop={10}
                    onPress={() => adjustDeadZone(-1)}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Increase dead zone"
                    hitSlop={10}
                    onPress={() => adjustDeadZone(1)}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.settingGroup}>
                <View style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingLabel}>Haptics</Text>
                    <Text style={styles.hint}>Fires when the swipe enters a new zone.</Text>
                  </View>
                  <Text style={styles.settingValue}>
                    {hapticLabels[reviewFeedbackSettings.hapticLevel]}
                  </Text>
                </View>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityLabel="Decrease haptic level"
                    hitSlop={10}
                    onPress={() => adjustHaptics(-1)}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Increase haptic level"
                    hitSlop={10}
                    onPress={() => adjustHaptics(1)}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}

          {reviewFeedbackStatus ? <Text style={styles.status}>{reviewFeedbackStatus}</Text> : null}
        </View>

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
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  toggleCopy: {
    flex: 1,
    paddingRight: 12,
  },
  settingGroup: {
    borderColor: KIWI_THEME.colors.borderSoft,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  settingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingLabel: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  settingValue: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.buttonSecondary,
    borderRadius: KIWI_THEME.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 52,
  },
  stepperPressed: {
    opacity: 0.85,
  },
  stepperButtonText: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    lineHeight: 18,
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
  diagnosticRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  diagnosticLabel: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
  },
  diagnosticValue: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  logButton: {
    marginTop: 12,
  },
  libraryButton: {
    marginTop: 12,
  },
});
