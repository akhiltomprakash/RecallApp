# RecallApp Setup

Use this guide to get the app running quickly on a new machine.

## 1) Prerequisites

- Node.js 20+
- npm 10+
- Xcode (for iOS simulator) and/or Android Studio (for Android emulator)
- Expo CLI is optional (we use `npx expo`)

## 2) Clone and install

```bash
git clone https://github.com/akhiltomprakash/RecallApp.git
cd RecallApp
npm install
```

## 3) Start the app

```bash
npm run start
```

Then choose one target:

- `i` for iOS simulator
- `a` for Android emulator
- scan QR in Expo Go for physical device

## 4) App data + first run behavior

- Local SQLite DB is auto-created on app launch.
- A default `General` subject is auto-created if no subjects exist.
- Demo quantum note + linked flashcards are seeded in `General`.

## 5) Optional AI setup (Gemini)

Inside the app:

1. Open **My Notes**
2. Tap the top-right **Settings** icon
3. Select **Set API key**
4. Paste Gemini API key and tap **Save**
5. Tap **Test** to verify connection

If key is missing or request fails, app falls back to non-AI flashcard creation.

## 6) Useful scripts

```bash
npm run start
npm run ios
npm run android
npm run web
```

## 7) Troubleshooting

### Metro cache issues

```bash
npx expo start -c
```

### Type checking

```bash
npx tsc --noEmit
```

### Dependency reset

```bash
rm -rf node_modules package-lock.json
npm install
```

## 8) For collaborators/agents

- Keep changes scoped to `RecallApp/`.
- Run type check before opening PR:

```bash
npx tsc --noEmit
```

- If testing AI note generation, verify:
  - API key save + test succeeds
  - note creation path logs entries in **LLM log** screen

