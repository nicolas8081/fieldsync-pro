import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/portal';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Button } from '../../components/Button';
import { useClearAllLocalAppData } from '../../hooks/useClearAllLocalAppData';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'> };

const ROLES: { role: UserRole; title: string; subtitle: string }[] = [
  { role: 'customer', title: 'Customer', subtitle: 'Report issues & track tickets' },
  { role: 'admin', title: 'Admin', subtitle: 'Tickets, technicians, replies' },
  { role: 'technician', title: 'Technician', subtitle: 'Assigned jobs & 3D viewer' },
];

export function SignInScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { clearAllLocalData, clearing } = useClearAllLocalAppData();
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const onSubmit = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signIn({
        role,
        email: email.trim() || `${role}@demo.local`,
        displayName: displayName.trim() || ROLES.find((r) => r.role === role)?.title || 'User',
        password,
      });
    } finally {
      setSigningIn(false);
    }
  };

  const onClearStorage = () => {
    Alert.alert(
      'Clear saved data?',
      'Removes tickets, support threads, sign-in, and theme preference from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => void clearAllLocalData() },
      ]
    );
  };

  const topChromePad = insets.top + 14;
  const scrollPadBottom = Math.max(insets.bottom, 16) + 48;

  return (
    <View style={styles.flex}>
      <View
        style={[
          styles.topChrome,
          {
            paddingTop: topChromePad,
            paddingBottom: 14,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.logo} accessibilityRole="header">
            FieldSync Pro
          </Text>
          <ThemeToggle />
        </View>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.headline}>Choose your portal</Text>
        <Text style={styles.sub}>
          {role === 'technician'
            ? 'Use the technician email and password from your admin-created account (HTTP Basic to the API).'
            : 'Demo auth — use any email. Technicians need a real password; others can leave it blank.'}
        </Text>

        <Text accessibilityRole="text" style={styles.groupLabel}>
          Portal type
        </Text>
        <View style={styles.roleRow} accessibilityRole="radiogroup">
          {ROLES.map((r) => {
            const selected = role === r.role;
            return (
              <Pressable
                key={r.role}
                onPress={() => setRole(r.role)}
                accessibilityRole="radio"
                accessibilityLabel={`${r.title}. ${r.subtitle}`}
                accessibilityState={{ selected, checked: selected }}
                android_ripple={
                  Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.08)', borderless: false } : undefined
                }
                style={({ pressed }) => [
                  styles.roleCard,
                  selected && styles.roleCardOn,
                  pressed && !selected ? { opacity: 0.92 } : null,
                  pressed && selected ? { opacity: 0.95 } : null,
                ]}
              >
                <Text style={[styles.roleTitle, selected && styles.roleTitleOn]}>{r.title}</Text>
                <Text style={styles.roleSub}>{r.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email"
          accessibilityHint="Used to match your tickets in this demo"
        />
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          value={displayName}
          onChangeText={setDisplayName}
          accessibilityLabel="Display name"
        />
        <Text style={styles.label}>Password (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
          accessibilityHint="Optional in this demo"
        />

        <Button
          title="Continue"
          onPress={onSubmit}
          loading={signingIn}
          disabled={signingIn}
          style={styles.primaryBtnWrap}
          accessibilityHint="Opens the portal for the selected role"
        />
        <Button
          title="Clear data on this device"
          variant="secondary"
          onPress={onClearStorage}
          loading={clearing}
          disabled={clearing || signingIn}
          style={styles.clearBtn}
          accessibilityHint="Erases FieldSync demo data stored on this phone"
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    topChrome: {
      paddingHorizontal: 24,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    scroll: { paddingHorizontal: 24, paddingTop: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontSize: 22, fontWeight: '800', color: colors.accent },
    headline: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
    sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 20 },
    groupLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    roleRow: { gap: 10, marginBottom: 20 },
    roleCard: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.card,
    },
    roleCardOn: { borderColor: colors.accent, backgroundColor: colors.accentLight },
    roleTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    roleTitleOn: { color: colors.accent },
    roleSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    primaryBtnWrap: { marginTop: 24 },
    clearBtn: { marginTop: 12 },
  });
}
