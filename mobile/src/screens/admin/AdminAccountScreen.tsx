import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeColors } from '../../theme';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';

export function AdminAccountScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <ThemeToggle />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>Administrator</Text>
        <Button
          title="Sign out"
          variant="secondary"
          onPress={signOut}
          style={styles.btn}
          accessibilityHint="Returns to portal selection"
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 21, paddingVertical: 14 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    body: { padding: 24 },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    value: { fontSize: 22, fontWeight: '700', color: colors.text },
    email: { fontSize: 16, color: colors.accent, marginTop: 4 },
    role: { fontSize: 14, color: colors.muted, marginTop: 12, marginBottom: 28 },
    btn: { marginTop: 8 },
  });
}
