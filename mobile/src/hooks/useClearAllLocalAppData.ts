import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { useTheme } from '../context/ThemeContext';
import { removeAllFieldSyncStorageKeys } from '../utils/appLocalStorage';

/**
 * Removes FieldSync AsyncStorage keys and resets in-memory portal, theme, and session.
 * Call after user confirms — this signs the user out.
 */
export function useClearAllLocalAppData() {
  const { signOut } = useAuth();
  const { resetPortalToDefaults } = usePortalData();
  const { resetToDefaultTheme } = useTheme();
  const [clearing, setClearing] = useState(false);
  const runningRef = useRef(false);

  const clearAllLocalData = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setClearing(true);
    try {
      await removeAllFieldSyncStorageKeys();
      resetPortalToDefaults();
      resetToDefaultTheme();
      await signOut();
    } finally {
      runningRef.current = false;
      setClearing(false);
    }
  }, [signOut, resetPortalToDefaults, resetToDefaultTheme]);

  return { clearAllLocalData, clearing };
}
