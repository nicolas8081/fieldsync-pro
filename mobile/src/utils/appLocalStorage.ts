import AsyncStorage from '@react-native-async-storage/async-storage';

/** Keys used by FieldSync Pro demo — keep in sync with Auth, Theme, and Portal providers. */
export const FIELD_SYNC_AUTH_KEY = '@fieldsync_auth_user';
export const FIELD_SYNC_THEME_KEY = '@fieldsync_theme';
export const FIELD_SYNC_PORTAL_KEY = '@fieldsync_portal_data';
/** Legacy key from removed “saved on this device” logins — still cleared for a full wipe. */
const LEGACY_FIELD_SYNC_SAVED_SIGNINS_KEY = '@fieldsync_saved_signins';

export async function removeAllFieldSyncStorageKeys(): Promise<void> {
  await AsyncStorage.multiRemove([
    FIELD_SYNC_AUTH_KEY,
    FIELD_SYNC_THEME_KEY,
    FIELD_SYNC_PORTAL_KEY,
    LEGACY_FIELD_SYNC_SAVED_SIGNINS_KEY,
  ]);
}
