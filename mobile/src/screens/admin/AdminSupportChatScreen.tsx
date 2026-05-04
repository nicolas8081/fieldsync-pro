import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { usePortalData } from '../../context/PortalDataContext';
import { fetchAdminChatThread } from '../../api/portalApi';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';
import { SupportThreadMessage } from '../../types/portal';
import { announceForA11y } from '../../utils/a11y';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminSupportChat'>;

export function AdminSupportChatScreen({ route, navigation }: Props) {
  const { customerEmail, customerName } = route.params;
  const { colors } = useTheme();
  const { sendAdminSupportMessage } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [messages, setMessages] = useState<SupportThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(() => {
    void fetchAdminChatThread(customerEmail).then(setMessages);
  }, [customerEmail]);

  useFocusEffect(
    useCallback(() => {
      loadThread();
    }, [loadThread])
  );

  const send = () => {
    const t = input.trim();
    if (!t || sending) return;
    setSending(true);
    void sendAdminSupportMessage(customerEmail, t)
      .then(() => {
        announceForA11y('Message sent to customer.');
        loadThread();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Could not send';
        Alert.alert('Could not send', msg);
      })
      .finally(() => setSending(false));
    setInput('');
  };

  const renderMsg = ({ item }: { item: SupportThreadMessage }) => {
    const fromAdmin = item.author === 'admin';
    return (
      <View
        style={[styles.bubble, fromAdmin ? styles.bubbleAdmin : styles.bubbleCustomer]}
        accessibilityLabel={`${fromAdmin ? 'You' : customerName} said: ${item.text}`}
      >
        <Text style={[styles.bubbleLabel, fromAdmin ? styles.bubbleLabelAdmin : styles.bubbleLabelCustomer]}>
          {fromAdmin ? 'You (support)' : customerName}
        </Text>
        <Text style={[styles.bubbleText, fromAdmin ? styles.bubbleTextAdmin : styles.bubbleTextCustomer]}>
          {item.text}
        </Text>
      </View>
    );
  };

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
        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {customerName}
          </Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {customerEmail}
          </Text>
        </View>
        <ThemeToggle />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          extraData={messages.length}
          contentContainerStyle={styles.msgList}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Your first reply will start the thread on the customer’s side.</Text>
          }
          renderItem={renderMsg}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Reply to customer…"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            accessibilityLabel="Message to customer"
            editable={!sending}
          />
          <Pressable
            onPress={send}
            disabled={sending || !input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [
              styles.send,
              (sending || !input.trim()) && styles.sendDisabled,
              pressed && input.trim() && !sending ? { opacity: 0.88 } : null,
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
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
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 10,
    },
    back: { fontSize: 17, color: colors.accent, fontWeight: '600' },
    topCenter: { flex: 1, minWidth: 0 },
    topTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    topSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    msgList: { padding: 16, paddingBottom: 8 },
    empty: { textAlign: 'center', color: colors.textSecondary, fontSize: 15, marginTop: 32, paddingHorizontal: 24, lineHeight: 22 },
    bubble: { maxWidth: '88%', padding: 12, borderRadius: 14, marginBottom: 10 },
    bubbleAdmin: { alignSelf: 'flex-end', backgroundColor: colors.accent },
    bubbleCustomer: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    bubbleLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
    bubbleLabelAdmin: { color: 'rgba(255,255,255,0.9)' },
    bubbleLabelCustomer: { color: colors.accent },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextAdmin: { color: '#fff' },
    bubbleTextCustomer: { color: colors.text },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    send: {
      minWidth: 72,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendDisabled: { opacity: 0.45 },
    sendText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
