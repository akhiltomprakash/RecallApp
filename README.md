# RecallApp

RecallApp is an Expo + React Native study app for capturing notes, generating flashcards, and reviewing with spaced repetition.

## Features

- Subject-based notes organization
- Note-to-flashcard creation
- Optional Gemini-powered note organization and flashcard generation
- FSRS-style review flow with due cards and review history
- LLM logs screen for debugging AI generation attempts
- JSON-backed library loader for pre-made subjects
- Local-first storage using SQLite and secure key storage

## Tech Stack

- React Native + Expo (SDK 56)
- Expo Router
- SQLite (`expo-sqlite`)
- Secure storage (`expo-secure-store`)
- TypeScript

## Quick Start

```bash
git clone https://github.com/akhiltomprakash/RecallApp.git
cd RecallApp
npm install
npm run start
```

Then run on:

- iOS simulator: press `i`
- Android emulator: press `a`
- Physical device: scan QR via Expo Go

## First Run Behavior

On first launch, the app initializes SQLite tables and creates default local content:

- `General` subject
- Pre-seeded `Quantum Computing Basics` note
- Linked demo flashcards under that note

## Study Libraries

RecallApp can load pre-made study libraries from the local `JSON libraries/` folder.

- Open **Settings**
- Tap **Load libraries**
- Browse the available library list
- Tap **Load** to add a library as a subject
- Tap **Dismiss** to remove a loaded library from the device

Library files are synced automatically at app start through `npm run sync:libraries`, which runs before `npm run start`, `npm run ios`, `npm run android`, and `npm run web`.

Library naming rules:

- Subject title comes from the JSON content using `Class + Subject + Chapter Title`
- Example: `Class 12 Biology - Microbes in Human Welfare`
- Legacy generic names are still recognized so already-loaded libraries can be dismissed after a rename

Supported JSON shape:

- `class`, `board`, `subject`, `chapter_title`
- `chapter_summary`
- `topics[]` with `topic_title`, `topic_note`, `key_terms`, `timeline_items`, and `flashcards`
- Flashcards may be `basic`, `reverse`, or `cloze` style entries

## Gemini API Setup (Optional)

In-app path:

1. Open **My Notes**
2. Tap the top-right **Settings** icon
3. Tap **Set API key**
4. Save key and tap **Test**

When the key is available, note saving attempts AI organization first. If the call fails, the app falls back to offline flashcard creation.

## LLM Logs

To inspect AI behavior:

1. Open **My Notes**
2. Tap **Settings**
3. Select **LLM log**

Each entry stores provider, model, operation, success/error status, input/output character counts, and error messages.

## Scripts

```bash
npm run start
npm run ios
npm run android
npm run web
```

## Development Notes

- Type check:

```bash
npx tsc --noEmit
```

- Clear Metro cache:

```bash
npx expo start -c
```

- Reset local app data from in-app settings (`Reset local data`).

## Additional Setup Guide

See [SETUP.md](./SETUP.md) for a collaborator-focused onboarding checklist.
