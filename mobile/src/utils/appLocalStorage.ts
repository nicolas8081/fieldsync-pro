import AsyncStorage from '@react-native-async-storage/async-storage';

/** Keys used by FieldSync Pro demo — keep in sync with Auth, Theme, and Portal providers. */
export const FIELD_SYNC_AUTH_KEY = '@fieldsync_auth_user';
export const FIELD_SYNC_THEME_KEY = '@fieldsync_theme';
export const FIELD_SYNC_PORTAL_KEY = '@fieldsync_portal_data';

export async function removeAllFieldSyncStorageKeys(): Promise<void> {
  await AsyncStorage.multiRemove([FIELD_SYNC_AUTH_KEY, FIELD_SYNC_THEME_KEY, FIELD_SYNC_PORTAL_KEY]);
}
