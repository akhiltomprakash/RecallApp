import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const db: SQLiteDatabase = openDatabaseSync('recall.db');

const DEFAULT_GENERAL_ICON_KEY = 'book-open';
const DEFAULT_GENERAL_COLOR_KEY = 'slate';
const QUANTUM_DEMO_NOTE_TITLE = 'Quantum Computing Basics';

const quantumDemoNoteBody =
  'Quantum computing is a model of computation that uses qubits instead of classical bits. A classical bit is either 0 or 1, but a qubit can exist in a superposition of states, allowing quantum systems to represent richer state spaces during computation. Quantum algorithms also rely on interference, where probability amplitudes can reinforce useful outcomes and cancel unhelpful ones. Another key resource is entanglement, a non-classical correlation between qubits that enables coordinated behavior across a register. Together, these properties can provide major speedups for specific tasks such as integer factorization, quantum simulation, and certain search problems. In practice, current quantum hardware is noisy and prone to decoherence, so error mitigation and quantum error correction are critical research areas. Most near-term applications focus on hybrid workflows that combine classical optimization with parameterized quantum circuits, while long-term progress depends on scaling qubit counts, improving gate fidelity, and achieving fault-tolerant architectures.';

const quantumDemoCards: Array<{ front: string; back: string; cardType: string }> = [
  {
    front: 'What is a qubit in quantum computing?',
    back: 'A quantum information unit that can exist as 0, 1, or a superposition of both.',
    cardType: 'basic',
  },
  {
    front: 'Why is superposition useful in quantum algorithms?',
    back: 'It enables representing and processing many possible states before measurement.',
    cardType: 'basic',
  },
  {
    front: 'What role does entanglement play?',
    back: 'It creates strong correlations between qubits that can be leveraged for computation.',
    cardType: 'basic',
  },
  {
    front: 'What is decoherence?',
    back: 'Loss of quantum state information due to interaction with the environment.',
    cardType: 'basic',
  },
  {
    front: 'True or False: Classical bits can be in superposition.',
    back: 'False. Superposition is a quantum property of qubits.',
    cardType: 'true_false',
  },
  {
    front: 'Fill in the blank: ______ helps amplify correct outcomes in many quantum algorithms.',
    back: 'Interference',
    cardType: 'cloze',
  },
  {
    front: 'What does NISQ stand for?',
    back: 'Noisy Intermediate-Scale Quantum.',
    cardType: 'basic',
  },
  {
    front: 'Which algorithm is famous for threatening RSA by factoring integers efficiently?',
    back: "Shor's algorithm.",
    cardType: 'basic',
  },
  {
    front: 'Concept check: Why is quantum error correction needed even with good hardware?',
    back: 'Because quantum states are fragile and still accumulate errors from noise and decoherence.',
    cardType: 'concept',
  },
  {
    front: 'True or False: Entanglement is just a stronger version of classical correlation.',
    back: 'False. Entanglement includes non-classical correlations not reproducible by classical systems.',
    cardType: 'true_false',
  },
  {
    front: 'Fill in the blank: A ______-tolerant quantum computer can run long algorithms reliably.',
    back: 'fault',
    cardType: 'cloze',
  },
  {
    front: 'What is the practical role of hybrid quantum-classical workflows today?',
    back: 'They offload parts of optimization or simulation to quantum circuits while classical systems handle control and iteration.',
    cardType: 'concept',
  },
];

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

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function ensureGeneralQuantumDemoNote(): void {
  const generalDeck = db.getFirstSync<{ id: number }>(
    'SELECT id FROM decks WHERE lower(name) = lower(?) LIMIT 1;',
    ['General']
  );

  if (!generalDeck) {
    return;
  }

  const existingNote = db.getFirstSync<{ id: number }>(
    'SELECT id FROM notes WHERE deck_id = ? AND title = ? LIMIT 1;',
    [generalDeck.id, QUANTUM_DEMO_NOTE_TITLE]
  );

  const timestamp = now();
  db.withTransactionSync(() => {
    let noteId = existingNote?.id ?? 0;

    if (existingNote) {
      db.runSync(
        `UPDATE notes
         SET body = ?, updated_at = ?
         WHERE id = ?;`,
        [quantumDemoNoteBody, timestamp, existingNote.id]
      );
      db.runSync('DELETE FROM cards WHERE note_id = ?;', [existingNote.id]);
    } else {
      const noteInsert = db.runSync(
        `INSERT INTO notes (deck_id, title, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?);`,
        [generalDeck.id, QUANTUM_DEMO_NOTE_TITLE, quantumDemoNoteBody, timestamp, timestamp]
      );
      noteId = noteInsert.lastInsertRowId;
    }

    for (const card of quantumDemoCards) {
      const cardInsert = db.runSync(
        `INSERT INTO cards (deck_id, note_id, front, back, card_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [generalDeck.id, noteId, card.front, card.back, card.cardType, timestamp]
      );

      db.runSync(
        `INSERT INTO card_state (
           card_id,
           due,
           stability,
           difficulty,
           elapsed_days,
           scheduled_days,
           reps,
           lapses,
           state,
           last_review
         ) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, NULL);`,
        [cardInsert.lastInsertRowId, timestamp]
      );
    }
  });
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

    db.execSync(
      `CREATE TABLE IF NOT EXISTS llm_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        model TEXT,
        operation TEXT NOT NULL,
        status TEXT NOT NULL,
        input_chars INTEGER NOT NULL DEFAULT 0,
        output_chars INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
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
    db.execSync('CREATE INDEX IF NOT EXISTS idx_llm_logs_created_at ON llm_logs(created_at);');
  });

  ensureGeneralSubjectIfEmpty();
  ensureGeneralQuantumDemoNote();

  return db;
}
