import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import { KIWI_THEME } from '../constants/theme';
import { getAppStats, type AppStats } from '../db/queries';

const emptyStats: AppStats = {
  totalNotes: 0,
  totalCards: 0,
  dueToday: 0,
  retentionRate: 0,
  reviewsLast7Days: 0,
  streak: 0,
};

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = React.useState<AppStats>(emptyStats);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadStats = React.useCallback((refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setStats(getAppStats());
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const retentionLabel = `${Math.round(stats.retentionRate * 100)}%`;

  return (
    <KiwiScreen>
      <KiwiTopBar
        title="Stats"
        onBackPress={() => router.back()}
        onSettingsPress={() => router.push('/settings')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadStats(true)}
            refreshing={isRefreshing}
            tintColor={KIWI_THEME.colors.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <StatCard label="Total notes" value={String(stats.totalNotes)} />
          <StatCard label="Total cards" value={String(stats.totalCards)} />
          <StatCard label="Due today" value={String(stats.dueToday)} />
          <StatCard label="Retention rate" value={retentionLabel} />
          <StatCard label="Reviews (7 days)" value={String(stats.reviewsLast7Days)} />
          <StatCard
            label="Streak"
            value={stats.streak > 0 ? `${stats.streak} days` : '0 days'}
          />
        </View>

        {!isLoading && stats.totalCards === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No review stats yet</Text>
            <Text style={styles.emptyBody}>
              Add notes and complete a few reviews to see richer trends here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KiwiScreen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.card,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 14,
    width: '48%',
  },
  value: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 28 / 1.2,
  },
  label: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    marginTop: 6,
  },
  emptyCard: {
    ...KIWI_THEME.shadows.card,
    alignItems: 'center',
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.cardLarge,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20 / 1.25,
  },
  emptyBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
