import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import SubjectCard from '../components/SubjectCard';
import SubjectIcon from '../components/SubjectIcon';
import { KIWI_THEME } from '../constants/theme';
import { addCardsForNote, createNote, getSubjects, type SubjectSummary } from '../db/queries';
import { getGeminiApiKey, organizeNoteWithGemini } from '../utils/llm';

const parseSubjectId = (rawId: string | string[] | undefined): number | null => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeBody = (value: string): string => value.replace(/\s+/g, ' ').trim();

const generateNoteTitle = (body: string): string => {
  const normalized = normalizeBody(body);
  if (!normalized) {
    return 'Untitled note';
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const firstSentence = sentences.find((item) => item.length >= 8) ?? sentences[0] ?? normalized;
  const cleaned = firstSentence.replace(/[.!?]+$/, '').trim();
  if (cleaned.length <= 64) {
    return cleaned;
  }
  return `${cleaned.slice(0, 61).trim()}...`;
};

const summarizeBody = (body: string): string => {
  const normalized = normalizeBody(body);
  if (normalized.length <= 260) {
    return normalized;
  }
  return `${normalized.slice(0, 260).trim()}...`;
};

export default function AddCardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const initialSubjectId = parseSubjectId(params.subjectId);

  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(initialSubjectId);
  const [noteBody, setNoteBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadSubjects = useCallback((refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextSubjects = getSubjects();
      setSubjects(nextSubjects);

      if (nextSubjects.length === 0) {
        setSelectedSubjectId(null);
        return;
      }

      const hasCurrent = nextSubjects.some((subject) => subject.id === selectedSubjectId);
      if (!hasCurrent) {
        const preferredFromParams = nextSubjects.find((subject) => subject.id === initialSubjectId);
        setSelectedSubjectId(preferredFromParams?.id ?? nextSubjects[0].id);
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [initialSubjectId, selectedSubjectId]);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedSubjectId, subjects]
  );

  const canSave = Boolean(selectedSubject && normalizeBody(noteBody).length > 0 && !isSaving);

  const handleSave = useCallback(async () => {
    if (!canSave || !selectedSubject) {
      return;
    }

    setErrorMessage(null);
    setSaveMessage(null);
    setIsSaving(true);

    try {
      const normalizedBody = normalizeBody(noteBody);
      const fallbackTitle = generateNoteTitle(normalizedBody);
      const fallbackCards = [
        {
          front: fallbackTitle.endsWith('?')
            ? fallbackTitle
            : `What should I remember about ${fallbackTitle}?`,
          back: summarizeBody(normalizedBody),
          cardType: 'basic',
        },
      ] as const;

      let title = fallbackTitle;
      let cardsToCreate: Array<{ front: string; back: string; cardType: string }> = [...fallbackCards];
      let savedWithAi = false;
      let aiFailureMessage: string | null = null;

      const apiKey = await getGeminiApiKey();
      if (apiKey) {
        try {
          const organized = await organizeNoteWithGemini(normalizedBody);
          title = organized.title || fallbackTitle;
          cardsToCreate =
            organized.flashcards.length > 0
              ? organized.flashcards.map((card) => ({
                  front: card.front,
                  back: card.back,
                  cardType: 'basic',
                }))
              : [
                  {
                    front: title.endsWith('?') ? title : `What should I remember about ${title}?`,
                    back: organized.summary || summarizeBody(normalizedBody),
                    cardType: 'basic',
                  },
                ];
          savedWithAi = true;
        } catch (error) {
          savedWithAi = false;
          aiFailureMessage = error instanceof Error ? error.message : 'Gemini request failed.';
        }
      }

      const noteId = createNote(selectedSubject.id, title, normalizedBody);
      addCardsForNote(selectedSubject.id, noteId, cardsToCreate);

      setNoteBody('');
      setSaveMessage(
        savedWithAi
          ? 'Saved with AI organization.'
          : apiKey
            ? `Saved without AI organization. ${aiFailureMessage ?? 'Gemini request failed.'}`
            : 'Saved without AI organization. No API key found.'
      );

      setTimeout(() => {
        router.replace(`/subject/${selectedSubject.id}`);
      }, 220);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message || 'Could not save your note right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [canSave, noteBody, router, selectedSubject]);

  return (
    <KiwiScreen>
      <KiwiTopBar
        onBackPress={() => router.back()}
        onSettingsPress={() => router.push('/settings')}
        title="Add notes"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => loadSubjects(true)}
            refreshing={isRefreshing}
            tintColor={KIWI_THEME.colors.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {subjects.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No subjects yet</Text>
            <Text style={styles.emptyBody}>
              Create a subject first, then come back here to add notes.
            </Text>
            <KiwiButton label="Create subject" onPress={() => router.push('/create-subject')} />
          </View>
        ) : (
          <>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Select a subject</Text>
              <Pressable
                disabled={!selectedSubject}
                onPress={() => setPickerOpen(true)}
                style={({ pressed }) => [
                  styles.subjectPicker,
                  pressed && selectedSubject ? styles.pressed : undefined,
                ]}
              >
                {selectedSubject ? (
                  <>
                    <SubjectIcon iconKey={selectedSubject.iconKey} size={34} />
                    <Text numberOfLines={1} style={styles.subjectPickerText}>
                      {selectedSubject.name}
                    </Text>
                    <ChevronDown
                      color={KIWI_THEME.colors.textPrimary}
                      size={18}
                      strokeWidth={2.2}
                    />
                  </>
                ) : (
                  <Text style={styles.subjectPickerPlaceholder}>Select subject</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.fieldBlock}>
              <TextInput
                multiline
                onChangeText={setNoteBody}
                placeholder="Type or paste a paragraph here"
                placeholderTextColor={KIWI_THEME.colors.textSecondary}
                style={styles.noteInput}
                textAlignVertical="top"
                value={noteBody}
              />
            </View>

            <KiwiButton
              disabled={!canSave}
              label="Save"
              loading={isSaving}
              onPress={handleSave}
              style={styles.saveButton}
            />

            <Text style={styles.helperText}>Kiwi will intelligently organise and save your note</Text>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
        transparent
        visible={pickerOpen}
      >
        <Pressable onPress={() => setPickerOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose subject</Text>
            <ScrollView
              contentContainerStyle={styles.modalList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {subjects.map((subject) => (
                <SubjectCard
                  iconKey={subject.iconKey}
                  key={subject.id}
                  onPress={() => {
                    setSelectedSubjectId(subject.id);
                    setPickerOpen(false);
                  }}
                  showChevron={false}
                  style={subject.id === selectedSubjectId ? styles.selectedSubjectRow : undefined}
                  subtitle={`${subject.noteCount} notes`}
                  title={subject.name}
                />
              ))}
            </ScrollView>
            <KiwiButton
              label="Create subject"
              onPress={() => {
                setPickerOpen(false);
                router.push('/create-subject');
              }}
              style={styles.createSubjectButton}
              variant="secondary"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 38,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  fieldBlock: {
    width: '100%',
  },
  fieldLabel: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    marginBottom: 10,
  },
  subjectPicker: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.pill,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  subjectPickerText: {
    color: KIWI_THEME.colors.textPrimary,
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
  },
  subjectPickerPlaceholder: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
  },
  noteInput: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 280,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  saveButton: {
    marginTop: 4,
  },
  helperText: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: KIWI_THEME.colors.danger,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#166534',
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyState: {
    ...KIWI_THEME.shadows.card,
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
  },
  emptyBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    marginBottom: 16,
    marginTop: 6,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.28)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.background,
    borderRadius: KIWI_THEME.radius.cardLarge,
    maxHeight: '80%',
    paddingHorizontal: 14,
    paddingTop: 16,
    width: '100%',
  },
  modalTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalList: {
    gap: 10,
    paddingBottom: 10,
  },
  selectedSubjectRow: {
    borderColor: KIWI_THEME.colors.textPrimary,
    borderWidth: 1.2,
  },
  createSubjectButton: {
    marginBottom: 14,
    marginTop: 8,
  },
});
