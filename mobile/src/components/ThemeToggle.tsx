import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { mode, colors, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[styles.btn, { backgroundColor: colors.soft, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {mode === 'dark' ? 'Day' : 'Night'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  icon: { fontSize: 21 },
  label: { fontSize: 16, fontWeight: '600' },
});
