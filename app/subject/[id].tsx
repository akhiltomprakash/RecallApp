import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { Search } from 'lucide-react-native';
import KiwiBottomNav from '../../components/KiwiBottomNav';
import KiwiButton from '../../components/KiwiButton';
import KiwiScreen from '../../components/KiwiScreen';
import KiwiTopBar from '../../components/KiwiTopBar';
import { KIWI_THEME } from '../../constants/theme';
import {
  getNotesForSubject,
  getSubjectById,
  type NoteRow,
  type SubjectDetails,
} from '../../db/queries';

const parseSubjectId = (rawId: string | string[] | undefined): number | null => {
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

export default function SubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const subjectId = parseSubjectId(params.id);

  const [subject, setSubject] = useState<SubjectDetails | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback((refresh = false) => {
    if (!subjectId) {
      setSubject(null);
      setNotes([]);
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
      const nextSubject = getSubjectById(subjectId);
      setSubject(nextSubject);
      setNotes(nextSubject ? getNotesForSubject(subjectId, searchQuery) : []);
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [searchQuery, subjectId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const subtitle = useMemo(() => {
    if (!subject) {
      return 'Subject not found';
    }
    return `${subject.noteCount} notes · ${subject.dueCount} due`;
  }, [subject]);

  const hasNoResults = searchQuery.trim().length > 0 && notes.length === 0;

  return (
    <KiwiScreen>
      <KiwiTopBar
        onBackPress={() => router.back()}
        onSettingsPress={() => router.push('/settings')}
        title={subject?.name ?? 'Subject'}
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
        <Text style={styles.subtitle}>{subtitle}</Text>

        {subject ? (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Search"
                placeholderTextColor={KIWI_THEME.colors.textSecondary}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              <Search color={KIWI_THEME.colors.textPrimary} size={20} strokeWidth={2.1} />
            </View>

            {notes.length === 0 && !isLoading ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>
                  {hasNoResults ? 'No matching notes' : 'No notes yet'}
                </Text>
                <Text style={styles.emptyStateBody}>
                  {hasNoResults
                    ? 'Try a different search term.'
                    : 'Tap Add notes to create your first note in this subject.'}
                </Text>
              </View>
            ) : (
              notes.map((note) => {
                const dateLabel = formatNoteLabel(note.updated_at || note.created_at);
                return (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    key={note.id}
                    onPress={() => router.push(`/note/${note.id}`)}
                    style={styles.noteCard}
                  >
                    <View style={styles.noteTitleRow}>
                      <Text numberOfLines={1} style={styles.noteTitle}>
                        {note.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.noteDateLabel}>
                        {dateLabel}
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={styles.noteBody}>
                      {note.body}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundTitle}>Subject missing</Text>
            <KiwiButton
              label="Back to My Notes"
              onPress={() => router.push('/my-notes')}
              style={styles.notFoundButton}
            />
          </View>
        )}
      </ScrollView>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <KiwiButton
          fullWidth={false}
          label="Add notes"
          onPress={() => {
            if (!subjectId) {
              router.push('/add-cards');
              return;
            }

            router.push({
              pathname: '/add-cards',
              params: {
                subjectId: String(subjectId),
                subjectName: subject?.name ?? '',
              },
            });
          }}
          style={styles.fab}
        />
      </View>

      <KiwiBottomNav
        activeTab="my-notes"
        onTabPress={(tab) => {
          if (tab === 'revise') {
            router.push('/');
            return;
          }
          router.push('/my-notes');
        }}
      />
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
    fontSize: 16,
    letterSpacing: 0,
  },
  searchContainer: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.pill,
    flexDirection: 'row',
    gap: KIWI_THEME.spacing.sm,
    minHeight: 56,
    paddingHorizontal: KIWI_THEME.spacing.lg,
  },
  searchInput: {
    color: KIWI_THEME.colors.textPrimary,
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 18 / 1.125,
    letterSpacing: 0,
    paddingVertical: 0,
  },
  noteCard: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noteTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    flex: 1,
    fontSize: 25 / 1.56,
    letterSpacing: 0,
  },
  noteDateLabel: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    letterSpacing: 0,
    marginLeft: KIWI_THEME.spacing.md,
  },
  noteBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 21,
    marginTop: 6,
  },
  emptyStateCard: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyStateTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20 / 1.25,
    letterSpacing: 0,
  },
  emptyStateBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 6,
    textAlign: 'center',
  },
  notFoundCard: {
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  notFoundTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    letterSpacing: 0,
  },
  notFoundButton: {
    marginTop: 14,
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
});
