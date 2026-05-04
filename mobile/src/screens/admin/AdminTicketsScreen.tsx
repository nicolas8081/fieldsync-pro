import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AdminStackParamList, AdminTabParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';
import { Ticket } from '../../types/portal';
import { isTicketClosed, isTicketOpen } from '../../utils/ticketFilters';
import { formatTicketRef, ticketRefLine } from '../../utils/ticketDisplay';

type AdminTicketsNav = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList, 'AdminTickets'>,
  NativeStackNavigationProp<AdminStackParamList>
>;

type TicketView = 'active' | 'past';

export function AdminTicketsScreen() {
  const { colors } = useTheme();
  const { tickets } = usePortalData();
  const navigation = useNavigation<AdminTicketsNav>();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [view, setView] = useState<TicketView>('active');

  const openTickets = useMemo(() => tickets.filter(isTicketOpen), [tickets]);
  const pastTickets = useMemo(() => {
    return tickets
      .filter(isTicketClosed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets]);

  const listData = view === 'active' ? openTickets : pastTickets;

  const open = (t: Ticket) => {
    navigation.navigate('AdminTicketDetail', { ticketId: t.id });
  };

  const emptyText =
    tickets.length === 0
      ? 'No tickets yet. Customers appear here when they report issues.'
      : view === 'active'
        ? 'No open tickets. Switch to Past to see resolved or cancelled requests.'
        : 'No past tickets yet. Resolved and cancelled requests appear here.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Tickets</Text>
          <Text style={styles.subtitle}>
            {view === 'active' ? 'Open queue' : 'Resolved & cancelled archive'}
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <View style={styles.segment} accessibilityRole="tablist">
        <Pressable
          style={({ pressed }) => [
            styles.segBtn,
            view === 'active' && styles.segBtnOn,
            pressed && view !== 'active' ? { opacity: 0.88 } : null,
          ]}
          onPress={() => setView('active')}
          accessibilityRole="tab"
          accessibilityLabel="Active tickets"
          accessibilityState={{ selected: view === 'active' }}
        >
          <Text style={[styles.segText, view === 'active' && styles.segTextOn]}>Active</Text>
          {openTickets.length > 0 ? (
            <View style={[styles.countPill, view === 'active' && styles.countPillOn]}>
              <Text style={[styles.countText, view === 'active' && styles.countTextOn]}>{openTickets.length}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.segBtn,
            view === 'past' && styles.segBtnOn,
            pressed && view !== 'past' ? { opacity: 0.88 } : null,
          ]}
          onPress={() => setView('past')}
          accessibilityRole="tab"
          accessibilityLabel="Past tickets"
          accessibilityState={{ selected: view === 'past' }}
        >
          <Text style={[styles.segText, view === 'past' && styles.segTextOn]}>Past</Text>
        </Pressable>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        extraData={view}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        renderItem={({ item }) => (
          <AccessiblePressable
            style={[
              styles.card,
              view === 'past' && styles.cardPast,
              view === 'past' && item.status === 'cancelled' && styles.cardCancelled,
            ]}
            onPress={() => open(item)}
            accessibilityRole="button"
            accessibilityLabel={`Ticket ref ${formatTicketRef(item.id)}, ${item.status}. ${item.customerName}. ${item.problemDescription}`}
            accessibilityHint="Opens ticket details"
          >
            <View style={styles.row}>
              <Text style={[styles.id, view === 'past' && styles.idPast]}>{ticketRefLine(item.id)}</Text>
              <Text
                style={[
                  styles.badge,
                  view === 'past' && item.status === 'resolved' && styles.badgeResolved,
                  view === 'past' && item.status === 'cancelled' && styles.badgeCancelled,
                ]}
              >
                {view === 'past' ? item.status.replace(/_/g, ' ') : item.status}
              </Text>
            </View>
            <Text style={styles.customer}>{item.customerName} · {item.customerEmail}</Text>
            <Text style={styles.problem} numberOfLines={2}>
              {item.problemDescription}
            </Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </AccessiblePressable>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 21,
      paddingVertical: 14,
    },
    titleBlock: { flex: 1, marginRight: 12 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    segment: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 8,
      gap: 8,
    },
    segBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segBtnOn: { backgroundColor: colors.accentLight, borderColor: colors.accent },
    segText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    segTextOn: { color: colors.accent },
    countPill: {
      minWidth: 22,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colors.border,
    },
    countPillOn: { backgroundColor: colors.accentBorder },
    countText: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
    countTextOn: { color: colors.accent },
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
    cardPast: { opacity: 0.95 },
    cardCancelled: { borderStyle: 'dashed' as const, opacity: 0.88 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    id: { fontSize: 13, fontWeight: '700', color: colors.accent },
    idPast: { color: colors.muted },
    badge: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
    badgeResolved: { color: colors.green },
    badgeCancelled: { color: colors.muted },
    customer: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
    problem: { fontSize: 16, color: colors.text, lineHeight: 22 },
    time: { fontSize: 12, color: colors.muted, marginTop: 8 },
  });
}
