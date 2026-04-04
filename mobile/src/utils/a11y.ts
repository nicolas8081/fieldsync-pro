import { AccessibilityInfo, Platform } from 'react-native';

/** Announces for VoiceOver / TalkBack (no-op on web). */
export function announceForA11y(message: string): void {
  if (Platform.OS === 'web') return;
  AccessibilityInfo.announceForAccessibility(message);
}
