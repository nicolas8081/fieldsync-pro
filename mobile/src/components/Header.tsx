import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({ title, onBack, right, style }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }, style]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={[styles.chevron, { color: colors.accent }]}>‹</Text>
            <Text style={[styles.backText, { color: colors.accent }]}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
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
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  left: { minWidth: 91 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chevron: { fontSize: 31, lineHeight: 36 },
  backText: { fontSize: 18, fontWeight: '600' },
  title: { flex: 1, fontSize: 21, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  right: { minWidth: 91, alignItems: 'flex-end' },
});
