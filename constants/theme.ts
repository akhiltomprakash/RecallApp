export type SubjectIconKey =
  | 'book-open'
  | 'sprout'
  | 'plug'
  | 'landmark'
  | 'code'
  | 'microscope'
  | 'calculator'
  | 'atom'
  | 'globe'
  | 'languages'
  | 'briefcase'
  | 'scale'
  | 'heart-pulse'
  | 'music-4'
  | 'palette'
  | 'film'
  | 'dumbbell'
  | 'brain'
  | 'rocket'
  | 'notebook-pen';

export type SubjectColorKey =
  | 'slate'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'indigo'
  | 'teal'
  | 'blue'
  | 'cyan'
  | 'sky'
  | 'violet'
  | 'stone'
  | 'zinc'
  | 'red'
  | 'pink'
  | 'fuchsia'
  | 'purple'
  | 'orange'
  | 'lime'
  | 'cyan-dark'
  | 'blue-dark';

export type SubjectIconOption = {
  iconKey: SubjectIconKey;
  colorKey: SubjectColorKey;
  label: string;
  iconColor: string;
  backgroundColor: string;
};

export const KIWI_THEME = {
  colors: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    navSurface: '#E8E8E8',
    textPrimary: '#0D0D0D',
    textSecondary: '#7C7C7C',
    borderSoft: '#E7E7E7',
    buttonPrimary: '#0D0D0D',
    buttonPrimaryText: '#FAFAFA',
    buttonSecondary: '#F2F2F2',
    buttonSecondaryText: '#0D0D0D',
    danger: '#DC2626',
  },
  radius: {
    screen: 32,
    card: 16,
    cardLarge: 24,
    pill: 100,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
    },
  },
} as const;

export const DEFAULT_SUBJECT_ICON_OPTION: SubjectIconOption = {
  iconKey: 'book-open',
  colorKey: 'slate',
  label: 'General',
  iconColor: '#334155',
  backgroundColor: '#E2E8F0',
};

export const SUBJECT_ICON_OPTIONS: SubjectIconOption[] = [
  DEFAULT_SUBJECT_ICON_OPTION,
  {
    iconKey: 'sprout',
    colorKey: 'emerald',
    label: 'Biology',
    iconColor: '#15803D',
    backgroundColor: '#DCFCE7',
  },
  {
    iconKey: 'plug',
    colorKey: 'rose',
    label: 'Electronics',
    iconColor: '#BE123C',
    backgroundColor: '#FFE4E6',
  },
  {
    iconKey: 'landmark',
    colorKey: 'amber',
    label: 'History',
    iconColor: '#B45309',
    backgroundColor: '#FEF3C7',
  },
  {
    iconKey: 'code',
    colorKey: 'indigo',
    label: 'Programming',
    iconColor: '#3730A3',
    backgroundColor: '#E0E7FF',
  },
  {
    iconKey: 'microscope',
    colorKey: 'teal',
    label: 'Science',
    iconColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  {
    iconKey: 'calculator',
    colorKey: 'blue',
    label: 'Math',
    iconColor: '#1D4ED8',
    backgroundColor: '#DBEAFE',
  },
  {
    iconKey: 'atom',
    colorKey: 'cyan',
    label: 'Chemistry',
    iconColor: '#0E7490',
    backgroundColor: '#CFFAFE',
  },
  {
    iconKey: 'globe',
    colorKey: 'sky',
    label: 'Geography',
    iconColor: '#0369A1',
    backgroundColor: '#E0F2FE',
  },
  {
    iconKey: 'languages',
    colorKey: 'violet',
    label: 'Languages',
    iconColor: '#6D28D9',
    backgroundColor: '#EDE9FE',
  },
  {
    iconKey: 'briefcase',
    colorKey: 'stone',
    label: 'Business',
    iconColor: '#44403C',
    backgroundColor: '#E7E5E4',
  },
  {
    iconKey: 'scale',
    colorKey: 'zinc',
    label: 'Law',
    iconColor: '#3F3F46',
    backgroundColor: '#E4E4E7',
  },
  {
    iconKey: 'heart-pulse',
    colorKey: 'red',
    label: 'Medicine',
    iconColor: '#B91C1C',
    backgroundColor: '#FEE2E2',
  },
  {
    iconKey: 'music-4',
    colorKey: 'pink',
    label: 'Music',
    iconColor: '#BE185D',
    backgroundColor: '#FCE7F3',
  },
  {
    iconKey: 'palette',
    colorKey: 'fuchsia',
    label: 'Art',
    iconColor: '#A21CAF',
    backgroundColor: '#FAE8FF',
  },
  {
    iconKey: 'film',
    colorKey: 'purple',
    label: 'Cinema',
    iconColor: '#7E22CE',
    backgroundColor: '#F3E8FF',
  },
  {
    iconKey: 'dumbbell',
    colorKey: 'orange',
    label: 'Fitness',
    iconColor: '#C2410C',
    backgroundColor: '#FFEDD5',
  },
  {
    iconKey: 'brain',
    colorKey: 'lime',
    label: 'Memory',
    iconColor: '#4D7C0F',
    backgroundColor: '#ECFCCB',
  },
  {
    iconKey: 'rocket',
    colorKey: 'cyan-dark',
    label: 'Projects',
    iconColor: '#155E75',
    backgroundColor: '#CFFAFE',
  },
  {
    iconKey: 'notebook-pen',
    colorKey: 'blue-dark',
    label: 'Notes',
    iconColor: '#1E3A8A',
    backgroundColor: '#DBEAFE',
  },
];

export const subjectIconOptionMap = new Map<SubjectIconKey, SubjectIconOption>(
  SUBJECT_ICON_OPTIONS.map((option) => [option.iconKey, option])
);

