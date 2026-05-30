import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import KiwiScreen from '../../components/KiwiScreen';
import KiwiTopBar from '../../components/KiwiTopBar';
import KiwiButton from '../../components/KiwiButton';
import SubjectIcon from '../../components/SubjectIcon';
import { KIWI_THEME } from '../../constants/theme';
import {
  addCard,
  deleteNote,
  getCardsForNote,
  getDueCardsForNote,
  getNoteById,
  updateNote,
  type NoteDetails,
  type NoteLinkedCard,
} from '../../db/queries';

const parseNoteId = (rawId: string | string[] | undefined): number | null => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatNoteLabel = (unixSeconds: number): string => {
  const noteDate = new Date(unixSeconds * 1000);
  const nowDate = new Date();
  const startOfNow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const startOfNote = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());
  const diffDays = Math.round(
    (startOfNow.getTime() - startOfNote.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return noteDate.toLocaleDateString();
};

const formatDueLabel = (unixSeconds: number): string => {
  const dueDate = new Date(unixSeconds * 1000);
  const nowDate = new Date();
  const startOfNow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round(
    (startOfDue.getTime() - startOfNow.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return 'Overdue';
  }
  if (diffDays === 0) {
    return 'Due today';
  }
  if (diffDays === 1) {
    return 'Due tomorrow';
  }
  return `Due ${dueDate.toLocaleDateString()}`;
};

const summarizeBody = (body: string): string => {
  const normalized = body.trim().replace(/\s+/g, ' ');
  if (normalized.length <= 220) {
    return normalized;
  }
  return `${normalized.slice(0, 220).trim()}...`;
};

export default function IndividualNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const noteId = parseNoteId(params.id);

  const [note, setNote] = useState<NoteDetails | null>(null);
  const [linkedCards, setLinkedCards] = useState<NoteLinkedCard[]>([]);
  const [dueCardCount, setDueCardCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback((refresh = false) => {
    if (!noteId) {
      setNote(null);
      setLinkedCards([]);
      setDueCardCount(0);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const loadedNote = getNoteById(noteId);
      setNote(loadedNote);
      if (!loadedNote) {
        setLinkedCards([]);
        setDueCardCount(0);
      } else {
        setDraftTitle(loadedNote.title);
        setDraftBody(loadedNote.body);
        setLinkedCards(getCardsForNote(noteId));
        setDueCardCount(getDueCardsForNote(noteId));
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [noteId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const subtitle = useMemo(() => {
    if (!note) {
      return 'Note not found';
    }
    const updatedLabel = formatNoteLabel(note.updated_at || note.created_at);
    const cardLabel = linkedCards.length === 1 ? '1 card linked' : `${linkedCards.length} cards linked`;
    const dueLabel = dueCardCount === 1 ? '1 due' : `${dueCardCount} due`;
    return `Updated ${updatedLabel} · ${cardLabel} · ${dueLabel}`;
  }, [dueCardCount, linkedCards.length, note]);

  const handleSaveNote = useCallback(() => {
    if (!note) {
      return;
    }

    const nextTitle = draftTitle.trim();
    const nextBody = draftBody.trim();
    if (!nextTitle || !nextBody) {
      Alert.alert('Missing fields', 'Please add both a title and body before saving.');
      return;
    }

    setIsSaving(true);
    try {
      updateNote(note.id, nextTitle, nextBody);
      setIsEditing(false);
      loadData();
    } catch (error) {
      Alert.alert('Unable to save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [draftBody, draftTitle, loadData, note]);

  const handleDeleteNote = useCallback(() => {
    if (!note) {
      return;
    }

    Alert.alert(
      'Delete note?',
      'This removes the note. Existing linked cards will stay in the subject.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote(note.id);
            router.replace(`/subject/${note.deck_id}`);
          },
        },
      ]
    );
  }, [note, router]);

  const handleAddGeneratedCard = useCallback(() => {
    if (!note) {
      return;
    }

    const front = note.title.endsWith('?') ? note.title : `What is ${note.title}?`;
    const back = summarizeBody(note.body);

    try {
      addCard(note.deck_id, front, back, note.id, 'basic');
      loadData();
    } catch (error) {
      Alert.alert(
        'Could not add card',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }, [loadData, note]);

  return (
    <KiwiScreen>
      <KiwiTopBar
        onBackPress={() => router.back()}
        onSettingsPress={() => router.push('/settings')}
        title="Note"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadData(true)}
            refreshing={isRefreshing}
            tintColor={KIWI_THEME.colors.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundTitle}>Loading note...</Text>
          </View>
        ) : note ? (
          <>
            <View style={styles.subjectRow}>
              <SubjectIcon iconKey={note.subjectIconKey} size={34} />
              <Text numberOfLines={1} style={styles.subjectName}>
                {note.subjectName}
              </Text>
            </View>

            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.noteContainer}>
              {isEditing ? (
                <TextInput
                  onChangeText={setDraftTitle}
                  placeholder="Note title"
                  placeholderTextColor={KIWI_THEME.colors.textSecondary}
                  style={styles.titleInput}
                  value={draftTitle}
                />
              ) : (
                <Text style={styles.noteTitle}>{note.title}</Text>
              )}

              {isEditing ? (
                <TextInput
                  multiline
                  onChangeText={setDraftBody}
                  placeholder="Note body"
                  placeholderTextColor={KIWI_THEME.colors.textSecondary}
                  style={styles.bodyInput}
                  textAlignVertical="top"
                  value={draftBody}
                />
              ) : (
                <Text style={styles.noteBody}>{note.body}</Text>
              )}
            </View>

            {isEditing ? (
              <View style={styles.actionRow}>
                <KiwiButton
                  label="Save changes"
                  loading={isSaving}
                  onPress={handleSaveNote}
                  style={styles.actionButton}
                />
                <KiwiButton
                  label="Cancel"
                  onPress={() => {
                    setDraftTitle(note.title);
                    setDraftBody(note.body);
                    setIsEditing(false);
                  }}
                  style={styles.actionButton}
                  variant="secondary"
                />
              </View>
            ) : (
              <>
                <View style={styles.actionRow}>
                  <KiwiButton
                    label="Edit note"
                    onPress={() => setIsEditing(true)}
                    style={styles.actionButton}
                  />
                  <KiwiButton
                    label="Add generated card"
                    onPress={handleAddGeneratedCard}
                    style={styles.actionButton}
                    variant="secondary"
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDeleteNote}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete note</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.linkedSection}>
              <Text style={styles.linkedTitle}>Linked flashcards</Text>
              {linkedCards.length === 0 ? (
                <View style={styles.emptyCards}>
                  <Text style={styles.emptyCardsText}>No cards linked to this note yet.</Text>
                </View>
              ) : (
                linkedCards.map((card) => (
                  <View key={card.id} style={styles.cardRow}>
                    <Text numberOfLines={1} style={styles.cardFront}>
                      Q: {card.front}
                    </Text>
                    <Text numberOfLines={2} style={styles.cardBack}>
                      A: {card.back}
                    </Text>
                    <Text style={styles.cardMeta}>{formatDueLabel(card.due)}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundTitle}>Note not found</Text>
            <KiwiButton label="Back to My Notes" onPress={() => router.push('/my-notes')} />
          </View>
        )}
      </ScrollView>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subjectRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  subjectName: {
    color: KIWI_THEME.colors.textPrimary,
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
  },
  subtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
  },
  noteContainer: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    gap: 12,
    padding: 18,
  },
  noteTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 24 / 1.5,
  },
  titleInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteBody: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 24,
  },
  bodyInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 200,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: KIWI_THEME.radius.pill,
    borderWidth: 1,
    borderColor: '#F2D3D3',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: KIWI_THEME.colors.danger,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
  },
  linkedSection: {
    gap: 10,
  },
  linkedTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 20 / 1.4,
  },
  emptyCards: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyCardsText: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
  },
  cardRow: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.card,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardFront: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  cardBack: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  cardMeta: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
  },
  notFoundCard: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  notFoundTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
  },
});
