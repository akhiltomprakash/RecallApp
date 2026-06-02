import { db } from './schema';

export type SubjectRow = {
  id: number;
  name: string;
  description: string | null;
  iconKey: string;
  colorKey: string;
  createdAt: number;
};

export type SubjectSummary = {
  id: number;
  name: string;
  description: string | null;
  iconKey: string;
  colorKey: string;
  noteCount: number;
  cardCount: number;
  dueCount: number;
};

export type SubjectDetails = SubjectRow & {
  noteCount: number;
  cardCount: number;
  dueCount: number;
};

export type NoteRow = {
  id: number;
  deck_id: number;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
};

export type CardStateRow = {
  card_id: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: number | null;
};

export type DueCardRow = {
  id: number;
  deck_id: number;
  deck_name: string;
  note_id: number | null;
  front: string;
  back: string;
  card_type: string;
  created_at: number;
  state: CardStateRow;
};

export type ReviewHomeStats = {
  totalDueToday: number;
  streak: number;
  subjectCount: number;
  totalCards: number;
  totalNotes: number;
};

export type SubjectStats = {
  totalNotes: number;
  totalCards: number;
  learnedCards: number;
  dueToday: number;
  retentionRate: number;
};

export type AppStats = {
  totalNotes: number;
  totalCards: number;
  dueToday: number;
  retentionRate: number;
  reviewsLast7Days: number;
  streak: number;
};

export type NoteDetails = {
  id: number;
  deck_id: number;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
  subjectName: string;
  subjectDescription: string | null;
  subjectIconKey: string;
  subjectColorKey: string;
};

export type NoteLinkedCard = {
  id: number;
  front: string;
  back: string;
  card_type: string;
  due: number;
  state: number;
  scheduled_days: number;
};

export type CardInput = {
  front: string;
  back: string;
  cardType?: string;
};

export type LlmLogRow = {
  id: number;
  provider: string;
  model: string | null;
  operation: string;
  status: string;
  input_chars: number;
  output_chars: number;
  error_message: string | null;
  created_at: number;
};

export type SubjectIconOption = {
  iconKey: string;
  colorKey: string;
  label: string;
  iconColor: string;
  backgroundColor: string;
};

const subjectIconOptions: SubjectIconOption[] = [
  { iconKey: 'book-open', colorKey: 'slate', label: 'General', iconColor: '#334155', backgroundColor: '#E2E8F0' },
  { iconKey: 'sprout', colorKey: 'emerald', label: 'Biology', iconColor: '#15803D', backgroundColor: '#DCFCE7' },
  { iconKey: 'plug', colorKey: 'rose', label: 'Electronics', iconColor: '#BE123C', backgroundColor: '#FFE4E6' },
  { iconKey: 'landmark', colorKey: 'amber', label: 'History', iconColor: '#B45309', backgroundColor: '#FEF3C7' },
  { iconKey: 'code', colorKey: 'indigo', label: 'Programming', iconColor: '#3730A3', backgroundColor: '#E0E7FF' },
  { iconKey: 'microscope', colorKey: 'teal', label: 'Science', iconColor: '#0F766E', backgroundColor: '#CCFBF1' },
  { iconKey: 'calculator', colorKey: 'blue', label: 'Math', iconColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  { iconKey: 'atom', colorKey: 'cyan', label: 'Chemistry', iconColor: '#0E7490', backgroundColor: '#CFFAFE' },
  { iconKey: 'globe', colorKey: 'sky', label: 'Geography', iconColor: '#0369A1', backgroundColor: '#E0F2FE' },
  { iconKey: 'languages', colorKey: 'violet', label: 'Languages', iconColor: '#6D28D9', backgroundColor: '#EDE9FE' },
  { iconKey: 'briefcase', colorKey: 'stone', label: 'Business', iconColor: '#44403C', backgroundColor: '#E7E5E4' },
  { iconKey: 'scale', colorKey: 'zinc', label: 'Law', iconColor: '#3F3F46', backgroundColor: '#E4E4E7' },
  { iconKey: 'heart-pulse', colorKey: 'red', label: 'Medicine', iconColor: '#B91C1C', backgroundColor: '#FEE2E2' },
  { iconKey: 'music-4', colorKey: 'pink', label: 'Music', iconColor: '#BE185D', backgroundColor: '#FCE7F3' },
  { iconKey: 'palette', colorKey: 'fuchsia', label: 'Art', iconColor: '#A21CAF', backgroundColor: '#FAE8FF' },
  { iconKey: 'film', colorKey: 'purple', label: 'Cinema', iconColor: '#7E22CE', backgroundColor: '#F3E8FF' },
  { iconKey: 'dumbbell', colorKey: 'orange', label: 'Fitness', iconColor: '#C2410C', backgroundColor: '#FFEDD5' },
  { iconKey: 'brain', colorKey: 'lime', label: 'Memory', iconColor: '#4D7C0F', backgroundColor: '#ECFCCB' },
  { iconKey: 'rocket', colorKey: 'cyan-dark', label: 'Projects', iconColor: '#155E75', backgroundColor: '#CFFAFE' },
  { iconKey: 'notebook-pen', colorKey: 'blue-dark', label: 'Notes', iconColor: '#1E3A8A', backgroundColor: '#DBEAFE' },
];

const now = (): number => Math.floor(Date.now() / 1000);

const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const escapeLike = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

const normalizeText = (value: string): string => value.trim();

const defaultSubjectIcon = subjectIconOptions[0];

export function getSubjectIconOptions(): SubjectIconOption[] {
  return [...subjectIconOptions];
}

export function getSubjectByName(name: string): SubjectRow | null {
  const subjectName = normalizeText(name);
  if (!subjectName) {
    return null;
  }

  return (
    db.getFirstSync<SubjectRow>(
      `SELECT
         id,
         name,
         description,
         COALESCE(icon_key, ?) AS iconKey,
         COALESCE(color_key, ?) AS colorKey,
         created_at AS createdAt
       FROM decks
       WHERE lower(name) = lower(?)
       LIMIT 1;`,
      [defaultSubjectIcon.iconKey, defaultSubjectIcon.colorKey, subjectName]
    ) ?? null
  );
}

export function getSubjectByNames(names: string[]): SubjectRow | null {
  for (const name of names) {
    const subject = getSubjectByName(name);
    if (subject) {
      return subject;
    }
  }

  return null;
}

export function createSubject(
  name: string,
  description: string = '',
  iconKey: string = defaultSubjectIcon.iconKey,
  colorKey: string = defaultSubjectIcon.colorKey
): number {
  const subjectName = normalizeText(name);

  if (!subjectName) {
    throw new Error('Subject name is required.');
  }

  const normalizedIconKey = normalizeText(iconKey) || defaultSubjectIcon.iconKey;
  const normalizedColorKey = normalizeText(colorKey) || defaultSubjectIcon.colorKey;
  const result = db.runSync(
    `INSERT INTO decks (name, description, icon_key, color_key)
     VALUES (?, ?, ?, ?);`,
    [subjectName, description.trim() || null, normalizedIconKey, normalizedColorKey]
  );

  return result.lastInsertRowId;
}

export function deleteSubject(subjectId: number): void {
  db.runSync('DELETE FROM decks WHERE id = ?;', [subjectId]);
}

export function getSubjects(): SubjectSummary[] {
  return db.getAllSync<SubjectSummary>(
    `SELECT
       d.id,
       d.name,
       d.description,
       COALESCE(d.icon_key, ?) AS iconKey,
       COALESCE(d.color_key, ?) AS colorKey,
       (SELECT COUNT(*) FROM notes n WHERE n.deck_id = d.id) AS noteCount,
       (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id) AS cardCount,
       (
         SELECT COUNT(*)
         FROM cards c
         JOIN card_state cs ON cs.card_id = c.id
         WHERE c.deck_id = d.id AND cs.due <= ?
       ) AS dueCount
     FROM decks d
     ORDER BY lower(d.name), d.id;`,
    [defaultSubjectIcon.iconKey, defaultSubjectIcon.colorKey, now()]
  );
}

export function getSubjectById(subjectId: number): SubjectDetails | null {
  return (
    db.getFirstSync<SubjectDetails>(
      `SELECT
         d.id,
         d.name,
         d.description,
         COALESCE(d.icon_key, ?) AS iconKey,
         COALESCE(d.color_key, ?) AS colorKey,
         d.created_at AS createdAt,
         (SELECT COUNT(*) FROM notes n WHERE n.deck_id = d.id) AS noteCount,
         (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id) AS cardCount,
         (
           SELECT COUNT(*)
           FROM cards c
           JOIN card_state cs ON cs.card_id = c.id
           WHERE c.deck_id = d.id AND cs.due <= ?
         ) AS dueCount
       FROM decks d
       WHERE d.id = ?;`,
      [defaultSubjectIcon.iconKey, defaultSubjectIcon.colorKey, now(), subjectId]
    ) ?? null
  );
}

export function getNotesForSubject(subjectId: number, searchQuery?: string): NoteRow[] {
  const query = normalizeText(searchQuery ?? '');

  if (!query) {
    return db.getAllSync<NoteRow>(
      `SELECT id, deck_id, title, body, created_at, updated_at
       FROM notes
       WHERE deck_id = ?
       ORDER BY updated_at DESC, id DESC;`,
      [subjectId]
    );
  }

  const likeQuery = `%${escapeLike(query)}%`;
  return db.getAllSync<NoteRow>(
    `SELECT id, deck_id, title, body, created_at, updated_at
     FROM notes
     WHERE deck_id = ?
       AND (title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')
     ORDER BY updated_at DESC, id DESC;`,
    [subjectId, likeQuery, likeQuery]
  );
}

export function getNoteById(noteId: number): NoteDetails | null {
  return (
    db.getFirstSync<NoteDetails>(
      `SELECT
         n.id,
         n.deck_id,
         n.title,
         n.body,
         n.created_at,
         n.updated_at,
         d.name AS subjectName,
         d.description AS subjectDescription,
         COALESCE(d.icon_key, ?) AS subjectIconKey,
         COALESCE(d.color_key, ?) AS subjectColorKey
       FROM notes n
       JOIN decks d ON d.id = n.deck_id
       WHERE n.id = ?;`,
      [defaultSubjectIcon.iconKey, defaultSubjectIcon.colorKey, noteId]
    ) ?? null
  );
}

export function getCardsForNote(noteId: number): NoteLinkedCard[] {
  return db.getAllSync<NoteLinkedCard>(
    `SELECT
       c.id,
       c.front,
       c.back,
       c.card_type,
       cs.due,
       cs.state,
       cs.scheduled_days
     FROM cards c
     JOIN card_state cs ON cs.card_id = c.id
     WHERE c.note_id = ?
     ORDER BY cs.due ASC, c.id ASC;`,
    [noteId]
  );
}

export function getDueCardsForNote(noteId: number): number {
  return (
    db.getFirstSync<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM cards c
       JOIN card_state cs ON cs.card_id = c.id
       WHERE c.note_id = ? AND cs.due <= ?;`,
      [noteId, now()]
    )?.total ?? 0
  );
}

export function createNote(subjectId: number, title: string, body: string): number {
  const noteTitle = normalizeText(title);
  const noteBody = normalizeText(body);

  if (!noteTitle || !noteBody) {
    throw new Error('Note title and body are required.');
  }

  const timestamp = now();
  const result = db.runSync(
    `INSERT INTO notes (deck_id, title, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?);`,
    [subjectId, noteTitle, noteBody, timestamp, timestamp]
  );

  return result.lastInsertRowId;
}

export function updateNote(noteId: number, title: string, body: string): boolean {
  const noteTitle = normalizeText(title);
  const noteBody = normalizeText(body);

  if (!noteTitle || !noteBody) {
    throw new Error('Note title and body are required.');
  }

  const result = db.runSync(
    `UPDATE notes
     SET title = ?, body = ?, updated_at = ?
     WHERE id = ?;`,
    [noteTitle, noteBody, now(), noteId]
  );

  return result.changes > 0;
}

export function deleteNote(noteId: number): void {
  db.runSync('DELETE FROM notes WHERE id = ?;', [noteId]);
}

export function addCard(
  subjectId: number,
  front: string,
  back: string,
  noteId: number | null = null,
  cardType: string = 'basic'
): number {
  const normalizedFront = normalizeText(front);
  const normalizedBack = normalizeText(back);

  if (!normalizedFront || !normalizedBack) {
    throw new Error('Card front and back are required.');
  }

  let cardId = 0;

  db.withTransactionSync(() => {
    const cardInsert = db.runSync(
      `INSERT INTO cards (deck_id, note_id, front, back, card_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [subjectId, noteId, normalizedFront, normalizedBack, cardType, now()]
    );
    cardId = cardInsert.lastInsertRowId;

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
      [cardId, now()]
    );
  });

  return cardId;
}

export function addCardsForNote(
  subjectId: number,
  noteId: number,
  cards: CardInput[]
): number[] {
  const createdCardIds: number[] = [];

  db.withTransactionSync(() => {
    for (const card of cards) {
      const front = normalizeText(card.front);
      const back = normalizeText(card.back);

      if (!front || !back) {
        continue;
      }

      const cardInsert = db.runSync(
        `INSERT INTO cards (deck_id, note_id, front, back, card_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [subjectId, noteId, front, back, card.cardType ?? 'basic', now()]
      );
      const cardId = cardInsert.lastInsertRowId;
      createdCardIds.push(cardId);

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
        [cardId, now()]
      );
    }
  });

  return createdCardIds;
}

export function getDueCards(subjectId?: number): DueCardRow[] {
  const rows = db.getAllSync<
    Omit<DueCardRow, 'state'> & {
      state_card_id: number;
      due: number;
      stability: number;
      difficulty: number;
      elapsed_days: number;
      scheduled_days: number;
      reps: number;
      lapses: number;
      state: number;
      last_review: number | null;
    }
  >(
    `SELECT
       c.id,
       c.deck_id,
       d.name AS deck_name,
       c.note_id,
       c.front,
       c.back,
       c.card_type,
       c.created_at,
       cs.card_id AS state_card_id,
       cs.due,
       cs.stability,
       cs.difficulty,
       cs.elapsed_days,
       cs.scheduled_days,
       cs.reps,
       cs.lapses,
       cs.state,
       cs.last_review
     FROM cards c
     JOIN card_state cs ON c.id = cs.card_id
     JOIN decks d ON d.id = c.deck_id
     WHERE cs.due <= ?
       AND (? IS NULL OR c.deck_id = ?)
     ORDER BY cs.due ASC, c.id ASC;`,
    [now(), subjectId ?? null, subjectId ?? null]
  );

  return rows.map((item) => {
    return {
      id: item.id,
      deck_id: item.deck_id,
      deck_name: item.deck_name,
      note_id: item.note_id,
      front: item.front,
      back: item.back,
      card_type: item.card_type,
      created_at: item.created_at,
      state: {
        card_id: item.state_card_id,
        due: item.due,
        stability: item.stability,
        difficulty: item.difficulty,
        elapsed_days: item.elapsed_days,
        scheduled_days: item.scheduled_days,
        reps: item.reps,
        lapses: item.lapses,
        state: item.state,
        last_review: item.last_review,
      },
    };
  });
}

export function updateCardState(cardId: number, newState: Partial<CardStateRow>, rating: number): void {
  const oldState = db.getFirstSync<CardStateRow>(
    'SELECT * FROM card_state WHERE card_id = ?;',
    [cardId]
  );

  if (!oldState) {
    throw new Error(`Card state not found for cardId ${cardId}`);
  }

  const updatedState = { ...oldState, ...newState };
  const stateBefore = JSON.stringify(oldState);
  const stateAfter = JSON.stringify(updatedState);

  const allowedKeys: Array<keyof CardStateRow> = [
    'due',
    'stability',
    'difficulty',
    'elapsed_days',
    'scheduled_days',
    'reps',
    'lapses',
    'state',
    'last_review',
  ];

  const entries = Object.entries(newState).filter(([key]) =>
    allowedKeys.includes(key as keyof CardStateRow)
  ) as Array<[keyof CardStateRow, number | null]>;

  db.withTransactionSync(() => {
    if (entries.length > 0) {
      const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
      const values = entries.map(([, value]) => value);
      db.runSync(`UPDATE card_state SET ${setClause} WHERE card_id = ?;`, [...values, cardId]);
    }

    db.runSync(
      `INSERT INTO review_logs (card_id, rating, reviewed_at, state_before, state_after)
       VALUES (?, ?, ?, ?, ?);`,
      [cardId, rating, now(), stateBefore, stateAfter]
    );
  });
}

export function getReviewHomeStats(): ReviewHomeStats {
  const due = db.getFirstSync<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM cards c
     JOIN card_state cs ON cs.card_id = c.id
     WHERE cs.due <= ?;`,
    [now()]
  )?.total ?? 0;

  const subjectCount = db.getFirstSync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM decks;'
  )?.total ?? 0;

  const totalCards = db.getFirstSync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM cards;'
  )?.total ?? 0;

  const totalNotes = db.getFirstSync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM notes;'
  )?.total ?? 0;

  const reviewDates = db.getAllSync<{ reviewDate: string }>(
    `SELECT DISTINCT date(reviewed_at, 'unixepoch', 'localtime') AS reviewDate
     FROM review_logs
     ORDER BY reviewDate DESC;`
  );
  const reviewDateSet = new Set(reviewDates.map((row) => row.reviewDate));

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (reviewDateSet.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    totalDueToday: due,
    streak,
    subjectCount,
    totalCards,
    totalNotes,
  };
}

export function getSubjectStats(subjectId: number): SubjectStats {
  const totals = db.getFirstSync<{ totalNotes: number; totalCards: number }>(
    `SELECT
       (SELECT COUNT(*) FROM notes WHERE deck_id = ?) AS totalNotes,
       (SELECT COUNT(*) FROM cards WHERE deck_id = ?) AS totalCards;`,
    [subjectId, subjectId]
  );

  const learnedCards = db.getFirstSync<{ learnedCards: number }>(
    `SELECT COUNT(*) AS learnedCards
     FROM cards c
     JOIN card_state cs ON cs.card_id = c.id
     WHERE c.deck_id = ? AND cs.state >= 2;`,
    [subjectId]
  )?.learnedCards ?? 0;

  const dueToday = db.getFirstSync<{ dueToday: number }>(
    `SELECT COUNT(*) AS dueToday
     FROM cards c
     JOIN card_state cs ON cs.card_id = c.id
     WHERE c.deck_id = ? AND cs.due <= ?;`,
    [subjectId, now()]
  )?.dueToday ?? 0;

  const retention = db.getFirstSync<{ goodCount: number | null; totalCount: number }>(
    `SELECT
       SUM(CASE WHEN rl.rating >= 3 THEN 1 ELSE 0 END) AS goodCount,
       COUNT(*) AS totalCount
     FROM review_logs rl
     JOIN cards c ON c.id = rl.card_id
     WHERE c.deck_id = ?;`,
    [subjectId]
  );

  const goodCount = retention?.goodCount ?? 0;
  const totalCount = retention?.totalCount ?? 0;

  return {
    totalNotes: totals?.totalNotes ?? 0,
    totalCards: totals?.totalCards ?? 0,
    learnedCards,
    dueToday,
    retentionRate: totalCount > 0 ? goodCount / totalCount : 0,
  };
}

export function getAppStats(): AppStats {
  const homeStats = getReviewHomeStats();

  const retention = db.getFirstSync<{ goodCount: number | null; totalCount: number }>(
    `SELECT
       SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) AS goodCount,
       COUNT(*) AS totalCount
     FROM review_logs;`
  );
  const goodCount = retention?.goodCount ?? 0;
  const totalCount = retention?.totalCount ?? 0;

  const reviewsLast7Days = db.getFirstSync<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM review_logs
     WHERE reviewed_at >= ?;`,
    [now() - 7 * 24 * 60 * 60]
  )?.total ?? 0;

  return {
    totalNotes: homeStats.totalNotes,
    totalCards: homeStats.totalCards,
    dueToday: homeStats.totalDueToday,
    retentionRate: totalCount > 0 ? goodCount / totalCount : 0,
    reviewsLast7Days,
    streak: homeStats.streak,
  };
}

export function clearLocalDemoData(): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM llm_logs;');
    db.runSync('DELETE FROM review_logs;');
    db.runSync('DELETE FROM card_state;');
    db.runSync('DELETE FROM cards;');
    db.runSync('DELETE FROM notes;');
    db.runSync('DELETE FROM decks;');

    db.runSync(
      `INSERT INTO decks (name, description, icon_key, color_key)
       VALUES (?, ?, ?, ?);`,
      ['General', 'Catch-all notes', defaultSubjectIcon.iconKey, defaultSubjectIcon.colorKey]
    );
  });
}

export function addLlmLog(params: {
  provider: string;
  model?: string | null;
  operation: string;
  status: string;
  inputChars?: number;
  outputChars?: number;
  errorMessage?: string | null;
}): void {
  db.runSync(
    `INSERT INTO llm_logs (
       provider,
       model,
       operation,
       status,
       input_chars,
       output_chars,
       error_message,
       created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      params.provider,
      params.model ?? null,
      params.operation,
      params.status,
      Math.max(0, params.inputChars ?? 0),
      Math.max(0, params.outputChars ?? 0),
      params.errorMessage ?? null,
      now(),
    ]
  );
}

export function getLlmLogs(limit: number = 100): LlmLogRow[] {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  return db.getAllSync<LlmLogRow>(
    `SELECT
       id,
       provider,
       model,
       operation,
       status,
       input_chars,
       output_chars,
       error_message,
       created_at
     FROM llm_logs
     ORDER BY created_at DESC, id DESC
     LIMIT ?;`,
    [safeLimit]
  );
}

export function clearLlmLogs(): void {
  db.runSync('DELETE FROM llm_logs;');
}

// Compatibility wrappers for existing code paths still using deck terminology.
export type DeckSummary = {
  id: number;
  name: string;
  description: string | null;
  dueCount: number;
};

export function createDeck(name: string, description: string = ''): number {
  return createSubject(name, description);
}

export function getDecks(): DeckSummary[] {
  return getSubjects().map((subject) => {
    return {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      dueCount: subject.dueCount,
    };
  });
}

export function getDeckStats(deckId: number): {
  total: number;
  learned: number;
  dueToday: number;
  retentionRate: number;
} {
  const stats = getSubjectStats(deckId);
  return {
    total: stats.totalCards,
    learned: stats.learnedCards,
    dueToday: stats.dueToday,
    retentionRate: stats.retentionRate,
  };
}
