import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerHomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';
import { usePortalData } from '../../context/PortalDataContext';
import { isTicketOpen } from '../../utils/ticketFilters';
import { formatTicketRef, ticketRefLine } from '../../utils/ticketDisplay';

type Props = {
  navigation: NativeStackNavigationProp<CustomerHomeStackParamList, 'CustomerHome'>;
};

export function CustomerHomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { getTicketsForCustomerEmail } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openTicketsSorted = useMemo(() => {
    return getTicketsForCustomerEmail(user?.email ?? '')
      .filter(isTicketOpen)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [getTicketsForCustomerEmail, user?.email]);

  /** Home surfaces only the latest open item; full queue lives under Tickets. */
  const latestOpenTicket = openTicketsSorted[0] ?? null;
  const openTicketCount = openTicketsSorted.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>Hello,</Text>
            <Text style={styles.name}>{user?.displayName ?? 'Customer'}</Text>
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

        <Text style={styles.section}>What do you need?</Text>

        {latestOpenTicket ? (
          <View style={styles.openSection}>
            <Text style={styles.openSectionTitle}>Open requests</Text>
            <Text style={styles.openSectionSub}>
              {openTicketCount > 1
                ? `Showing your latest of ${openTicketCount} open requests. All of them appear on the Tickets tab.`
                : 'Not yet resolved — same ticket appears under the Tickets tab with full history.'}
            </Text>
            <View
              style={styles.openTicketCard}
              accessibilityLabel={`Open ticket ref ${formatTicketRef(latestOpenTicket.id)}, ${latestOpenTicket.status}`}
            >
              <Text style={styles.openTicketId}>{ticketRefLine(latestOpenTicket.id)}</Text>
              <Text style={styles.openTicketStatus}>
                {latestOpenTicket.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.openTicketProblem} numberOfLines={2}>
                {latestOpenTicket.problemDescription}
              </Text>
              <Text style={styles.openTicketMeta}>{new Date(latestOpenTicket.createdAt).toLocaleString()}</Text>
            </View>
            <AccessiblePressable
              style={styles.seeAllTickets}
              onPress={() => navigation.getParent()?.navigate('CustomerTickets')}
              accessibilityRole="button"
              accessibilityLabel="View all tickets"
              accessibilityHint="Opens the Tickets tab with every ticket including completed"
            >
              <Text style={styles.seeAllTicketsText}>All tickets →</Text>
            </AccessiblePressable>
          </View>
        ) : (
          <Text style={styles.noOpenHint}>No open requests. Report a problem below to create a ticket.</Text>
        )}

        <AccessiblePressable
          style={styles.heroCard}
          onPress={() => navigation.navigate('ReportProblem')}
          accessibilityRole="button"
          accessibilityLabel="Report a washer problem"
          accessibilityHint="Opens a form to describe your issue and create a service ticket"
          pressedOpacity={0.92}
        >
          <Text style={styles.heroIcon} importantForAccessibility="no">
            🔧
          </Text>
          <Text style={styles.heroTitle}>Report a washer problem</Text>
          <Text style={styles.heroSub}>Describe your issue — we’ll create a service ticket for our team.</Text>
        </AccessiblePressable>

        <AccessiblePressable
          style={styles.secondaryCard}
          onPress={() => navigation.getParent()?.navigate('CustomerChat')}
          accessibilityRole="button"
          accessibilityLabel="Chat with AI or support"
          accessibilityHint="Opens chat with the assistant or admin messages"
        >
          <Text style={styles.secondaryIcon} importantForAccessibility="no">
            💬
          </Text>
          <View style={styles.secondaryText}>
            <Text style={styles.secondaryTitle}>Chat with AI or support</Text>
            <Text style={styles.secondarySub}>Get quick answers or message an admin.</Text>
          </View>
          <Text style={styles.chevron} importantForAccessibility="no">
            ›
          </Text>
        </AccessiblePressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 21, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    signOut: { fontSize: 15, fontWeight: '600', color: colors.accent },
    greet: { fontSize: 16, color: colors.textSecondary },
    name: { fontSize: 24, fontWeight: '700', color: colors.text },
    section: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
    openSection: { marginBottom: 20 },
    openSectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    openSectionSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 },
    openTicketCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    openTicketId: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 4 },
    openTicketStatus: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
    openTicketProblem: { fontSize: 15, color: colors.text, lineHeight: 21 },
    openTicketMeta: { fontSize: 12, color: colors.muted, marginTop: 8 },
    seeAllTickets: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
    seeAllTicketsText: { fontSize: 15, fontWeight: '700', color: colors.accent },
    noOpenHint: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    heroCard: {
      backgroundColor: colors.accent,
      borderRadius: 18,
      padding: 22,
      marginBottom: 14,
    },
    heroIcon: { fontSize: 36, marginBottom: 10 },
    heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
    heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
    secondaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    secondaryIcon: { fontSize: 28 },
    secondaryText: { flex: 1 },
    secondaryTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    secondarySub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    chevron: { fontSize: 28, color: colors.muted },
  });
}
