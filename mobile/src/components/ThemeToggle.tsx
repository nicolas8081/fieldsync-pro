import React from 'react';
import { Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { mode, colors, toggleTheme } = useTheme();
  const isDark = mode === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const shortLabel = isDark ? 'Day' : 'Night';

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: isDark }}
      android_ripple={
        Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.12)', borderless: false } : undefined
      }
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: colors.soft, borderColor: colors.border },
        pressed ? { opacity: 0.88 } : null,
      ]}
    >
      <Text style={styles.icon} importantForAccessibility="no">
        {isDark ? '☀️' : '🌙'}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{shortLabel}</Text>
    </Pressable>
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
