import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function Card({ children, style, accentColor }: CardProps) {
  if (accentColor) {
    return (
      <View style={[styles.card, styles.cardRow, style]}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.inner}>{children}</View>
      </View>
    );
  }
  return <View style={[styles.card, styles.paddedCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
  },
  paddedCard: {
    padding: 16,
  },
  accent: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: 16,
  },
});
