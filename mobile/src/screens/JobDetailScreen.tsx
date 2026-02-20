import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { fetchJobById } from '../api/jobs';
import { Job } from '../types/job';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

const statusColors: Record<Job['status'], string> = {
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#94a3b8',
};

function statusLabel(s: Job['status']) {
  return s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchJobById(jobId).then((data) => {
      if (!cancelled) {
        setJob(data ?? null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [jobId]);

  if (loading || !job) {
    return (
      <View style={styles.container}>
        <Header title="Job" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{loading ? 'Loading…' : 'Job not found'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={job.title} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusColors[job.status] }]}>
              <Text style={styles.badgeText}>{statusLabel(job.status)}</Text>
            </View>
          </View>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{job.customer}</Text>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{job.address}</Text>
          <Text style={styles.label}>Scheduled</Text>
          <Text style={styles.value}>
            {new Date(job.scheduledAt).toLocaleString(undefined, {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </Text>
          {job.description ? (
            <>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{job.description}</Text>
            </>
          ) : null}
        </Card>

        {job.modelUrl ? (
          <Button
            title="Open 3D model"
            onPress={() => navigation.navigate('Viewer3D', { jobId: job.id, modelUrl: job.modelUrl! })}
            style={styles.button}
          />
        ) : (
          <Card>
            <Text style={styles.noModel}>No 3D model linked to this job.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 16, color: '#64748b' },
  badgeRow: { marginBottom: 12 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  label: { fontSize: 12, color: '#64748b', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#0f172a' },
  button: { marginTop: 16 },
  noModel: { color: '#64748b', fontSize: 15 },
});
