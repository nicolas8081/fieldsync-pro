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
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { fetchJobs } from '../api/jobs';
import { Job } from '../types/job';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JobList'>;
};

const statusColors: Record<Job['status'], string> = {
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#94a3b8',
};

function statusLabel(s: Job['status']) {
  return s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  const renderItem = ({ item }: { item: Job }) => {
    const color = statusColors[item.status];
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <Card style={styles.card} accentColor={color}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: color + '18' }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color }]}>{statusLabel(item.status)}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.customer}>{item.customer}</Text>
          <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          <Text style={styles.date}>
            {new Date(item.scheduledAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Jobs" />
      {loading && jobs.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading jobs…</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  list: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 4 },
  chevron: { fontSize: 22, color: '#cbd5e1', marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#f1f5f9', marginBottom: 10 },
  customer: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 3 },
  address: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  date: { fontSize: 12, color: '#94a3b8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 6 },
  loadingText: { fontSize: 15, color: '#64748b', marginTop: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94a3b8' },
});
