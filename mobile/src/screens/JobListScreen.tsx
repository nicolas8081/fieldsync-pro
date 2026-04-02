import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchJobs } from '../api/jobs';
import { Job } from '../types/job';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeColors } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JobList'>;
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const severityBadge = useMemo(() => getSeverityBadge(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchJobs();
      setJobs(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doneCount = jobs.filter((j) => j.status === 'completed').length;
  const leftCount = jobs.filter((j) => j.status !== 'completed').length;

  const renderItem = ({ item }: { item: Job }) => {
    const severity = item.severity || (item.status === 'in_progress' ? 'high' : 'med');
    const badge = severityBadge[severity] || severityBadge.med;
    const isUrg = severity === 'high';
    const isNew = item.status === 'scheduled';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        style={[
          styles.jobCard,
          isUrg && styles.jobCardUrg,
          isNew && !isUrg && styles.jobCardNew,
        ]}
      >
        <View style={styles.jctop}>
          <Text style={styles.jcaddr} numberOfLines={1}>{item.address}</Text>
          <View style={[styles.jcbadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.jcbadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
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
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        <View style={styles.statusBar}>
          <View>
            <Text style={styles.techGreet}>Good morning,</Text>
            <Text style={styles.techname}>Marcus Thompson 🛠️</Text>
          </View>
          <ThemeToggle />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.green }]}>{doneCount}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.yellow }]}>{leftCount}</Text>
            <Text style={styles.statLabel}>Left</Text>
          </View>
        </View>

        {loading && jobs.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading jobs…</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>ASSIGNED JOBS</Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No jobs assigned</Text>
              </View>
            }
          />
        )}
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
    techGreet: { fontSize: 16, color: colors.textSecondary, marginBottom: 2 },
    techname: { fontSize: 21, fontWeight: '700', color: colors.text },
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
    jctop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    jcaddr: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 10 },
    jcbadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 26 },
    jcbadgeText: { fontSize: 14, fontWeight: '600' },
    jccomplaint: { fontSize: 17, color: colors.textSecondary, marginBottom: 10 },
    jcmeta: { flexDirection: 'row', gap: 16 },
    jcmetaText: { fontSize: 14, color: colors.muted },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 31, gap: 13 },
    loadingText: { fontSize: 20, color: colors.textSecondary },
    emptyText: { fontSize: 20, color: colors.textSecondary },
  });
}