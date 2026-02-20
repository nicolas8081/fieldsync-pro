import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

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
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backText}>← Back</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  left: { minWidth: 70 },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  right: { minWidth: 70, alignItems: 'flex-end' },
});
