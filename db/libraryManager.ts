import { db } from './schema';
import { deleteSubject, getSubjectByNames } from './queries';
import type { StudyLibraryDefinition, StudyLibraryFlashcard, StudyLibraryTopic } from './libraryTypes';

const normalizeText = (value: string): string => value.trim();
const now = (): number => Math.floor(Date.now() / 1000);

function getLibrarySubjectNames(library: StudyLibraryDefinition): string[] {
  return [library.subjectName, ...(library.legacySubjectNames ?? [])].map(normalizeText).filter(Boolean);
}

function formatLibraryList(title: string, items: string[]): string {
  const cleanedItems = items.map(normalizeText).filter(Boolean);
  if (cleanedItems.length === 0) {
    return '';
  }

  return `${title}:\n${cleanedItems.map((item) => `- ${item}`).join('\n')}`;
}

function buildLibraryNoteBody(topic: StudyLibraryTopic): string {
  return [
    normalizeText(topic.topic_note ?? ''),
    formatLibraryList(
      'Key terms',
      (topic.key_terms ?? []).map(({ Term, Definition }) => `${Term}: ${Definition}`)
    ),
    formatLibraryList(
      'Timeline',
      (topic.timeline_items ?? []).map(
        ({ date_or_period, event_or_detail }) => `${date_or_period} - ${event_or_detail}`
      )
    ),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function normalizeLibraryFlashcard(
  flashcard: StudyLibraryFlashcard,
  topic: StudyLibraryTopic
): { front: string; back: string; cardType: string } | null {
  const cardType = normalizeText(flashcard.type ?? 'basic') || 'basic';

  if ('front' in flashcard && 'back' in flashcard) {
    const front = normalizeText(flashcard.front ?? '');
    const back = normalizeText(flashcard.back ?? '');
    if (!front || !back) {
      return null;
    }

    return { front, back, cardType };
  }

  if ('text' in flashcard) {
    const front = normalizeText(flashcard.text ?? '');
    const back = normalizeText(flashcard.back_extra ?? topic.topic_note ?? '');
    if (!front || !back) {
      return null;
    }

    return { front, back, cardType };
  }

  return null;
}

export function isLibraryLoaded(library: StudyLibraryDefinition): boolean {
  return Boolean(getSubjectByNames(getLibrarySubjectNames(library)));
}

export function removeLibrary(library: StudyLibraryDefinition): void {
  const existingSubject = getSubjectByNames(getLibrarySubjectNames(library));
  if (existingSubject) {
    deleteSubject(existingSubject.id);
  }
}

export function loadLibrary(library: StudyLibraryDefinition): {
  subjectId: number;
  noteCount: number;
  cardCount: number;
} {
  const existingSubject = getSubjectByNames(getLibrarySubjectNames(library));
  let subjectId = 0;
  let noteCount = 0;
  let cardCount = 0;
  const timestamp = now();

  db.withTransactionSync(() => {
    if (existingSubject) {
      db.runSync('DELETE FROM decks WHERE id = ?;', [existingSubject.id]);
    }

    const subjectInsert = db.runSync(
      `INSERT INTO decks (name, description, icon_key, color_key)
       VALUES (?, ?, ?, ?);`,
      [library.subjectName, library.description, library.iconKey, library.colorKey]
    );
    subjectId = subjectInsert.lastInsertRowId;

    for (const topic of library.source.topics ?? []) {
      const noteBody = buildLibraryNoteBody(topic);
      const noteInsert = db.runSync(
        `INSERT INTO notes (deck_id, title, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?);`,
        [subjectId, normalizeText(topic.topic_title), noteBody, timestamp, timestamp]
      );
      const noteId = noteInsert.lastInsertRowId;
      noteCount += 1;

      for (const flashcard of topic.flashcards ?? []) {
        const normalizedCard = normalizeLibraryFlashcard(flashcard, topic);
        if (!normalizedCard) {
          continue;
        }

        const cardInsert = db.runSync(
          `INSERT INTO cards (deck_id, note_id, front, back, card_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            subjectId,
            noteId,
            normalizedCard.front,
            normalizedCard.back,
            normalizedCard.cardType,
            timestamp,
          ]
        );
        cardCount += 1;

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
    }
  });

  return { subjectId, noteCount, cardCount };
}
