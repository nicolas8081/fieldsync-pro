# FieldSync Pro – Mobile App

Expo React Native app for FieldSync Pro.

## Setup

```bash
cd mobile
npm install
```

## Run

- **Dev server (recommended for phone):** `npm start` — then scan the **QR code** with **Expo Go** (Android) or the **Camera app** (iOS) to open the app on your device. Ensure phone and computer are on the same Wi‑Fi.
- **iOS simulator:** `npm run ios`
- **Android emulator:** `npm run android`
- **Web:** `npm run web`

## Structure

- **Screens:** Job list → Job detail → 3D viewer (with model quality feedback)
- **Navigation:** React Navigation (native stack), no header (custom Header in each screen)
- **API:** `src/api/jobs.ts` – fetches from `EXPO_PUBLIC_API_URL` or falls back to mock data
- **UI:** `src/components/` – Button, Card, Header, ThemeToggle
- **Theme:** Tap **Night** / **Day** (in the top bar) to switch between dark (FieldSync prototype) and light (Claude-style) themes. Choice is saved and restored on next launch.

## Backend / mock data

- Set `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:8000`) to use your backend.
- If the backend is unavailable or has no `/api/jobs` endpoint, the app uses mock job list data.

## 3D viewer

- The 3D screen shows a placeholder. To load real models, integrate `expo-gl` + Three.js or a WebView with a 3D viewer.
- Users can rate model quality (1–5) and submit optional notes; wire `submitFeedback` to your backend when ready.
