import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiBottomNav, { type KiwiBottomTab } from '../components/KiwiBottomNav';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import SubjectCard from '../components/SubjectCard';
import { KIWI_THEME } from '../constants/theme';
import {
  getReviewHomeStats,
  getSubjects,
  type ReviewHomeStats,
  type SubjectSummary,
} from '../db/queries';

const emptyStats: ReviewHomeStats = {
  totalDueToday: 0,
  streak: 0,
  subjectCount: 0,
  totalCards: 0,
  totalNotes: 0,
};

export default function HomeScreen() {
  return <HomeTabsScreen initialTab="revise" />;
}

type HomeTabsScreenProps = {
  initialTab?: KiwiBottomTab;
};

export function HomeTabsScreen({ initialTab = 'revise' }: HomeTabsScreenProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [stats, setStats] = useState<ReviewHomeStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<KiwiBottomTab>(initialTab);
  const tabProgress = useRef(new Animated.Value(initialTab === 'my-notes' ? 1 : 0)).current;

  const loadData = useCallback((refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [nextSubjects, nextStats] = [getSubjects(), getReviewHomeStats()];
      setSubjects(nextSubjects);
      setStats(nextStats);
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
      loadData();
    }, [loadData])
  );

  const hasDueCards = stats.totalDueToday > 0;
  const viewportWidth = Math.max(screenWidth, 1);
  const totalNotes = useMemo(
    () => subjects.reduce((sum, subject) => sum + subject.noteCount, 0),
    [subjects]
  );
  const summaryCountText = useMemo(() => {
    return `${stats.totalDueToday}`;
  }, [stats.totalDueToday]);
  const translateX = Animated.multiply(tabProgress, -viewportWidth);

  const switchTab = useCallback(
    (nextTab: KiwiBottomTab) => {
      if (nextTab === activeTab) {
        return;
      }

      setActiveTab(nextTab);
      Animated.timing(tabProgress, {
        toValue: nextTab === 'my-notes' ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    },
    [activeTab, tabProgress]
  );

  return (
    <KiwiScreen>
      <KiwiTopBar
        onSettingsPress={() => router.push('/settings')}
        title={activeTab === 'revise' ? 'Revise' : 'My Notes'}
      />

      <View style={styles.tabViewport}>
        <Animated.View
          style={[
            styles.tabTrack,
            {
              width: viewportWidth * 2,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={[styles.tabPage, { width: viewportWidth }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  onRefresh={() => loadData(true)}
                  refreshing={isRefreshing}
                  tintColor={KIWI_THEME.colors.textPrimary}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCount}>{summaryCountText}</Text>
                <Text style={styles.summaryLabel}>cards due today</Text>
                <KiwiButton
                  disabled={!hasDueCards}
                  fullWidth={false}
                  label="Start Revising"
                  onPress={() => router.push('/review')}
                  style={styles.summaryButton}
                />
                <Text style={styles.streakText}>
                  {stats.streak > 0 ? `${stats.streak} day streak` : 'Build your streak'}
                </Text>
              </View>

              {subjects.length === 0 && !isLoading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No subjects yet</Text>
                  <Text style={styles.emptyDescription}>
                    Create your first subject to start adding notes and flashcards.
                  </Text>
                  <KiwiButton
                    label="Create subject"
                    onPress={() => router.push('/create-subject')}
                    style={styles.emptyButton}
                  />
                </View>
              ) : (
                subjects.map((subject) => {
                  const dueLabel =
                    subject.dueCount === 0 ? 'All caught up' : `${subject.dueCount} due`;

                  return (
                    <SubjectCard
                      iconKey={subject.iconKey}
                      key={subject.id}
                      onPress={() => {
                        if (subject.dueCount > 0) {
                          router.push({
                            pathname: '/review',
                            params: {
                              subjectId: String(subject.id),
                              subjectName: subject.name,
                            },
                          });
                          return;
                        }

                        router.push(`/subject/${subject.id}`);
                      }}
                      subtitle={dueLabel}
                      title={subject.name}
                    />
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={[styles.tabPage, { width: viewportWidth }]}>
            <ScrollView
              contentContainerStyle={styles.notesContent}
              refreshControl={
                <RefreshControl
                  onRefresh={() => loadData(true)}
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
          </View>
        </Animated.View>
      </View>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <KiwiButton
          fullWidth={false}
          label="Add notes"
          onPress={() => router.push('/add-cards')}
          style={styles.fab}
        />
      </View>

      <KiwiBottomNav
        activeTab={activeTab}
        onTabPress={(tab) => {
          switchTab(tab);
        }}
      />
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  tabViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  tabTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  tabPage: {
    flex: 1,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 140,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  notesContent: {
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
  summaryCard: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    minHeight: 236,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  summaryCount: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 50,
    letterSpacing: 0,
    lineHeight: 60,
  },
  summaryLabel: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 31 / 2,
    letterSpacing: 0,
    marginTop: 4,
  },
  summaryButton: {
    marginTop: 22,
    minWidth: 180,
  },
  streakText: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    marginTop: 20,
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
    fontSize: 24 / 1.25,
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
