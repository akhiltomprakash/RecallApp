import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiBottomNav from '../components/KiwiBottomNav';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import SubjectCard from '../components/SubjectCard';
import { KIWI_THEME } from '../constants/theme';
import { getSubjects, type SubjectSummary } from '../db/queries';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  saveGeminiApiKey,
  testGeminiConnection,
} from '../utils/llm';

export default function MyNotesScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiPanelOpen, setApiPanelOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [isClearingApiKey, setIsClearingApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const loadSubjects = useCallback((refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setSubjects(getSubjects());
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const loadGeminiKey = useCallback(async () => {
    try {
      const savedKey = await getGeminiApiKey();
      setHasSavedKey(Boolean(savedKey));
      setApiKeyInput(savedKey ?? '');
      setApiStatusMessage(null);
    } catch {
      setApiStatusMessage('Could not load API key from secure storage.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
      void loadGeminiKey();
    }, [loadGeminiKey, loadSubjects])
  );

  const totalNotes = useMemo(
    () => subjects.reduce((sum, subject) => sum + subject.noteCount, 0),
    [subjects]
  );

  return (
    <KiwiScreen>
      <KiwiTopBar
        title="My Notes"
        onSettingsPress={() => {
          setMenuOpen((current) => !current);
          if (apiPanelOpen) {
            setApiPanelOpen(false);
          }
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadSubjects(true)}
            refreshing={isRefreshing}
            tintColor={KIWI_THEME.colors.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {subjects.length} Subjects · {totalNotes} notes
        </Text>

        {subjects.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No subjects yet</Text>
            <Text style={styles.emptyDescription}>
              Create a subject and start collecting your notes.
            </Text>
            <KiwiButton
              label="Create subject"
              onPress={() => router.push('/create-subject')}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          subjects.map((subject) => {
            return (
              <SubjectCard
                iconKey={subject.iconKey}
                key={subject.id}
                onPress={() => router.push(`/subject/${subject.id}`)}
                subtitle={`${subject.noteCount} notes`}
                title={subject.name}
              />
            );
          })
        )}
      </ScrollView>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <KiwiButton
          fullWidth={false}
          label="Add notes"
          onPress={() => router.push('/add-cards')}
          style={styles.fab}
        />
      </View>

      <KiwiBottomNav
        activeTab="my-notes"
        onTabPress={(tab) => {
          if (tab === 'revise') {
            router.push('/');
          }
        }}
      />

      {menuOpen ? (
        <>
          <Pressable
            onPress={() => setMenuOpen(false)}
            style={styles.overlayDismiss}
            testID="settings-menu-dismiss"
          />
          <View style={styles.settingsMenu}>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setApiPanelOpen(true);
                setApiStatusMessage(null);
              }}
              style={({ pressed }) => [styles.settingsMenuItem, pressed && styles.pressed]}
              testID="settings-menu-api-key"
            >
              <Text style={styles.settingsMenuItemText}>Set API key</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {apiPanelOpen ? (
        <>
          <Pressable
            onPress={() => {
              setApiPanelOpen(false);
              setApiStatusMessage(null);
            }}
            style={styles.overlayDismiss}
            testID="api-panel-dismiss"
          />
          <View style={styles.apiPanel}>
            <Text style={styles.apiPanelTitle}>Gemini API key</Text>
            <Text style={styles.apiPanelSubtitle}>
              Stored only on this device. We can add more settings items here later.
            </Text>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setApiKeyInput}
              placeholder="Paste Gemini API key"
              placeholderTextColor={KIWI_THEME.colors.textSecondary}
              secureTextEntry={!showApiKey}
              style={styles.apiInput}
              value={apiKeyInput}
            />

            <View style={styles.apiRow}>
              <KiwiButton
                fullWidth={false}
                label={showApiKey ? 'Hide' : 'Show'}
                onPress={() => setShowApiKey((current) => !current)}
                style={styles.apiActionButton}
                variant="secondary"
              />
              <KiwiButton
                fullWidth={false}
                label="Save"
                loading={isSavingApiKey}
                onPress={async () => {
                  const trimmed = apiKeyInput.trim();
                  if (!trimmed) {
                    setApiStatusMessage('API key cannot be empty.');
                    return;
                  }

                  setIsSavingApiKey(true);
                  try {
                    await saveGeminiApiKey(trimmed);
                    setHasSavedKey(true);
                    setApiStatusMessage('API key saved.');
                  } catch (error) {
                    setApiStatusMessage(
                      error instanceof Error ? error.message : 'Could not save API key.'
                    );
                  } finally {
                    setIsSavingApiKey(false);
                  }
                }}
                style={styles.apiActionButton}
              />
            </View>

            <View style={styles.apiRow}>
              <KiwiButton
                fullWidth={false}
                label="Test"
                loading={isTestingApiKey}
                onPress={async () => {
                  setIsTestingApiKey(true);
                  try {
                    const result = await testGeminiConnection(apiKeyInput.trim());
                    setApiStatusMessage(result.message);
                  } finally {
                    setIsTestingApiKey(false);
                  }
                }}
                style={styles.apiActionButton}
                variant="secondary"
              />
              <KiwiButton
                fullWidth={false}
                label="Clear"
                loading={isClearingApiKey}
                onPress={async () => {
                  setIsClearingApiKey(true);
                  try {
                    await clearGeminiApiKey();
                    setApiKeyInput('');
                    setHasSavedKey(false);
                    setApiStatusMessage('Saved key removed from this device.');
                  } catch {
                    setApiStatusMessage('Could not clear API key.');
                  } finally {
                    setIsClearingApiKey(false);
                  }
                }}
                style={styles.apiActionButton}
                variant="secondary"
              />
            </View>

            <Text style={styles.apiHint}>
              {hasSavedKey ? 'A key is currently saved.' : 'No key saved yet.'}
            </Text>
            {apiStatusMessage ? <Text style={styles.apiStatus}>{apiStatusMessage}</Text> : null}
          </View>
        </>
      ) : null}
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingBottom: 140,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 17,
    letterSpacing: 0,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20,
    letterSpacing: 0,
  },
  emptyDescription: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 18,
  },
  fabLayer: {
    bottom: 116,
    position: 'absolute',
    right: 16,
  },
  fab: {
    minWidth: 124,
    paddingHorizontal: 24,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  settingsMenu: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: 14,
    minWidth: 190,
    paddingVertical: 8,
    position: 'absolute',
    right: 14,
    top: 86,
  },
  settingsMenuItem: {
    borderRadius: 10,
    marginHorizontal: 8,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  settingsMenuItemText: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
  },
  apiPanel: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.card,
    left: 16,
    padding: 16,
    position: 'absolute',
    right: 16,
    top: 136,
  },
  apiPanelTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
  },
  apiPanelSubtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  apiInput: {
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
  apiRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  apiActionButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  apiHint: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    marginTop: 12,
  },
  apiStatus: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.88,
  },
});
