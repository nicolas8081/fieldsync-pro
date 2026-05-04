/**
 * Backend base URL. Use your machine LAN IP for physical devices (same Wi‑Fi).
 * Example: EXPO_PUBLIC_API_URL=http://192.168.1.12:8000
 */
export function getApiBase(): string {
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';
}

const ADMIN_KEY_PLACEHOLDERS = new Set([
  '',
  'ADMIN_API_KEY',
  'your-admin-key',
  'paste-the-same-secret-as-backend-here',
]);

export function getAdminApiKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_ADMIN_API_KEY?.trim();
  if (!k || ADMIN_KEY_PLACEHOLDERS.has(k)) return undefined;
  return k;
}
