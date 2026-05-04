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
import type { UserRole } from '../../types/portal';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Button } from '../../components/Button';
import { useClearAllLocalAppData } from '../../hooks/useClearAllLocalAppData';
import { authPortalLogin, authSignupCustomer } from '../../api/portalApi';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'> };

type AuthMode = 'login' | 'signup';

function friendlyErrorMessage(raw: string): string {
  try {
    const j = JSON.parse(raw) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0] && typeof (d[0] as { msg?: string }).msg === 'string') {
      return (d[0] as { msg: string }).msg;
    }
  } catch {
    /* not JSON */
  }
  return raw || 'Something went wrong.';
}

export function SignInScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { clearAllLocalData, clearing } = useClearAllLocalAppData();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const onUnifiedLogin = async () => {
    const em = email.trim();
    if (!em) {
      Alert.alert('Email required', 'Enter the email tied to your account.');
      return;
    }
    if (!password) {
      Alert.alert('Password required', 'Enter your password.');
      return;
    }
    setBusy(true);
    try {
      const r = await authPortalLogin(em, password);
      const role = r.role as UserRole;
      await signIn({
        role,
        email: r.email,
        displayName: r.display_name,
        password,
        customerId: r.customer_id ?? undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? friendlyErrorMessage(e.message) : 'Could not sign in.';
      Alert.alert('Sign in failed', msg);
    } finally {
      setBusy(false);
    }
  };

  const onCustomerSignup = async () => {
    const em = email.trim();
    const name = displayName.trim();
    if (!em) {
      Alert.alert('Email required', 'Customers need an email for their account.');
      return;
    }
    if (!name) {
      Alert.alert('Display name required', 'This is shown in the app and on tickets.');
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert('Password', 'Use at least 8 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Password mismatch', 'Both password fields must match.');
      return;
    }
    setBusy(true);
    try {
      const acc = await authSignupCustomer({
        email: em,
        password,
        full_name: name,
        phone: phone.trim() || undefined,
      });
      await signIn({
        role: 'customer',
        email: acc.email,
        displayName: acc.full_name,
        password,
        customerId: acc.id,
      });
    } catch (e) {
      const msg = e instanceof Error ? friendlyErrorMessage(e.message) : 'Could not create account.';
      Alert.alert('Sign up failed', msg);
    } finally {
      setBusy(false);
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
          <Text style={styles.headline}>{mode === 'login' ? 'Sign in' : 'Create customer account'}</Text>

          <View style={styles.segment} accessibilityRole="tablist">
            <Pressable
              onPress={() => setMode('login')}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'login' }}
              style={[styles.segmentBtn, mode === 'login' && styles.segmentBtnOn]}
            >
              <Text style={[styles.segmentLabel, mode === 'login' && styles.segmentLabelOn]}>Login</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('signup')}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'signup' }}
              style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnOn]}
            >
              <Text style={[styles.segmentLabel, mode === 'signup' && styles.segmentLabelOn]}>Sign up</Text>
            </Pressable>
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
          />

          {mode === 'signup' ? (
            <>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                placeholder="How we should address you"
                placeholderTextColor={colors.muted}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                accessibilityLabel="Display name"
              />
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="555-0100"
                placeholderTextColor={colors.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                accessibilityLabel="Phone"
              />
            </>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel="Password"
          />

          {mode === 'signup' ? (
            <>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor={colors.muted}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry
                accessibilityLabel="Confirm password"
              />
            </>
          ) : null}

          <Button
            title={mode === 'login' ? 'Sign in' : 'Create account'}
            onPress={() => void (mode === 'login' ? onUnifiedLogin() : onCustomerSignup())}
            loading={busy}
            disabled={busy}
            style={styles.primaryBtn}
            accessibilityHint={mode === 'login' ? 'Signs in using the API' : 'Registers a new customer'}
          />

          <Button
            title="Clear data on this device"
            variant="secondary"
            onPress={onClearStorage}
            loading={clearing}
            disabled={clearing || busy}
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
    headline: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 20 },
    segment: {
      flexDirection: 'row',
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    segmentBtnOn: { backgroundColor: colors.accentLight },
    segmentLabel: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    segmentLabelOn: { color: colors.accent },
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
    primaryBtn: { marginTop: 24 },
    clearBtn: { marginTop: 12 },
  });
}
