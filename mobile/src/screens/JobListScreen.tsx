import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Job } from '../types/job';
import { TechnicianStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { AccessiblePressable } from '../components/AccessiblePressable';
import { ThemeColors } from '../theme';
import { isJobActiveOnList } from '../utils/jobFilters';

type Props = {
  navigation: NativeStackNavigationProp<TechnicianStackParamList, 'JobList'>;
};

function getSeverityBadge(colors: ThemeColors): Record<string, { bg: string; color: string; label: string }> {
  return {
    high: { bg: colors.redLight, color: colors.red, label: 'HIGH' },
    med: { bg: colors.yellowLight, color: colors.yellow, label: 'MED' },
    low: { bg: colors.greenLight, color: colors.green, label: 'LOW' },
  };
}

export function JobListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { technicianJobs, technicianStats, refreshPortal, syncError } = usePortalData();
  const [jobs, setJobs] = useState<Job[]>(technicianJobs);
  const [refreshing, setRefreshing] = useState(false);

  const severityBadge = useMemo(() => getSeverityBadge(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    setJobs(technicianJobs);
  }, [technicianJobs]);

  const activeJobs = useMemo(() => jobs.filter(isJobActiveOnList), [jobs]);

  const sortedJobs = useMemo(() => {
    const rank: Record<Job['status'], number> = {
      scheduled: 0,
      in_progress: 1,
      completed: 2,
      cancelled: 3,
    };
    return [...activeJobs].sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [activeJobs]);

  const scheduledCount = technicianStats?.scheduled ?? activeJobs.filter((j) => j.status === 'scheduled').length;
  const inProgressCount = technicianStats?.onSite ?? activeJobs.filter((j) => j.status === 'in_progress').length;
  const activeCount = technicianStats?.active ?? activeJobs.length;

  const statusLabel = (s: Job['status']) =>
    ({ scheduled: 'Scheduled', in_progress: 'In progress', completed: 'Done', cancelled: 'Cancelled' }[s]);

  const renderItem = ({ item }: { item: Job }) => {
    const severity = item.severity || (item.status === 'in_progress' ? 'high' : 'med');
    const badge = severityBadge[severity] || severityBadge.med;
    const isUrg = severity === 'high';
    const isNew = item.status === 'scheduled';
    const isCancelled = item.status === 'cancelled';
    const isDone = item.status === 'completed';

    return (
      <AccessiblePressable
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        style={[
          styles.jobCard,
          isUrg && styles.jobCardUrg,
          isNew && !isUrg && styles.jobCardNew,
          isCancelled && styles.jobCardCancelled,
          isDone && styles.jobCardDone,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Job at ${item.address}. Status ${statusLabel(item.status)}. ${item.description || item.title}.`}
        accessibilityHint="Opens job details"
      >
        <View style={styles.jctop}>
          <Text style={styles.jcaddr} numberOfLines={1}>{item.address}</Text>
          <View style={[styles.jcbadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.jcbadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.jobStatusPill, isDone && styles.jobStatusPillDone, isCancelled && styles.jobStatusPillCancelled]}>
            {statusLabel(item.status).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.jccomplaint} numberOfLines={2}>
          {item.description || item.title}
        </Text>
        <View style={styles.jcmeta}>
          <Text style={styles.jcmetaText}>📍 3.2 mi</Text>
          <Text style={styles.jcmetaText}>
            ⏰ {new Date(item.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
          <Text style={styles.jcmetaText}>🧰 Parts loaded</Text>
        </View>
      </AccessiblePressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        <View style={styles.statusBar}>
          <View style={styles.statusBarLeft}>
            <View>
              <Text style={styles.techGreet}>Good morning,</Text>
              <Text style={styles.techname}>{user?.displayName ?? 'Technician'} 🛠️</Text>
            </View>
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
          <ThemeToggle />
        </View>

        {syncError ? (
          <View style={[styles.syncBanner, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
            <Text style={[styles.syncBannerText, { color: colors.red }]} selectable>
              {syncError}. Check email/password and pull to refresh.
            </Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.yellow }]}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>On site</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{scheduledCount}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
        </View>

        <FlatList
          data={sortedJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>ACTIVE JOBS · COMPLETED HIDDEN</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void refreshPortal().finally(() => setRefreshing(false));
              }}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No jobs in your queue</Text>
              {syncError ? (
                <Text style={styles.emptyHint}>
                  Fix the error above — jobs load from GET /technician/jobs using your technician email and password.
                </Text>
              ) : (
                <Text style={styles.emptyHint}>Assigned jobs appear here. Pull down to refresh.</Text>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 21,
      paddingVertical: 18,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statusBarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 12 },
    signOut: { fontSize: 15, fontWeight: '600', color: colors.accent },
    techGreet: { fontSize: 16, color: colors.textSecondary, marginBottom: 2 },
    techname: { fontSize: 21, fontWeight: '700', color: colors.text },
    syncBanner: {
      marginHorizontal: 21,
      marginTop: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    syncBannerText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    statsRow: {
      flexDirection: 'row',
      gap: 13,
      paddingHorizontal: 21,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statPill: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNum: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 3 },
    statLabel: { fontSize: 14, color: colors.textSecondary },
    sectionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      letterSpacing: 1.2,
      marginBottom: 16,
      paddingHorizontal: 3,
    },
    list: { padding: 21, paddingBottom: 42 },
    jobCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      marginBottom: 13,
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    jobCardUrg: { borderLeftWidth: 5, borderLeftColor: colors.red },
    jobCardNew: { borderLeftWidth: 5, borderLeftColor: colors.accent },
    jobCardDone: { opacity: 0.88 },
    jobCardCancelled: { opacity: 0.72, borderStyle: 'dashed' as const },
    jctop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    statusRow: { marginBottom: 8 },
    jobStatusPill: {
      alignSelf: 'flex-start',
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.6,
    },
    jobStatusPillDone: { color: colors.green },
    jobStatusPillCancelled: { color: colors.muted },
    jcaddr: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 10 },
    jcbadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 26 },
    jcbadgeText: { fontSize: 14, fontWeight: '600' },
    jccomplaint: { fontSize: 17, color: colors.textSecondary, marginBottom: 10 },
    jcmeta: { flexDirection: 'row', gap: 16 },
    jcmetaText: { fontSize: 14, color: colors.muted },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 31, gap: 13 },
    emptyText: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
    emptyHint: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 340,
    },
  });
}