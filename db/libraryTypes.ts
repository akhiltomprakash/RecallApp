import type { SubjectColorKey, SubjectIconKey } from '../constants/theme';

export type StudyLibraryFlashcard =
  | {
      type?: string;
      front: string;
      back: string;
      difficulty?: string;
      exam_importance?: string;
      tags?: string[];
    }
  | {
      type?: string;
      text: string;
      back_extra?: string;
      difficulty?: string;
      exam_importance?: string;
      tags?: string[];
    };

export type StudyLibraryTopic = {
  topic_title: string;
  topic_note?: string;
  key_terms?: Array<{
    Term: string;
    Definition: string;
  }>;
  timeline_items?: Array<{
    date_or_period: string;
    event_or_detail: string;
  }>;
  flashcards?: StudyLibraryFlashcard[];
};

export type StudyLibrarySource = {
  class: string;
  board: string;
  subject: string;
  chapter_number?: number;
  chapter_title?: string;
  source_scope?: string;
  chapter_summary?: string;
  topics?: StudyLibraryTopic[];
};

export type StudyLibraryDefinition = {
  id: string;
  subjectName: string;
  displayName: string;
  description: string;
  iconKey: SubjectIconKey;
  colorKey: SubjectColorKey;
  legacySubjectNames?: string[];
  source: StudyLibrarySource;
  topicCount: number;
  flashcardCount: number;
};
