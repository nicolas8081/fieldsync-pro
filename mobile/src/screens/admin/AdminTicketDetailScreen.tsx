import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';
import { announceForA11y } from '../../utils/a11y';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminTicketDetail'>;

export function AdminTicketDetailScreen({ route, navigation }: Props) {
  const { ticketId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { tickets, technicians, assignTechnician, addAdminReply } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ticket = tickets.find((t) => t.id === ticketId);
  const [reply, setReply] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const onHide = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.missing}>Ticket not found</Text>
        <Button title="Back" onPress={() => navigation.goBack()} accessibilityHint="Returns to ticket list" />
      </SafeAreaView>
    );
  }

  const assigned = technicians.find((x) => x.id === ticket.assignedTechnicianId);

  const sendReply = async () => {
    if (!reply.trim() || replySending) return;
    setReplySending(true);
    const body = reply.trim();
    const start = Date.now();
    try {
      addAdminReply(ticket.id, body);
      setReply('');
      const elapsed = Date.now() - start;
      await new Promise((r) => setTimeout(r, Math.max(0, 280 - elapsed)));
      announceForA11y('Reply sent to customer.');
      Alert.alert('Sent', 'Your message was added to the ticket.');
    } finally {
      setReplySending(false);
    }
  };

  /** Small extra scroll room when keyboard is open — avoid stacking full keyboard height on top of KeyboardAvoidingView. */
  const gapAboveKeyboard = 120;
  const scrollBottomPad =
    keyboardHeight > 0 ? gapAboveKeyboard + insets.bottom : Math.max(48, insets.bottom + 20);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AccessiblePressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.back}>‹ Back</Text>
        </AccessiblePressable>
        <ThemeToggle />
      </View>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.id}>{ticket.id}</Text>
        <Text style={styles.status}>{ticket.status}</Text>

        <Text style={styles.section}>Customer</Text>
        <Text style={styles.body}>{ticket.customerName}</Text>
        <Text style={styles.body}>{ticket.customerEmail}</Text>
        <Text style={styles.body}>{ticket.customerPhone}</Text>
        <Text style={styles.body}>{ticket.customerAddress}</Text>

        <Text style={styles.section}>Appliance</Text>
        <Text style={styles.body}>{ticket.appliance}</Text>

        <Text style={styles.section}>Problem</Text>
        <View style={styles.complaintBox}>
          <Text style={styles.complaintText}>{ticket.problemDescription}</Text>
        </View>

        <Text style={styles.section}>Assigned technician</Text>
        {assigned ? (
          <Text style={styles.body}>{assigned.name} · {assigned.phone}</Text>
        ) : (
          <Text style={styles.muted}>Not assigned</Text>
        )}

        <Text style={styles.section}>Assign or reassign</Text>
        <View style={styles.techRow}>
          {technicians.filter((t) => t.available).map((tech) => {
            const selected = ticket.assignedTechnicianId === tech.id;
            return (
              <AccessiblePressable
                key={tech.id}
                style={[styles.techChip, selected && styles.techChipOn]}
                onPress={() => {
                  assignTechnician(ticket.id, tech.id);
                  announceForA11y(`Assigned ${tech.name}.`);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Assign ${tech.name}`}
                accessibilityHint="Creates a job for this technician"
                accessibilityState={{ selected }}
                pressedOpacity={0.9}
              >
                <Text style={styles.techName}>{tech.name}</Text>
              </AccessiblePressable>
            );
          })}
        </View>

        <Text style={styles.section}>Conversation with customer</Text>
        {ticket.adminReplies.map((r) => (
          <View key={r.id} style={styles.reply}>
            <Text style={styles.replyMeta}>{new Date(r.at).toLocaleString()}</Text>
            <Text style={styles.replyBody}>{r.body}</Text>
          </View>
        ))}

        <Text style={styles.section}>Reply to customer</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your response…"
          placeholderTextColor={colors.muted}
          value={reply}
          onChangeText={setReply}
          multiline
          accessibilityLabel="Reply to customer"
          editable={!replySending}
          onFocus={() => {
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
            const delay = Platform.OS === 'ios' ? 320 : 150;
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), delay);
          }}
        />
        <Button
          title="Send reply"
          onPress={sendReply}
          loading={replySending}
          disabled={replySending}
          style={styles.btn}
          accessibilityHint="Adds your message to this ticket for the customer"
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    kav: { flex: 1 },
    scrollView: { flex: 1 },
    back: { fontSize: 17, color: colors.accent, fontWeight: '600' },
    scroll: { padding: 21, flexGrow: 1 },
    id: { fontSize: 14, fontWeight: '700', color: colors.accent },
    status: { fontSize: 12, color: colors.textSecondary, marginBottom: 16, textTransform: 'uppercase' },
    section: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 16, marginBottom: 6, letterSpacing: 0.5 },
    body: { fontSize: 16, color: colors.text, marginBottom: 4 },
    muted: { fontSize: 15, color: colors.muted, fontStyle: 'italic' },
    complaintBox: { backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: 12, padding: 14 },
    complaintText: { fontSize: 17, fontWeight: '600', color: colors.text, lineHeight: 24 },
    techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    techChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    techChipOn: { borderColor: colors.accent, backgroundColor: colors.accentLight },
    techName: { fontSize: 14, fontWeight: '600', color: colors.text },
    reply: { backgroundColor: colors.card, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    replyMeta: { fontSize: 11, color: colors.muted, marginBottom: 4 },
    replyBody: { fontSize: 15, color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      minHeight: 88,
      maxHeight: 160,
      textAlignVertical: 'top',
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    btn: { marginTop: 12 },
    missing: { padding: 24, fontSize: 16, color: colors.text },
  });
}
