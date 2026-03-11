import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({ title, onBack, right, style }: HeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.chevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.deep,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { minWidth: 70 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chevron: { fontSize: 24, color: colors.muted, lineHeight: 28 },
  backText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  right: { minWidth: 70, alignItems: 'flex-end' },
});
