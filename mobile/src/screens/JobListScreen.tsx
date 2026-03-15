import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchJobs } from '../api/jobs';
import { Job } from '../types/job';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JobList'>;
};

const severityBadge: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: 'rgba(255,71,87,.15)', color: colors.red, label: '🔴 HIGH' },
  med: { bg: 'rgba(255,214,10,.15)', color: colors.yellow, label: '🟡 MED' },
  low: { bg: 'rgba(0,230,118,.15)', color: colors.green, label: '🟢 LOW' },
};

export function JobListScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusBarText}>9:41</Text>
        <Text style={styles.statusBarText}>⚡87%</Text>
      </View>

      <View style={styles.techHeader}>
        <Text style={styles.techGreet}>Good morning,</Text>
        <Text style={styles.techname}>Marcus Thompson 🛠️</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.panel },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.deep,
  },
  statusBarText: { fontSize: 11, color: colors.muted, fontFamily: 'monospace' },
  techHeader: {
    backgroundColor: colors.deep,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  techGreet: { fontSize: 11, color: colors.muted, marginBottom: 2 },
  techname: { fontSize: 16, fontWeight: '700', color: colors.text },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.soft,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statNum: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 10, color: colors.muted },
  sectionLabel: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  list: { padding: 12, paddingBottom: 32 },
  jobCard: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  jobCardUrg: { borderLeftWidth: 3, borderLeftColor: colors.red },
  jobCardNew: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  jctop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  jcaddr: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  jcbadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  jcbadgeText: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
  jccomplaint: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  jcmeta: { flexDirection: 'row', gap: 10 },
  jcmetaText: { fontSize: 10, color: colors.muted, fontFamily: 'monospace' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  loadingText: { fontSize: 14, color: colors.muted },
  emptyText: { fontSize: 15, color: colors.muted },
});
