import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const db: SQLiteDatabase = openDatabaseSync('recall.db');

const DEFAULT_GENERAL_ICON_KEY = 'book-open';
const DEFAULT_GENERAL_COLOR_KEY = 'slate';

function hasColumn(tableName: string, columnName: string): boolean {
  const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tableName});`);
  return columns.some((column) => column.name === columnName);
}

function ensureGeneralSubjectIfEmpty(): void {
  const deckCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM decks;'
  )?.count;

  if ((deckCount ?? 0) > 0) {
    return;
  }

  db.runSync(
    `INSERT INTO decks (name, description, icon_key, color_key)
     VALUES (?, ?, ?, ?);`,
    ['General', 'Catch-all notes', DEFAULT_GENERAL_ICON_KEY, DEFAULT_GENERAL_COLOR_KEY]
  );
}

export function initializeDatabase(): SQLiteDatabase {
  db.execSync('PRAGMA foreign_keys = ON;');

  db.withTransactionSync(() => {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon_key TEXT,
        color_key TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );`
    );

    db.execSync(
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
      );`
    );

    db.execSync(
      `CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        note_id INTEGER,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        card_type TEXT NOT NULL DEFAULT 'basic',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
      );`
    );

    db.execSync(
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

    db.execSync(
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

    if (!hasColumn('cards', 'note_id')) {
      db.execSync('ALTER TABLE cards ADD COLUMN note_id INTEGER;');
    }
    if (!hasColumn('decks', 'icon_key')) {
      db.execSync('ALTER TABLE decks ADD COLUMN icon_key TEXT;');
    }
    if (!hasColumn('decks', 'color_key')) {
      db.execSync('ALTER TABLE decks ADD COLUMN color_key TEXT;');
    }
    db.runSync(
      `UPDATE decks
       SET icon_key = COALESCE(icon_key, ?),
           color_key = COALESCE(color_key, ?)
       WHERE icon_key IS NULL OR color_key IS NULL;`,
      [DEFAULT_GENERAL_ICON_KEY, DEFAULT_GENERAL_COLOR_KEY]
    );

    db.execSync('CREATE INDEX IF NOT EXISTS idx_notes_deck_id ON notes(deck_id);');
    db.execSync('CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);');
    db.execSync('CREATE INDEX IF NOT EXISTS idx_cards_note_id ON cards(note_id);');
    db.execSync('CREATE INDEX IF NOT EXISTS idx_card_state_due ON card_state(due);');
    db.execSync('CREATE INDEX IF NOT EXISTS idx_review_logs_card_id ON review_logs(card_id);');
    db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(reviewed_at);'
    );
  });

  ensureGeneralSubjectIfEmpty();

  return db;
}
