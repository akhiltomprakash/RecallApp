import { db } from './schema';

export type DeckSummary = {
  id: number;
  name: string;
  description: string | null;
  dueCount: number;
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
  front: string;
  back: string;
  card_type: string;
  state: CardStateRow;
};

const now = (): number => Math.floor(Date.now() / 1000);

const getScalar = (result: any, index = 0): number => {
  return result.rows.item(index)[Object.keys(result.rows.item(index))[0]] as number;
};

export function createDeck(name: string, description: string = ''): number {
  const result: any = db.executeSql(
    'INSERT INTO decks (name, description) VALUES (?, ?);',
    [name, description || null]
  );

  return result.insertId as number;
}

export function getDecks(): DeckSummary[] {
  const result: any = db.executeSql(
    `SELECT decks.id, decks.name, decks.description, COUNT(card_state.card_id) AS dueCount
     FROM decks
     LEFT JOIN cards ON decks.id = cards.deck_id
     LEFT JOIN card_state ON cards.id = card_state.card_id AND card_state.due <= ?
     GROUP BY decks.id;`,
    [now()]
  );

  const rows: DeckSummary[] = [];

  for (let i = 0; i < result.rows.length; i += 1) {
    const item = result.rows.item(i);
    rows.push({
      id: item.id,
      name: item.name,
      description: item.description,
      dueCount: item.dueCount,
    });
  }

  return rows;
}

export function addCard(
  deckId: number,
  front: string,
  back: string,
  cardType: string = 'basic'
): number {
  const insertCard: any = db.executeSql(
    'INSERT INTO cards (deck_id, front, back, card_type) VALUES (?, ?, ?, ?);',
    [deckId, front, back, cardType]
  );

  const cardId = insertCard.insertId as number;

  db.executeSql(
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

  return cardId;
}

export function getDueCards(deckId: number): DueCardRow[] {
  const result: any = db.executeSql(
    `SELECT
       cards.id,
       cards.deck_id,
       cards.front,
       cards.back,
       cards.card_type,
       card_state.card_id AS state_card_id,
       card_state.due,
       card_state.stability,
       card_state.difficulty,
       card_state.elapsed_days,
       card_state.scheduled_days,
       card_state.reps,
       card_state.lapses,
       card_state.state,
       card_state.last_review
     FROM cards
     JOIN card_state ON cards.id = card_state.card_id
     WHERE cards.deck_id = ? AND card_state.due <= ?;`,
    [deckId, now()]
  );

  const rows: DueCardRow[] = [];

  for (let i = 0; i < result.rows.length; i += 1) {
    const item = result.rows.item(i);
    rows.push({
      id: item.id,
      deck_id: item.deck_id,
      front: item.front,
      back: item.back,
      card_type: item.card_type,
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
    });
  }

  return rows;
}

export function updateCardState(cardId: number, newState: Partial<CardStateRow>, rating: number): void {
  const selectResult: any = db.executeSql(
    'SELECT * FROM card_state WHERE card_id = ?;',
    [cardId]
  );

  if (selectResult.rows.length === 0) {
    throw new Error(`Card state not found for cardId ${cardId}`);
  }

  const oldState = selectResult.rows.item(0) as CardStateRow;
  const updatedState = { ...oldState, ...newState } as CardStateRow;
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
  ) as Array<[keyof CardStateRow, any]>;

  if (entries.length > 0) {
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);
    db.executeSql(`UPDATE card_state SET ${setClause} WHERE card_id = ?;`, [
      ...values,
      cardId,
    ]);
  }

  db.executeSql(
    `INSERT INTO review_logs (card_id, rating, state_before, state_after)
     VALUES (?, ?, ?, ?);`,
    [cardId, rating, stateBefore, stateAfter]
  );
}

export function getDeckStats(deckId: number): {
  total: number;
  learned: number;
  dueToday: number;
  retentionRate: number;
} {
  const totalResult: any = db.executeSql(
    'SELECT COUNT(*) AS total FROM cards WHERE deck_id = ?;',
    [deckId]
  );
  const learnedResult: any = db.executeSql(
    `SELECT COUNT(*) AS learned
     FROM cards
     JOIN card_state ON cards.id = card_state.card_id
     WHERE cards.deck_id = ? AND card_state.state >= 2;`,
    [deckId]
  );
  const dueResult: any = db.executeSql(
    `SELECT COUNT(*) AS dueToday
     FROM cards
     JOIN card_state ON cards.id = card_state.card_id
     WHERE cards.deck_id = ? AND card_state.due <= ?;`,
    [deckId, now()]
  );
  const retentionResult: any = db.executeSql(
    `SELECT
       SUM(CASE WHEN review_logs.rating >= 3 THEN 1 ELSE 0 END) AS goodCount,
       COUNT(*) AS totalCount
     FROM review_logs
     JOIN cards ON review_logs.card_id = cards.id
     WHERE cards.deck_id = ?;`,
    [deckId]
  );

  const total = totalResult.rows.length ? totalResult.rows.item(0).total : 0;
  const learned = learnedResult.rows.length ? learnedResult.rows.item(0).learned : 0;
  const dueToday = dueResult.rows.length ? dueResult.rows.item(0).dueToday : 0;
  const goodCount = retentionResult.rows.length ? retentionResult.rows.item(0).goodCount || 0 : 0;
  const totalCount = retentionResult.rows.length ? retentionResult.rows.item(0).totalCount || 0 : 0;
  const retentionRate = totalCount > 0 ? goodCount / totalCount : 0;

  return {
    total,
    learned,
    dueToday,
    retentionRate,
  };
}
