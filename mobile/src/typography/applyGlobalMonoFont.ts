import { StyleSheet, Text, TextInput } from 'react-native';
import { fonts } from './fonts';

let applied = false;

/** One-time: default all Text / TextInput to JetBrains Mono regular. */
export function applyGlobalMonoFont() {
  if (applied) return;
  applied = true;
  const base = { fontFamily: fonts.regular };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Text as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TI = TextInput as any;
  T.defaultProps = T.defaultProps || {};
  T.defaultProps.style = StyleSheet.flatten([T.defaultProps.style, base]);
  TI.defaultProps = TI.defaultProps || {};
  TI.defaultProps.style = StyleSheet.flatten([TI.defaultProps.style, base]);
}
