import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerHomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { Button } from '../../components/Button';
import { AccessiblePressable } from '../../components/AccessiblePressable';
import { announceForA11y } from '../../utils/a11y';

type Props = {
  navigation: NativeStackNavigationProp<CustomerHomeStackParamList, 'ReportProblem'>;
};

export function ReportProblemScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { createTicket } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [appliance, setAppliance] = useState('');
  const [problem, setProblem] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'sending' | 'submitted'>('idle');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [problemError, setProblemError] = useState<string | null>(null);
  const homeNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (homeNavTimerRef.current) {
        clearTimeout(homeNavTimerRef.current);
        homeNavTimerRef.current = null;
      }
    },
    []
  );

  const formLocked = submitPhase !== 'idle';

  const submit = async () => {
    if (!problem.trim()) {
      setProblemError('Describe what’s going wrong — this field is required so we can open your ticket.');
      announceForA11y('Problem description is required. Please fill in what’s going wrong.');
      return;
    }
    setProblemError(null);
    if (formLocked) return;
    setSubmitPhase('sending');
    const start = Date.now();
    try {
      const t = await createTicket({
        customerName: user?.displayName ?? 'Customer',
        customerEmail: user?.email ?? 'customer@demo.local',
        customerPhone: phone.trim() || 'Not provided',
        customerAddress: address.trim() || 'Not provided',
        appliance: appliance.trim() || 'Washing machine',
        problemDescription: problem.trim(),
      });
      const elapsed = Date.now() - start;
      await new Promise((r) => setTimeout(r, Math.max(0, 280 - elapsed)));
      announceForA11y(`Ticket submitted. Reference ${t.id}.`);
      setSubmittedTicketId(t.id);
      setSubmitPhase('submitted');
      homeNavTimerRef.current = setTimeout(() => {
        homeNavTimerRef.current = null;
        setSubmitPhase('idle');
        setSubmittedTicketId(null);
        navigation.navigate('CustomerHome');
      }, 2600);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not reach the server';
      Alert.alert('Ticket not saved', msg);
      setSubmitPhase('idle');
      setSubmittedTicketId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <AccessiblePressable
            onPress={() => navigation.goBack()}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹ Back</Text>
          </AccessiblePressable>
          <AccessiblePressable
            onPress={() => signOut()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityHint="Return to portal selection"
          >
            <Text style={styles.signOut}>Sign out</Text>
          </AccessiblePressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Report your problem</Text>
          <Text style={styles.sub}>Tell us about your washing machine. A ticket will be sent to FieldSync admin.</Text>
          <View style={styles.formHintBox} accessibilityRole="text">
            <Text style={styles.formHintTitle}>Before you submit</Text>
            <Text style={styles.formHintLine}>
              <Text style={styles.formHintEm}>Required: </Text>
              what’s going wrong (below).
            </Text>
            <Text style={styles.formHintLine}>
              <Text style={styles.formHintEm}>Optional: </Text>
              appliance model, phone, and address — they help us reach you and arrive prepared.
            </Text>
            {!appliance.trim() && !phone.trim() && !address.trim() && problem.trim() ? (
              <Text style={styles.formHintSoft}>
                You haven’t added phone or address yet. You can still submit; we’ll show “Not provided” for empty fields.
              </Text>
            ) : null}
          </View>

          <Text style={styles.label}>Appliance (brand / model)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Samsung front-load WF45"
            placeholderTextColor={colors.muted}
            value={appliance}
            onChangeText={setAppliance}
            accessibilityLabel="Appliance brand or model"
            editable={!formLocked}
          />

          <Text style={styles.label}>What’s going wrong? *</Text>
          <TextInput
            style={[styles.input, styles.multiline, problemError ? styles.inputInvalid : null]}
            placeholder="Leaking, won’t spin, error code…"
            placeholderTextColor={colors.muted}
            value={problem}
            onChangeText={(t) => {
              setProblem(t);
              if (problemError) setProblemError(null);
            }}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Problem description"
            accessibilityHint="Required. Describe what the washing machine is doing wrong"
            editable={!formLocked}
          />
          {problemError ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
              {problemError}
            </Text>
          ) : !problem.trim() && !formLocked ? (
            <Text style={styles.fieldPlaceholderHint}>Add a short description so our team knows how to help.</Text>
          ) : null}

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="555-0100"
            placeholderTextColor={colors.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            accessibilityLabel="Phone number"
            editable={!formLocked}
          />

          <Text style={styles.label}>Service address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, city, ZIP"
            placeholderTextColor={colors.muted}
            value={address}
            onChangeText={setAddress}
            accessibilityLabel="Service address"
            editable={!formLocked}
          />

          <Button
            title={submitPhase === 'submitted' ? 'Submitted' : 'Submit ticket'}
            variant={submitPhase === 'submitted' ? 'green' : 'primary'}
            onPress={submit}
            loading={submitPhase === 'sending'}
            disabled={formLocked}
            hideDisabledDimming={submitPhase === 'submitted'}
            style={styles.btn}
            accessibilityHint={
              submitPhase === 'submitted'
                ? 'Ticket saved. Returning to home shortly.'
                : 'Creates a ticket for the admin team'
            }
            accessibilityLabel={submitPhase === 'submitted' ? 'Submitted' : 'Submit ticket'}
          />
          {submitPhase === 'submitted' && submittedTicketId ? (
            <Text style={styles.submittedNote}>
              Reference {submittedTicketId}. Taking you home…
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    back: { alignSelf: 'flex-start' },
    backText: { fontSize: 17, color: colors.accent, fontWeight: '600' },
    signOut: { fontSize: 15, fontWeight: '600', color: colors.accent },
    scroll: { padding: 21, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
    sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 14, lineHeight: 22 },
    formHintBox: {
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
    },
    formHintTitle: { fontSize: 13, fontWeight: '700', color: colors.accent, marginBottom: 8 },
    formHintLine: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 6 },
    formHintEm: { fontWeight: '700', color: colors.text },
    formHintSoft: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: 8,
      fontStyle: 'italic',
    },
    label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 12 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    inputInvalid: { borderColor: colors.red, borderWidth: 2 },
    multiline: { minHeight: 120 },
    fieldError: {
      marginTop: 8,
      fontSize: 14,
      color: colors.red,
      fontWeight: '600',
      lineHeight: 20,
    },
    fieldPlaceholderHint: {
      marginTop: 8,
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    btn: { marginTop: 24 },
    submittedNote: {
      marginTop: 12,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
  });
}
