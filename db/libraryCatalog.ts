import type { StudyLibraryDefinition, StudyLibrarySource } from './libraryTypes';
import libraryClass12BiologyMicrobesJson from '../JSON libraries/Class12 Biology Microbes.json';
import libraryClass12HistoryIndianCivilisationsJson from '../JSON libraries/Class12 History Indian Civilisations.json';

function countFlashcards(source: StudyLibrarySource): number {
  return (source.topics ?? []).reduce((sum, topic) => sum + (topic.flashcards?.length ?? 0), 0);
}

function createLibraryDefinition(
  id: string,
  source: StudyLibrarySource,
  subjectName: string,
  iconKey: StudyLibraryDefinition['iconKey'],
  colorKey: StudyLibraryDefinition['colorKey'],
  legacySubjectNames: string[] = []
): StudyLibraryDefinition {
  return {
    id,
    subjectName,
    displayName: subjectName,
    description:
      source.chapter_summary?.trim() ||
      (source.board + ' ' + source.subject + (source.chapter_title ? ' · ' + source.chapter_title : '')),
    iconKey,
    colorKey,
    legacySubjectNames,
    source,
    topicCount: source.topics?.length ?? 0,
    flashcardCount: countFlashcards(source),
  };
}

export const LIBRARIES: StudyLibraryDefinition[] = [
  createLibraryDefinition(
    'class12-biology-microbes',
    libraryClass12BiologyMicrobesJson,
    'Class 12 Biology - Microbes in Human Welfare',
    'microscope',
    'teal',
    ["Class 12 Biology"]
  ),
  createLibraryDefinition(
    'class12-history-indian-civilisations',
    libraryClass12HistoryIndianCivilisationsJson,
    'Class 12 History - Bricks, Beads and Bones (The Harappan Civilisation)',
    'landmark',
    'amber',
    ["Class 12 History"]
  ),
];

export function getLibraryBySubjectName(subjectName: string): StudyLibraryDefinition | null {
  const normalized = subjectName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LIBRARIES.find((library) => library.subjectName.toLowerCase() === normalized) ?? null;
}
