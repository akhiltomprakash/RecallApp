import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const librariesDir = path.join(projectRoot, 'JSON libraries');
const outputFile = path.join(projectRoot, 'db', 'libraryCatalog.ts');

const iconMap = new Map([
  ['history', ['landmark', 'amber']],
  ['harappan', ['landmark', 'amber']],
  ['biology', ['microscope', 'teal']],
  ['microbe', ['microscope', 'teal']],
  ['science', ['microscope', 'teal']],
  ['math', ['calculator', 'blue']],
  ['chemistry', ['atom', 'cyan']],
  ['geography', ['globe', 'sky']],
  ['language', ['languages', 'violet']],
  ['business', ['briefcase', 'stone']],
  ['law', ['scale', 'zinc']],
  ['medicine', ['heart-pulse', 'red']],
  ['music', ['music-4', 'pink']],
  ['art', ['palette', 'fuchsia']],
  ['film', ['film', 'purple']],
  ['fitness', ['dumbbell', 'orange']],
  ['memory', ['brain', 'lime']],
  ['project', ['rocket', 'cyan-dark']],
  ['note', ['notebook-pen', 'blue-dark']],
]);

function toPascalCase(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toLibraryId(fileName) {
  return fileName
    .replace(/\.json$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function selectIcon(source) {
  const subject = String(source.subject ?? '').toLowerCase();
  const chapter = String(source.chapter_title ?? '').toLowerCase();
  const haystack = `${subject} ${chapter}`;

  for (const [needle, icon] of iconMap.entries()) {
    if (haystack.includes(needle)) {
      return icon;
    }
  }

  return ['notebook-pen', 'blue-dark'];
}

function countFlashcards(source) {
  return (source.topics ?? []).reduce(
    (sum, topic) => sum + (Array.isArray(topic.flashcards) ? topic.flashcards.length : 0),
    0
  );
}

function subjectNameFor(source) {
  const base = `${source.class} ${source.subject}`.trim();
  const chapter = String(source.chapter_title ?? '').trim();
  return chapter ? `${base} - ${chapter}` : base;
}

function legacySubjectNamesFor(source) {
  const base = `${source.class} ${source.subject}`.trim();
  return base ? [base] : [];
}

const jsonFiles = fs
  .readdirSync(librariesDir)
  .filter((file) => file.toLowerCase().endsWith('.json'))
  .sort((a, b) => a.localeCompare(b));

const libraryEntries = jsonFiles.map((fileName) => {
  const jsonPath = path.join(librariesDir, fileName);
  const source = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const [iconKey, colorKey] = selectIcon(source);

  return {
    fileName,
    importName: `library${toPascalCase(fileName)}`,
    id: toLibraryId(fileName),
    subjectName: subjectNameFor(source),
    legacySubjectNames: legacySubjectNamesFor(source),
    description:
      source.chapter_summary?.trim() ||
      `${source.board} ${source.subject}${source.chapter_title ? ` · ${source.chapter_title}` : ''}`,
    iconKey,
    colorKey,
    topicCount: Array.isArray(source.topics) ? source.topics.length : 0,
    flashcardCount: countFlashcards(source),
  };
});

const imports = libraryEntries
  .map(
    (entry) =>
      `import ${entry.importName} from '../JSON libraries/${entry.fileName.replace(/'/g, "\\'")}';`
  )
  .join('\n');

const definitions = libraryEntries
  .map(
    (entry) => `  createLibraryDefinition(
    '${entry.id}',
    ${entry.importName},
    '${entry.subjectName.replace(/'/g, "\\'")}',
    '${entry.iconKey}',
    '${entry.colorKey}',
    ${JSON.stringify(entry.legacySubjectNames ?? [])}
  ),`
  )
  .join('\n');

const output = `import type { StudyLibraryDefinition, StudyLibrarySource } from './libraryTypes';
${imports}

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
${definitions}
];

export function getLibraryBySubjectName(subjectName: string): StudyLibraryDefinition | null {
  const normalized = subjectName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LIBRARIES.find((library) => library.subjectName.toLowerCase() === normalized) ?? null;
}
`;

fs.writeFileSync(outputFile, output);
console.log(`Wrote ${path.relative(projectRoot, outputFile)} with ${libraryEntries.length} libraries.`);
