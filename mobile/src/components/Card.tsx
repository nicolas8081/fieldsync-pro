import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

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
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    padding: 14,
  },
});
