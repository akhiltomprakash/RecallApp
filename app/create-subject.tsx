import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import KiwiButton from '../components/KiwiButton';
import KiwiScreen from '../components/KiwiScreen';
import KiwiTopBar from '../components/KiwiTopBar';
import SubjectIconPicker from '../components/SubjectIconPicker';
import { KIWI_THEME } from '../constants/theme';
import { createSubject, getSubjectIconOptions, type SubjectIconOption } from '../db/queries';

export default function CreateSubjectScreen() {
  const router = useRouter();
  const iconOptions = useMemo(() => getSubjectIconOptions(), []);
  const defaultOption = iconOptions[0];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOption, setSelectedOption] = useState<SubjectIconOption>(defaultOption);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && !isSaving;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const createdSubjectId = createSubject(
        name.trim(),
        description.trim(),
        selectedOption.iconKey,
        selectedOption.colorKey
      );

      try {
        router.replace(`/subject/${createdSubjectId}`);
      } catch {
        router.replace('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('unique')) {
        setErrorMessage('A subject with this name already exists. Try another name.');
      } else {
        setErrorMessage('Could not create subject right now. Please try again.');
      }
      setIsSaving(false);
    }
  };

  return (
    <KiwiScreen scrollable withBottomNavSpacing>
      <KiwiTopBar title="Create subject" onBackPress={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Subject name</Text>
          <TextInput
            autoCapitalize="words"
            maxLength={60}
            onChangeText={setName}
            placeholder="e.g. Biology"
            placeholderTextColor={KIWI_THEME.colors.textSecondary}
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            maxLength={180}
            multiline
            onChangeText={setDescription}
            placeholder="A short note about this subject"
            placeholderTextColor={KIWI_THEME.colors.textSecondary}
            style={styles.inputMultiline}
            value={description}
          />
        </View>

        <SubjectIconPicker
          onSelect={setSelectedOption}
          options={iconOptions}
          selectedIconKey={selectedOption.iconKey}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <KiwiButton
          disabled={!canSave}
          label="Create subject"
          loading={isSaving}
          onPress={handleSave}
          style={styles.button}
        />

        <Text style={styles.helperText}>
          You can always edit the subject details and icon later.
        </Text>
      </View>
    </KiwiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: KIWI_THEME.spacing.xl,
    paddingHorizontal: KIWI_THEME.spacing.lg,
    paddingTop: KIWI_THEME.spacing.xl,
  },
  fieldBlock: {
    width: '100%',
  },
  label: {
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    letterSpacing: 0,
    marginBottom: KIWI_THEME.spacing.sm,
  },
  input: {
    backgroundColor: KIWI_THEME.colors.surface,
    borderColor: KIWI_THEME.colors.borderSoft,
    borderRadius: KIWI_THEME.radius.card,
    borderWidth: 1,
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: KIWI_THEME.spacing.lg,
    paddingVertical: KIWI_THEME.spacing.sm,
  },
  inputMultiline: {
    backgroundColor: KIWI_THEME.colors.surface,
    borderColor: KIWI_THEME.colors.borderSoft,
    borderRadius: KIWI_THEME.radius.card,
    borderWidth: 1,
    color: KIWI_THEME.colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    minHeight: 104,
    paddingHorizontal: KIWI_THEME.spacing.lg,
    paddingTop: KIWI_THEME.spacing.md,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: KIWI_THEME.spacing.sm,
  },
  helperText: {
    color: KIWI_THEME.colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    letterSpacing: 0,
    textAlign: 'center',
  },
  errorText: {
    color: KIWI_THEME.colors.danger,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    letterSpacing: 0,
  },
});
