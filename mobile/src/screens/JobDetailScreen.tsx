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

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
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
    return () => {
      cancelled = true;
    };
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

  const color = statusColors[job.status];
  const rows: { label: string; value: string }[] = [
    { label: 'Customer', value: job.customer },
    { label: 'Address', value: job.address },
    {
      label: 'Scheduled',
      value: new Date(job.scheduledAt).toLocaleString(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
    },
    ...(job.description ? [{ label: 'Description', value: job.description }] : []),
  ];

  return (
    <View style={styles.container}>
      <Header title={job.title} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <View style={[styles.statusBanner, { backgroundColor: color + '14', borderColor: color + '40' }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>{statusLabel(job.status)}</Text>
        </View>

        <Card>
          {rows.map((row, i) => (
            <InfoRow key={row.label} label={row.label} value={row.value} last={i === rows.length - 1} />
          ))}
        </Card>

        {job.modelUrl ? (
          <Button
            title="Open 3D Model"
            onPress={() => navigation.navigate('Viewer3D', { jobId: job.id, modelUrl: job.modelUrl! })}
            style={styles.button}
          />
        ) : (
          <Card style={styles.noModelCard}>
            <Text style={styles.noModelText}>No 3D model linked to this job.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 16, color: '#64748b' },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '700' },

  infoRow: {
    paddingVertical: 13,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: { fontSize: 15, color: '#0f172a', lineHeight: 22 },

  button: { marginTop: 4 },
  noModelCard: { alignItems: 'center', paddingVertical: 20 },
  noModelText: { color: '#94a3b8', fontSize: 14 },
});
