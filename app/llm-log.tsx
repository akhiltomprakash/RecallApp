import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import { KIWI_THEME } from '../constants/theme';
import { clearLlmLogs, getLlmLogs, type LlmLogRow } from '../db/queries';

const formatTimestamp = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleString();
};

export default function LlmLogScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<LlmLogRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = useCallback((refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    }

    try {
      setLogs(getLlmLogs(200));
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  return (
    <KiwiScreen>
      <KiwiTopBar title="LLM log" onBackPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadLogs(true)}
            refreshing={isRefreshing}
            tintColor={KIWI_THEME.colors.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>{logs.length} entries</Text>
          <KiwiButton
            fullWidth={false}
            label="Clear log"
            onPress={() => {
              Alert.alert('Clear LLM logs?', 'This will remove all saved LLM call logs on this device.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    clearLlmLogs();
                    loadLogs();
                  },
                },
              ]);
            }}
            style={styles.clearButton}
            variant="secondary"
          />
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No LLM calls yet</Text>
            <Text style={styles.emptyBody}>Create a note with AI enabled to generate your first log entry.</Text>
          </View>
        ) : (
          logs.map((entry) => (
            <View key={entry.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={[styles.status, entry.status === 'success' ? styles.success : styles.error]}>
                  {entry.status.toUpperCase()}
                </Text>
                <Text style={styles.time}>{formatTimestamp(entry.created_at)}</Text>
              </View>

              <Text style={styles.meta}>provider: {entry.provider}</Text>
              <Text style={styles.meta}>operation: {entry.operation}</Text>
              <Text style={styles.meta}>model: {entry.model ?? 'n/a'}</Text>
              <Text style={styles.meta}>input chars: {entry.input_chars} • output chars: {entry.output_chars}</Text>

              {entry.error_message ? <Text style={styles.errorMessage}>{entry.error_message}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
  },
  clearButton: {
    minHeight: 40,
    paddingHorizontal: 14,
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
    fontSize: 18,
  },
  emptyBody: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  logCard: {
    ...KIWI_THEME.shadows.card,
    backgroundColor: KIWI_THEME.colors.surface,
    borderRadius: KIWI_THEME.radius.card,
    padding: 14,
  },
  logHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  status: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  success: {
    color: '#0F766E',
  },
  error: {
    color: KIWI_THEME.colors.danger,
  },
  time: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
  },
  meta: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  errorMessage: {
    color: KIWI_THEME.colors.danger,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 8,
  },
});
