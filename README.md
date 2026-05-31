# RecallApp

RecallApp is an Expo + React Native study app for capturing notes, generating flashcards, and reviewing with spaced repetition.

## Features

- Subject-based notes organization
- Note-to-flashcard creation
- Optional Gemini-powered note organization and flashcard generation
- FSRS-style review flow with due cards and review history
- LLM logs screen for debugging AI generation attempts
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
