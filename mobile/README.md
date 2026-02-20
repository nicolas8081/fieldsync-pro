# FieldSync Pro – Mobile App

Expo React Native app for FieldSync Pro.

## Setup

```bash
cd mobile
npm install
```

## Run

- **iOS:** `npm run ios`
- **Android:** `npm run android`
- **Web:** `npm run web`
- **Dev server:** `npm start`

## Structure

- **Screens:** Job list → Job detail → 3D viewer (with model quality feedback)
- **Navigation:** React Navigation (native stack), no header (custom Header in each screen)
- **API:** `src/api/jobs.ts` – fetches from `EXPO_PUBLIC_API_URL` or falls back to mock data
- **UI:** `src/components/` – Button, Card, Header

## Backend / mock data

- Set `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:8000`) to use your backend.
- If the backend is unavailable or has no `/api/jobs` endpoint, the app uses mock job list data.

## 3D viewer

- The 3D screen shows a placeholder. To load real models, integrate `expo-gl` + Three.js or a WebView with a 3D viewer.
- Users can rate model quality (1–5) and submit optional notes; wire `submitFeedback` to your backend when ready.
