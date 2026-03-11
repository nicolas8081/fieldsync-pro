import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { fetchJobById, getDiagnosisForJob } from '../api/jobs';
import { Job } from '../types/job';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

type TabId = 'diag' | 'tools' | 'nav';

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('diag');

  useEffect(() => {
    let cancelled = false;
    fetchJobById(jobId).then((data) => {
      if (!cancelled) setJob(data ?? null);
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

  const diagnosis = getDiagnosisForJob(jobId);
  const isHigh = job.severity === 'high';

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusBarText}>10:08</Text>
        <Text style={styles.statusBarText}>⚡71%</Text>
      </View>

      <View style={styles.jdHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.jdHeaderCenter}>
          <Text style={styles.jdAddress} numberOfLines={1}>{job.address} · {job.customer}</Text>
          <Text style={styles.jdSub} numberOfLines={1}>{job.description || job.title}</Text>
        </View>
        <View style={[styles.badgeHigh, isHigh && { backgroundColor: 'rgba(255,71,87,.15)' }]}>
          <Text style={[styles.badgeHighText, isHigh && { color: colors.red }]}>
            {isHigh ? '🔴 HIGH' : '🟡 MED'}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['diag', 'tools', 'nav'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabOn]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
              {t === 'diag' ? 'AI Diagnosis' : t === 'tools' ? 'Tools' : 'Navigate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'diag' && (
          <>
            <Text style={styles.complaintLabel}>
              Complaint: <Text style={styles.complaintQuote}>"{job.description || job.title}"</Text>
            </Text>
            {diagnosis.map((d, i) => (
              <View key={i} style={styles.diagCard}>
                <View style={styles.diagHdr}>
                  <Text style={styles.diagIssue}>{d.issue}</Text>
                  <Text style={styles.confLabel}>{d.confidence}%</Text>
                </View>
                <View style={styles.confBar}>
                  <View style={[styles.confFill, { width: `${d.confidence}%` }]} />
                </View>
                {d.parts && d.parts.length > 0 && (
                  <View style={styles.partsBox}>
                    <Text style={styles.partsBoxTitle}>PARTS NEEDED</Text>
                    <View style={styles.partsTags}>
                      {d.parts.map((p, j) => (
                        <View key={j} style={styles.ptag}>
                          <Text style={styles.ptagText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
            {job.modelUrl && (
              <Button
                title="🔍 View 3D Model →"
                variant="orange"
                onPress={() => navigation.navigate('Viewer3D', { jobId: job.id, modelUrl: job.modelUrl! })}
                style={styles.view3dBtn}
              />
            )}
          </>
        )}

        {tab === 'tools' && (
          <>
            <Text style={styles.complaintLabel}>Tools to bring for this job:</Text>
            <View style={styles.toolChips}>
              <View style={styles.toolChip}><Text style={styles.toolChipText}>🔧 Socket Set</Text></View>
              <View style={styles.toolChip}><Text style={styles.toolChipText}>🔩 Torx T20</Text></View>
              <View style={styles.toolChip}><Text style={styles.toolChipText}>🪛 Flathead</Text></View>
              <View style={styles.toolChip}><Text style={styles.toolChipText}>🔦 Flashlight</Text></View>
              <View style={styles.toolChip}><Text style={styles.toolChipText}>🧤 Gloves</Text></View>
            </View>
            <View style={styles.partsBox}>
              <Text style={styles.partsBoxTitle}>PARTS TO BRING</Text>
              <View style={styles.partsTags}>
                <View style={styles.ptag}><Text style={styles.ptagText}>DC97-16151A Bearing</Text></View>
                <View style={styles.ptag}><Text style={styles.ptagText}>DC64-00802A Seal</Text></View>
                <View style={styles.ptag}><Text style={styles.ptagText}>Grease Kit</Text></View>
              </View>
            </View>
            <View style={styles.vanConfirm}>
              <Text style={styles.vanConfirmText}>✅ All parts confirmed in van inventory</Text>
            </View>
          </>
        )}

        {tab === 'nav' && (
          <>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>📍 Map View · {job.address}</Text>
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navAddress}>{job.address}</Text>
              <Text style={styles.navMeta}>3.2 miles · Est. 8 min drive</Text>
            </View>
            <Button title="🗺️ Open in Maps" onPress={() => {}} style={styles.navBtn} />
          </>
        )}
      </ScrollView>
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
  statusBarText: { fontSize: 11, color: colors.muted },
  jdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.deep,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: colors.muted, fontWeight: '600' },
  jdHeaderCenter: { flex: 1, minWidth: 0 },
  jdAddress: { fontSize: 13, fontWeight: '600', color: colors.text },
  jdSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  badgeHigh: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeHighText: { fontSize: 10, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.soft,
    borderRadius: 10,
    margin: 10,
    marginBottom: 0,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabOn: { backgroundColor: colors.orange },
  tabText: { fontSize: 11, color: colors.muted, fontWeight: '500' },
  tabTextOn: { color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 12, paddingBottom: 40 },
  complaintLabel: { fontSize: 11, color: colors.muted, marginBottom: 10 },
  complaintQuote: { fontStyle: 'italic', color: colors.text },
  diagCard: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 11,
    marginBottom: 9,
  },
  diagHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  diagIssue: { fontSize: 13, fontWeight: '600', color: colors.text },
  confLabel: { fontSize: 11, color: colors.accent },
  confBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  confFill: { height: '100%', borderRadius: 2, backgroundColor: colors.accent },
  partsBox: {
    backgroundColor: 'rgba(255,107,53,.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,.2)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  partsBoxTitle: { fontSize: 11, color: colors.orange, marginBottom: 6 },
  partsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ptag: {
    backgroundColor: 'rgba(255,107,53,.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ptagText: { fontSize: 11, color: colors.orange },
  view3dBtn: { marginTop: 8 },
  toolChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  toolChip: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toolChipText: { fontSize: 11, color: colors.text },
  vanConfirm: {
    backgroundColor: 'rgba(0,212,255,.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,.15)',
    borderRadius: 9,
    padding: 10,
    marginTop: 10,
  },
  vanConfirmText: { fontSize: 11, color: colors.muted },
  mapPlaceholder: {
    height: 110,
    backgroundColor: colors.soft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mapPlaceholderText: { fontSize: 12, color: colors.muted },
  navInfo: { marginBottom: 12 },
  navAddress: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 4 },
  navMeta: { fontSize: 11, color: colors.muted },
  navBtn: { marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 15, color: colors.muted },
});
