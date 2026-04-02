import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { fetchJobById, getDiagnosisForJob } from '../api/jobs';
import { Job } from '../types/job';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

type TabId = 'diag' | 'tools' | 'nav';

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { colors } = useTheme();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('diag');

  const styles = useMemo(() => createStyles(colors), [colors]);

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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Header title="Job" onBack={() => navigation.goBack()} right={<ThemeToggle />} />
          <View style={styles.centered}>
            <Text style={styles.loadingText}>{loading ? 'Loading…' : 'Job not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const diagnosis = getDiagnosisForJob(jobId);
  const isHigh = job.severity === 'high';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        <View style={styles.jdHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.jdHeaderCenter}>
            <Text style={styles.jdAddress} numberOfLines={1}>{job.address} · {job.customer}</Text>
            <Text style={styles.jdSub} numberOfLines={1}>{job.description || job.title}</Text>
          </View>
          <View style={styles.jdHeaderRight}>
            <View style={[styles.badgeHigh, isHigh ? { backgroundColor: colors.redLight } : { backgroundColor: colors.yellowLight }]}>
              <Text style={[styles.badgeHighText, isHigh ? { color: colors.red } : { color: colors.yellow }]}>
                {isHigh ? 'HIGH' : 'MED'}
              </Text>
            </View>
            <ThemeToggle />
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
              <View style={styles.complaintCard}>
                <Text style={styles.complaintCardLabel}>CUSTOMER COMPLAINT</Text>
                <Text style={styles.complaintCardText}>"{job.description || job.title}"</Text>
              </View>
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
              <View style={styles.complaintCard}>
                <Text style={styles.complaintCardLabel}>CUSTOMER COMPLAINT</Text>
                <Text style={styles.complaintCardText}>"{job.description || job.title}"</Text>
              </View>
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
              <View style={styles.complaintCard}>
                <Text style={styles.complaintCardLabel}>CUSTOMER COMPLAINT</Text>
                <Text style={styles.complaintCardText}>"{job.description || job.title}"</Text>
              </View>
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
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    jdHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: 21,
      paddingVertical: 18,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnText: { fontSize: 26, color: colors.accent, fontWeight: '600' },
    jdHeaderCenter: { flex: 1, minWidth: 0 },
    jdHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    jdAddress: { fontSize: 18, fontWeight: '600', color: colors.text },
    jdSub: { fontSize: 16, color: colors.textSecondary, marginTop: 3 },
    badgeHigh: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 26 },
    badgeHighText: { fontSize: 14, fontWeight: '700' },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      margin: 21,
      marginBottom: 0,
      padding: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 13 },
    tabOn: { backgroundColor: colors.accent },
    tabText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
    tabTextOn: { color: '#FFFFFF', fontWeight: '700' },
    scroll: { flex: 1 },
    content: { padding: 21, paddingBottom: 52 },
    complaintCard: {
      backgroundColor: colors.accentLight,
      borderWidth: 2,
      borderColor: colors.accentBorder,
      borderRadius: 16,
      padding: 18,
      marginBottom: 21,
    },
    complaintCardLabel: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    complaintCardText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 28,
    },
    complaintLabel: { fontSize: 16, color: colors.textSecondary, marginBottom: 13 },
    diagCard: {
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
    diagHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    diagIssue: { fontSize: 18, fontWeight: '600', color: colors.text },
    confLabel: { fontSize: 16, color: colors.accent, fontWeight: '600' },
    confBar: { height: 7, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
    confFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
    partsBox: {
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: 16,
      padding: 16,
      marginTop: 13,
    },
    partsBoxTitle: { fontSize: 14, color: colors.accent, fontWeight: '700', marginBottom: 10 },
    partsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    ptag: {
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 26,
    },
    ptagText: { fontSize: 16, color: colors.accent, fontWeight: '600' },
    view3dBtn: { marginTop: 16 },
    toolChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
    toolChip: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 26,
    },
    toolChipText: { fontSize: 16, color: colors.text },
    vanConfirm: {
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
    },
    vanConfirmText: { fontSize: 16, color: colors.textSecondary },
    mapPlaceholder: {
      height: 156,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    mapPlaceholderText: { fontSize: 17, color: colors.textSecondary },
    navInfo: { marginBottom: 16 },
    navAddress: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 5 },
    navMeta: { fontSize: 16, color: colors.textSecondary },
    navBtn: { marginTop: 10 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 31 },
    loadingText: { fontSize: 20, color: colors.textSecondary },
  });
}