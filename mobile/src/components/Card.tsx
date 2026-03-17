import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function Card({ children, style, accentColor }: CardProps) {
  const { colors } = useTheme();

  if (accentColor) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, styles.cardRow, style]}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.inner}>{children}</View>
      </View>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, styles.paddedCard, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#1A1612',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row' },
  paddedCard: { padding: 21 },
  accent: { width: 5 },
  inner: { flex: 1, padding: 18 },
});
