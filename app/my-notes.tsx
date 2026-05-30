import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import KiwiBottomNav from '../components/KiwiBottomNav';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import SubjectCard from '../components/SubjectCard';
import { KIWI_THEME } from '../constants/theme';
import { getSubjects, type SubjectSummary } from '../db/queries';

export default function MyNotesScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  const totalNotes = useMemo(
    () => subjects.reduce((sum, subject) => sum + subject.noteCount, 0),
    [subjects]
  );

  return (
    <KiwiScreen>
      <KiwiTopBar title="My Notes" onSettingsPress={() => router.push('/settings')} />

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
});

