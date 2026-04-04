import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';
import { ChatMessage, SupportThreadMessage } from '../../types/portal';
import { announceForA11y } from '../../utils/a11y';

type Mode = 'ai' | 'admin';

const seedAi: ChatMessage[] = [
  { id: '1', role: 'ai', text: 'Hi! I’m FieldSync AI. What’s going on with your washer?', at: new Date().toISOString() },
];

export function CustomerChatScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { getSupportMessagesForCustomer, sendCustomerSupportMessage } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>('ai');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(seedAi);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const supportMessages = useMemo(
    () => getSupportMessagesForCustomer(user?.email ?? ''),
    [getSupportMessagesForCustomer, user?.email]
  );

  const listData: (ChatMessage | SupportThreadMessage)[] = mode === 'ai' ? aiMessages : supportMessages;

  const send = () => {
    const t = input.trim();
    if (!t || sending) return;
    setSending(true);
    setInput('');

    if (mode === 'ai') {
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: t, at: new Date().toISOString() };
      setAiMessages((prev) => [...prev, userMsg]);
      announceForA11y('Message sent.');
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: 'Thanks for the details. For safety, severe leaks or electrical issues need a technician. I’ve noted this — you can also submit a ticket from the Home tab.',
          at: new Date().toISOString(),
        };
        setAiMessages((prev) => [...prev, reply]);
        announceForA11y('Assistant replied.');
        setSending(false);
      }, 600);
      return;
    }

    sendCustomerSupportMessage(user?.email ?? 'customer@demo.local', user?.displayName ?? 'Customer', t);
    announceForA11y('Message sent to support.');
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Chat
        </Text>
        <View style={styles.headerActions}>
          <AccessiblePressable
            onPress={() => signOut()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityHint="Return to portal selection"
          >
            <Text style={styles.signOut}>Sign out</Text>
          </AccessiblePressable>
          <ThemeToggle />
        </View>
      </View>
      <View style={styles.segment} accessibilityRole="tablist">
        <Pressable
          style={({ pressed }) => [
            styles.segBtn,
            mode === 'ai' && styles.segBtnOn,
            pressed && mode !== 'ai' ? { opacity: 0.88 } : null,
          ]}
          onPress={() => setMode('ai')}
          accessibilityRole="tab"
          accessibilityLabel="AI assistant"
          accessibilityState={{ selected: mode === 'ai' }}
        >
          <Text style={[styles.segText, mode === 'ai' && styles.segTextOn]}>AI assistant</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.segBtn,
            mode === 'admin' && styles.segBtnOn,
            pressed && mode !== 'admin' ? { opacity: 0.88 } : null,
          ]}
          onPress={() => setMode('admin')}
          accessibilityRole="tab"
          accessibilityLabel="Admin and support chat"
          accessibilityState={{ selected: mode === 'admin' }}
        >
          <Text style={[styles.segText, mode === 'admin' && styles.segTextOn]}>Admin / support</Text>
        </Pressable>
      </View>
      {mode === 'admin' ? (
        <Text style={styles.syncHint}>
          This chat is shared with the admin portal (Chat tab). A coordinator can reply in real time on the same device demo.
        </Text>
      ) : null}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          data={listData}
          keyExtractor={(m) => m.id}
          extraData={mode === 'admin' ? supportMessages.length : aiMessages.length}
          contentContainerStyle={styles.msgList}
          accessibilityLabel={`${mode === 'ai' ? 'AI assistant' : 'Support'} conversation`}
          ListEmptyComponent={
            mode === 'admin' ? (
              <Text style={styles.emptyHint}>
                No messages yet. Say hello — your admin can open Chat in their portal and reply in the same thread.
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            if (mode === 'ai') {
              const m = item as unknown as ChatMessage;
              const isUser = m.role === 'user';
              const who = isUser ? 'You' : m.role === 'ai' ? 'AI' : 'Support';
              return (
                <View
                  style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}
                  accessibilityRole="text"
                  accessibilityLabel={`${who} said: ${m.text}`}
                >
                  <Text style={[styles.bubbleLabel, isUser ? styles.bubbleLabelUser : styles.bubbleLabelBot]}>{who}</Text>
                  <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>{m.text}</Text>
                </View>
              );
            }
            const m = item as unknown as SupportThreadMessage;
            const isCustomer = m.author === 'customer';
            const who = isCustomer ? 'You' : 'Support';
            return (
              <View
                style={[styles.bubble, isCustomer ? styles.bubbleUser : styles.bubbleBot]}
                accessibilityRole="text"
                accessibilityLabel={`${who} said: ${m.text}`}
              >
                <Text style={[styles.bubbleLabel, isCustomer ? styles.bubbleLabelUser : styles.bubbleLabelBot]}>{who}</Text>
                <Text style={[styles.bubbleText, isCustomer ? styles.bubbleTextUser : styles.bubbleTextBot]}>{m.text}</Text>
              </View>
            );
          }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={mode === 'ai' ? 'Type a message…' : 'Message support…'}
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            accessibilityLabel="Message"
            editable={!sending}
          />
          <Pressable
            onPress={send}
            disabled={sending || !input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: sending || !input.trim() }}
            style={({ pressed }) => [
              styles.send,
              (sending || !input.trim()) && styles.sendDisabled,
              pressed && !sending && input.trim() ? { opacity: 0.88 } : null,
            ]}
          >
            {sending && mode === 'ai' ? (
              <ActivityIndicator color="#fff" size="small" accessibilityLabel="Sending" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 21, paddingVertical: 14 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    signOut: { fontSize: 15, fontWeight: '600', color: colors.accent },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1, marginRight: 12 },
    segment: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, gap: 8 },
    segBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    segBtnOn: { backgroundColor: colors.accentLight, borderColor: colors.accent },
    segText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    segTextOn: { color: colors.accent },
    syncHint: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    msgList: { padding: 16, paddingBottom: 8 },
    emptyHint: { textAlign: 'center', color: colors.muted, fontSize: 14, lineHeight: 20, paddingHorizontal: 16, paddingVertical: 24 },
    bubble: { maxWidth: '88%', padding: 12, borderRadius: 14, marginBottom: 10 },
    bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.accent },
    bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    bubbleLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
    bubbleLabelUser: { color: 'rgba(255,255,255,0.9)' },
    bubbleLabelBot: { color: colors.accent },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextUser: { color: '#fff' },
    bubbleTextBot: { color: colors.text },
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
      minHeight: 40,
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
