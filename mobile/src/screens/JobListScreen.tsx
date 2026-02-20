import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
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

  const renderItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
          </View>
        </View>
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

  return (
    <View style={styles.container}>
      <Header title="Jobs" />
      {loading && jobs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading jobs…</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No jobs found</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  customer: { fontSize: 14, color: '#475569', marginBottom: 2 },
  address: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  date: { fontSize: 12, color: '#94a3b8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 16, color: '#64748b' },
  emptyText: { fontSize: 16, color: '#94a3b8' },
});
