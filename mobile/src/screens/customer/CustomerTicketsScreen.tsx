import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';

export function CustomerTicketsScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { getTicketsForCustomerEmail, syncError } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const list = useMemo(() => {
    const raw = getTicketsForCustomerEmail(user?.email ?? '');
    return [...raw].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [getTicketsForCustomerEmail, user?.email]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>My tickets</Text>
          <Text style={styles.subtitle}>All requests, including resolved and closed</Text>
          {syncError ? (
            <Text style={styles.syncErr} accessibilityLiveRegion="polite">
              {syncError}
            </Text>
          ) : null}
        </View>
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
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        accessibilityLabel="Your support tickets"
        ListEmptyComponent={
          <Text style={styles.empty}>No tickets yet. Report a problem from the Home tab.</Text>
        }
        renderItem={({ item }) => (
          <View
            style={styles.card}
            accessibilityLabel={`Ticket ${item.id}, ${item.status}. ${item.problemDescription}`}
          >
            <Text style={styles.cardId}>{item.id}</Text>
            <Text style={styles.cardStatus}>{item.status.toUpperCase()}</Text>
            <Text style={styles.cardProblem} numberOfLines={3}>{item.problemDescription}</Text>
            <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
            {item.adminReplies.length > 0 && (
              <View style={styles.replyBox}>
                <Text style={styles.replyLabel}>Latest from support</Text>
                <Text style={styles.replyText}>{item.adminReplies[item.adminReplies.length - 1].body}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 21, paddingVertical: 14 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    signOut: { fontSize: 15, fontWeight: '600', color: colors.accent },
    titleBlock: { flex: 1, marginRight: 12 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    syncErr: { fontSize: 12, color: colors.red, marginTop: 8, lineHeight: 17 },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center', color: colors.textSecondary, fontSize: 16, marginTop: 40, paddingHorizontal: 24 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardId: { fontSize: 12, color: colors.accent, fontWeight: '700', marginBottom: 4 },
    cardStatus: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 8 },
    cardProblem: { fontSize: 16, color: colors.text, lineHeight: 22 },
    cardMeta: { fontSize: 12, color: colors.muted, marginTop: 10 },
    replyBox: { marginTop: 12, padding: 12, backgroundColor: colors.accentLight, borderRadius: 10 },
    replyLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, marginBottom: 4 },
    replyText: { fontSize: 14, color: colors.text },
  });
}
