import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Button } from '../../components/Button';
import { createTechnicianAccountApi } from '../../api/portalApi';
import { getAdminApiKey } from '../../config/api';

export function AdminTechniciansScreen() {
  const { colors } = useTheme();
  const { technicians, refreshPortal, syncError } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const resetForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetForm();
    setSubmitting(false);
  }, [resetForm]);

  const openModal = useCallback(() => {
    if (!getAdminApiKey()) {
      Alert.alert(
        'Admin API key missing',
        'Set EXPO_PUBLIC_ADMIN_API_KEY in mobile/.env to match backend ADMIN_API_KEY, then restart Expo.'
      );
      return;
    }
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const submitCreate = useCallback(async () => {
    const name = fullName.trim();
    const em = email.trim();
    const pw = password;
    if (!name) {
      Alert.alert('Name required', 'Enter the technician’s full name.');
      return;
    }
    if (!em) {
      Alert.alert('Email required', 'Enter the technician’s sign-in email.');
      return;
    }
    if (!pw || pw.length < 8) {
      Alert.alert('Password required', 'Use at least 8 characters (backend rule).');
      return;
    }
    const phoneTrim = phone.trim();
    if (!phoneTrim) {
      Alert.alert('Phone required', 'Enter a phone number so dispatch can reach this technician.');
      return;
    }
    if (phoneTrim.replace(/\D/g, '').length < 7) {
      Alert.alert('Phone number', 'Enter a valid phone number (at least 7 digits).');
      return;
    }
    setSubmitting(true);
    try {
      await createTechnicianAccountApi({
        email: em,
        full_name: name,
        password: pw,
        phone: phoneTrim,
      });
      await refreshPortal();
      closeModal();
      Alert.alert('Technician created', `${name} can sign in on the technician portal with that email and password.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create technician.';
      Alert.alert('Create failed', msg);
    } finally {
      setSubmitting(false);
    }
  }, [closeModal, email, fullName, password, phone, refreshPortal]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Technicians</Text>
        <View style={styles.headerRight}>
          <Button
            title="+ New"
            onPress={openModal}
            style={styles.newBtn}
            accessibilityHint="Opens form to add a technician account"
          />
          <ThemeToggle />
        </View>
      </View>
      {syncError ? (
        <Text style={styles.syncErr} accessibilityLiveRegion="polite">
          {syncError}
        </Text>
      ) : null}

      <FlatList
        data={technicians}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No technicians yet. Tap + New to add one, or pull down to reload from the server.
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={() => {
              setRefreshing(true);
              void refreshPortal().finally(() => setRefreshing(false));
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.avail, item.available ? styles.availOn : styles.availOff]}>
                <Text style={styles.availText}>{item.available ? 'Available' : 'Busy'}</Text>
              </View>
            </View>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.meta}>{item.specialty}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
      />

      <Modal visible={modalOpen} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalDim} onPress={closeModal} accessibilityLabel="Dismiss" />
          <KeyboardAvoidingView
            style={styles.modalKav}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
          <SafeAreaView edges={['bottom']} style={styles.modalCard}>
            <Text style={styles.modalTitle}>New technician</Text>
            <Text style={styles.modalSub}>
              Full name, phone, email, and password (min. 8 characters) are required.
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jordan Smith"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                editable={!submitting}
              />
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 555-0100"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                editable={!submitting}
                textContentType="telephoneNumber"
                accessibilityLabel="Phone number"
              />
              <Text style={styles.label}>Email (sign-in)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tech@company.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 8 characters"
                placeholderTextColor={colors.muted}
                secureTextEntry
                editable={!submitting}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={closeModal} disabled={submitting} style={styles.modalBtn} />
              <Button
                title="Create"
                onPress={() => void submitCreate()}
                loading={submitting}
                disabled={submitting}
                style={styles.modalBtn}
              />
            </View>
          </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 21,
      paddingVertical: 14,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    newBtn: { paddingVertical: 10, paddingHorizontal: 14, minWidth: 0 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 },
    syncErr: {
      fontSize: 12,
      color: colors.red,
      paddingHorizontal: 21,
      paddingBottom: 8,
    },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center', color: colors.textSecondary, fontSize: 15, marginTop: 24, paddingHorizontal: 24 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    name: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
    email: { fontSize: 14, color: colors.accent, fontWeight: '600', marginBottom: 4 },
    avail: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    availOn: { backgroundColor: colors.greenLight },
    availOff: { backgroundColor: colors.yellowLight },
    availText: { fontSize: 12, fontWeight: '700', color: colors.text },
    meta: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
    phone: { fontSize: 15, color: colors.text, fontWeight: '500' },
    modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalDim: { flex: 1 },
    modalKav: {
      flexShrink: 0,
      maxHeight: '88%',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 21,
      paddingTop: 20,
      paddingBottom: 16,
      maxHeight: '88%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
    modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    modalBtn: { flex: 1 },
  });
}
