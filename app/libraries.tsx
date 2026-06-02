import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import SubjectIcon from '../components/SubjectIcon';
import { KIWI_THEME } from '../constants/theme';
import { LIBRARIES } from '../db/libraryCatalog';
import { isLibraryLoaded, loadLibrary, removeLibrary } from '../db/libraryManager';

export default function LibrariesScreen() {
  const router = useRouter();
  const [loadedLibraryIds, setLoadedLibraryIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const loadedLibraryIdSet = useMemo(() => new Set(loadedLibraryIds), [loadedLibraryIds]);

  const refreshLoadedLibraries = useCallback(() => {
    setLoadedLibraryIds(LIBRARIES.filter((library) => isLibraryLoaded(library)).map((library) => library.id));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshLoadedLibraries();
    }, [refreshLoadedLibraries])
  );

  return (
    <KiwiScreen>
      <KiwiTopBar title="Libraries" onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Load study libraries</Text>
          <Text style={styles.summaryBody}>
            Each library becomes a subject in the app. Load it once, or dismiss it later to remove it from this device.
          </Text>
          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        </View>

        {LIBRARIES.map((library) => {
          const loaded = loadedLibraryIdSet.has(library.id);
          const actionLabel = loaded ? 'Dismiss' : 'Load';

          return (
            <View key={library.id} style={styles.libraryCard}>
              <View style={styles.libraryHeader}>
                <SubjectIcon iconKey={library.iconKey} size={44} />
                <View style={styles.libraryTitleBlock}>
                  <Text style={styles.libraryTitle}>{library.displayName}</Text>
                  <Text style={styles.librarySubtitle}>{library.description}</Text>
                </View>
              </View>

              <View style={styles.libraryMetaRow}>
                <Text style={styles.libraryMeta}>{library.topicCount} topics</Text>
                <Text style={styles.libraryMeta}>{library.flashcardCount} flashcards</Text>
              </View>

              <View style={styles.libraryFooter}>
                <Text style={loaded ? styles.loadedLabel : styles.notLoadedLabel}>
                  {loaded ? 'Loaded on this device' : 'Not loaded yet'}
                </Text>
                <KiwiButton
                  fullWidth={false}
                  label={actionLabel}
                  onPress={() => {
                    if (!loaded) {
                      try {
                        const result = loadLibrary(library);
                        refreshLoadedLibraries();
                        setStatusMessage(
                          `Loaded ${library.displayName} with ${result.noteCount} notes and ${result.cardCount} flashcards.`
                        );
                      } catch (error) {
                        setStatusMessage(
                          error instanceof Error ? error.message : 'Could not load this library.'
                        );
                      }
                      return;
                    }

                    Alert.alert(
                      `Dismiss ${library.displayName}?`,
                      'This removes the loaded subject, its notes, flashcards, and review progress from this device.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Dismiss',
                          style: 'destructive',
                          onPress: () => {
                            try {
                              removeLibrary(library);
                              refreshLoadedLibraries();
                              setStatusMessage(`${library.displayName} removed.`);
                            } catch {
                              setStatusMessage(`Could not dismiss ${library.displayName}.`);
                            }
                          },
                        },
                      ]
                    );
                  }}
                  style={styles.actionButton}
                  variant={loaded ? 'secondary' : 'primary'}
                />
              </View>
            </View>
          );
        })}
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
  summaryCard: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    padding: 16,
  },
  summaryTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
  },
  summaryBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  status: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 10,
  },
  libraryCard: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    padding: 16,
  },
  libraryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  libraryTitleBlock: {
    flex: 1,
    gap: 4,
  },
  libraryTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 17,
  },
  librarySubtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
  },
  libraryMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  libraryMeta: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
  },
  libraryFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  loadedLabel: {
    color: KIWI_THEME.colors.textPrimary,
    flex: 1,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
  },
  notLoadedLabel: {
    color: KIWI_THEME.colors.textSecondary,
    flex: 1,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
  },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: 16,
  },
});
