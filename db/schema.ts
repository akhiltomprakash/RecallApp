import { openDatabaseSync } from 'expo-sqlite';

export const db: any = openDatabaseSync('recall.db');

export function initializeDatabase(): any {
  db.transaction((tx: any) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );`
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        card_type TEXT NOT NULL DEFAULT 'basic',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
      );`
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS card_state (
        card_id INTEGER PRIMARY KEY,
        due INTEGER NOT NULL,
        stability REAL NOT NULL DEFAULT 0,
        difficulty REAL NOT NULL DEFAULT 0,
        elapsed_days INTEGER NOT NULL DEFAULT 0,
        scheduled_days INTEGER NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL DEFAULT 0,
        lapses INTEGER NOT NULL DEFAULT 0,
        state INTEGER NOT NULL DEFAULT 0,
        last_review INTEGER,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
      );`
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS review_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        reviewed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        state_before TEXT NOT NULL,
        state_after TEXT NOT NULL,
        FOREIGN KEY (card_id) REFERENCES cards(id)
      );`
    );
  });

  return db;
}
