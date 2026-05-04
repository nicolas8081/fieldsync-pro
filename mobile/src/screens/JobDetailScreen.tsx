import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { TechnicianStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { usePortalData } from '../context/PortalDataContext';
import { ThemeColors } from '../theme';
import { Job } from '../types/job';
import { announceForA11y } from '../utils/a11y';
import { fetchDiagnosis, DiagnosisResult } from '../api/diagnosis';

type Props = NativeStackScreenProps<TechnicianStackParamList, 'JobDetail'>;

type TabId = 'diag' | 'tools' | 'nav';

const JOB_STATUS_OPTIONS: { value: Job['status']; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { colors } = useTheme();
  const { technicianJobs, setTechnicianJobStatus, removeTicketLinkedJob, findTicketForJobId } = usePortalData();
  const job = useMemo(() => technicianJobs.find((j) => j.id === jobId) ?? null, [technicianJobs, jobId]);
  const [tab, setTab] = useState<TabId>('diag');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult[]>([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!job) return;
    const complaint = job.description || job.title;
    if (!complaint) return;

    setDiagLoading(true);
    setDiagError(null);

    fetchDiagnosis(complaint, undefined)
      .then((results) => {
        setDiagnosis(results);
        if (results.length === 0) setDiagError('No matching issues found in database.');
      })
      .catch(() => setDiagError('Could not load diagnosis. Check connection.'))
      .finally(() => setDiagLoading(false));
  }, [job?.id]);

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Header title="Job" onBack={() => navigation.goBack()} right={<ThemeToggle />} />
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Job not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isHigh = job.severity === 'high';
  const linkedTicket = findTicketForJobId(job.id);

  // Collect all affected parts from all diagnosis results
  const allAffectedParts = diagnosis
  .map((d) => d.issue.affected_parts_3d ?? '')
  .filter(Boolean)
  .join('|');

  const applyStatus = (status: Job['status']) => {
    void setTechnicianJobStatus(job.id, status).then(() => {
      const labels: Record<Job['status'], string> = {
        scheduled: 'Marked scheduled',
        in_progress: 'Marked in progress',
        completed: 'Marked completed. Ticket updated for admin.',
        cancelled: 'Marked cancelled',
      };
      announceForA11y(labels[status]);
    });
  };

  const confirmRemoveTicketJob = () => {
    Alert.alert(
      'Remove from your queue?',
      'This unassigns the ticket and sets it back to open in admin so another technician can take it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void removeTicketLinkedJob(job.id).then(() => {
              announceForA11y('Job removed from your queue.');
              navigation.goBack();
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        <View style={styles.jdHeader}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed ? { opacity: 0.82 } : null]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.1)', borderless: true } : undefined}
          >
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
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

        <View style={styles.statusPanel}>
          <Text style={styles.statusPanelLabel}>JOB STATUS</Text>
          <View style={styles.statusChips}>
            {JOB_STATUS_OPTIONS.map((opt) => {
              const on = job.status === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => applyStatus(opt.value)}
                  style={({ pressed }) => [
                    styles.statusChip,
                    on && styles.statusChipOn,
                    pressed ? { opacity: 0.88 } : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Set status to ${opt.label}`}
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.statusChipText, on && styles.statusChipTextOn]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {linkedTicket ? (
            <Text style={styles.statusTicketHint}>
              Linked ticket {linkedTicket.id} · admin sees {linkedTicket.status.replace(/_/g, ' ')}
            </Text>
          ) : (
            <Text style={styles.statusTicketHint}>Demo route job — status is saved on this device only.</Text>
          )}
          {linkedTicket ? (
            <Button
              title="Remove ticket & job"
              variant="outline"
              onPress={confirmRemoveTicketJob}
              style={styles.removeTicketBtn}
              accessibilityHint="Deletes the admin ticket and removes this job from your list"
            />
          ) : null}
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {(['diag', 'tools', 'nav'] as const).map((t) => {
            const label = t === 'diag' ? 'AI Diagnosis' : t === 'tools' ? 'Tools' : 'Navigate';
            return (
              <Pressable
                key={t}
                style={({ pressed }) => [
                  styles.tab,
                  tab === t && styles.tabOn,
                  pressed && tab !== t ? { opacity: 0.88 } : null,
                ]}
                onPress={() => setTab(t)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: tab === t }}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {tab === 'diag' && (
            <>
              <View style={styles.complaintCard}>
                <Text style={styles.complaintCardLabel}>CUSTOMER COMPLAINT</Text>
                <Text style={styles.complaintCardText}>"{job.description || job.title}"</Text>
              </View>

              {diagLoading ? (
                <View style={styles.diagLoading}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.diagLoadingText}>Analyzing complaint…</Text>
                </View>
              ) : diagError ? (
                <View style={styles.diagErrorBox}>
                  <Text style={styles.diagErrorText}>{diagError}</Text>
                </View>
              ) : (
                diagnosis.map((d, i) => {
                  const parts = d.issue.parts_needed
                    ? d.issue.parts_needed.split('|').filter(Boolean)
                    : [];
                  const tools = d.issue.tools_required
                    ? d.issue.tools_required.split('|').filter(Boolean)
                    : [];

                  return (
                    <View key={i} style={styles.diagCard}>
                      <View style={styles.diagHdr}>
                        <Text style={styles.diagIssue}>{d.issue.issue_name}</Text>
                        <Text style={styles.confLabel}>{d.confidence}%</Text>
                      </View>
                      <View style={styles.confBar}>
                        <View style={[styles.confFill, { width: `${d.confidence}%` }]} />
                      </View>

                      <Text style={styles.diagCategory}>
                        {d.issue.category} · {d.issue.diy_difficulty} difficulty
                      </Text>

                      {d.issue.symptoms ? (
                        <Text style={styles.diagSymptoms}>{d.issue.symptoms}</Text>
                      ) : null}

                      {d.errorCode ? (
                        <View style={styles.errorCodeBox}>
                          <Text style={styles.errorCodeLabel}>RELATED ERROR CODE</Text>
                          <Text style={styles.errorCodeVal}>{d.errorCode.code} — {d.errorCode.meaning}</Text>
                          <Text style={styles.errorCodeSeverity}>Severity: {d.errorCode.severity?.toUpperCase()}</Text>
                        </View>
                      ) : null}

                      {parts.length > 0 && (
                        <View style={styles.partsBox}>
                          <Text style={styles.partsBoxTitle}>PARTS NEEDED</Text>
                          <View style={styles.partsTags}>
                            {parts.map((p, j) => (
                              <View key={j} style={styles.ptag}>
                                <Text style={styles.ptagText}>{p}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {tools.length > 0 && (
                        <View style={styles.partsBox}>
                          <Text style={styles.partsBoxTitle}>TOOLS REQUIRED</Text>
                          <View style={styles.partsTags}>
                            {tools.map((t, j) => (
                              <View key={j} style={styles.ptag}>
                                <Text style={styles.ptagText}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {d.issue.estimated_time ? (
                        <Text style={styles.diagTime}>⏱ Est. {d.issue.estimated_time} min</Text>
                      ) : null}

                      {d.issue.possible_causes ? (
                        <Text style={styles.diagWarning}>⚠️ {d.issue.possible_causes}</Text>
                      ) : null}
                    </View>
                  );
                })
              )}

              <Button
                title="🔍 View 3D Model →"
                variant="orange"
                onPress={() =>
                  navigation.navigate('Viewer3D', {
                    jobId: job.id,
                    modelUrl: job.modelUrl ?? '',
                    affectedParts: allAffectedParts,
                  })
                }
                style={styles.view3dBtn}
                accessibilityLabel="View three D model"
                accessibilityHint="Opens the washer GLB in the 3D viewer with highlighted zones"
              />
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
    statusPanel: {
      marginHorizontal: 21,
      marginTop: 14,
      marginBottom: 4,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusPanelLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusChipOn: { backgroundColor: colors.accentLight, borderColor: colors.accent },
    statusChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    statusChipTextOn: { color: colors.accent },
    statusTicketHint: { fontSize: 12, color: colors.muted, marginTop: 10, lineHeight: 17 },
    removeTicketBtn: { marginTop: 12 },
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
    diagLoading: { alignItems: 'center', gap: 12, paddingVertical: 32 },
    diagLoadingText: { fontSize: 15, color: colors.textSecondary },
    diagErrorBox: {
      backgroundColor: colors.redLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    diagErrorText: { fontSize: 15, color: colors.red },
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
    diagIssue: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    confLabel: { fontSize: 16, color: colors.accent, fontWeight: '600' },
    confBar: { height: 7, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    confFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
    diagCategory: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    diagSymptoms: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
    diagTime: { fontSize: 14, color: colors.textSecondary, marginTop: 10 },
    diagWarning: { fontSize: 13, color: colors.yellow, marginTop: 8, lineHeight: 18 },
    errorCodeBox: {
      backgroundColor: colors.redLight,
      borderWidth: 1,
      borderColor: colors.red,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
    },
    errorCodeLabel: { fontSize: 11, fontWeight: '700', color: colors.red, marginBottom: 4 },
    errorCodeVal: { fontSize: 14, color: colors.text, fontWeight: '600' },
    errorCodeSeverity: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
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