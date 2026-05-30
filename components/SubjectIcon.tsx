import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  Atom,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Code,
  Dumbbell,
  Film,
  Globe,
  HeartPulse,
  Landmark,
  Languages,
  Microscope,
  Music4,
  NotebookPen,
  Palette,
  Plug,
  Rocket,
  Scale,
  Sprout,
} from 'lucide-react-native';
import {
  DEFAULT_SUBJECT_ICON_OPTION,
  SubjectIconKey,
  SUBJECT_ICON_OPTIONS,
} from '../constants/theme';

type SubjectIconProps = {
  iconKey?: string | null;
  size?: number;
};

const iconMap: Record<SubjectIconKey, LucideIcon> = {
  'book-open': BookOpen,
  sprout: Sprout,
  plug: Plug,
  landmark: Landmark,
  code: Code,
  microscope: Microscope,
  calculator: Calculator,
  atom: Atom,
  globe: Globe,
  languages: Languages,
  briefcase: Briefcase,
  scale: Scale,
  'heart-pulse': HeartPulse,
  'music-4': Music4,
  palette: Palette,
  film: Film,
  dumbbell: Dumbbell,
  brain: Brain,
  rocket: Rocket,
  'notebook-pen': NotebookPen,
};

const iconOptionMap = new Map(SUBJECT_ICON_OPTIONS.map((option) => [option.iconKey, option]));

export default function SubjectIcon({ iconKey, size = 42 }: SubjectIconProps) {
  const option = iconOptionMap.get((iconKey ?? '') as SubjectIconKey) ?? DEFAULT_SUBJECT_ICON_OPTION;
  const Icon = iconMap[option.iconKey] ?? BookOpen;

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: option.backgroundColor,
          width: size,
          height: size,
          borderRadius: Math.min(12, Math.floor(size / 3)),
        },
      ]}
    >
      <Icon color={option.iconColor} size={Math.floor(size * 0.48)} strokeWidth={2.1} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

