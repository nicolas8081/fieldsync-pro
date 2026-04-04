import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { WasherViewer } from '../components/WasherViewer';
import { TechnicianStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme';
import { announceForA11y } from '../utils/a11y';

type Props = NativeStackScreenProps<TechnicianStackParamList, 'Viewer3D'>;

export function Viewer3DScreen({ route, navigation }: Props) {
  const { modelUrl } = route.params;
  const { colors } = useTheme();
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const submitFeedback = async () => {
    if (submitted || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      setSubmitted(true);
      announceForA11y('Feedback submitted. Thank you.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed ? { opacity: 0.82 } : null]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            android_ripple={
              Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.12)', borderless: true } : undefined
            }
          >
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>3D Viewer</Text>
          <ThemeToggle />
        </View>

        <View style={styles.viewer}>
          <WasherViewer modelUrl={modelUrl} />
          <View style={styles.vcontrols}>
            <View style={styles.vctrl}><Text style={styles.vctrlText}>↻ Drag to Rotate</Text></View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.partCard}>
            <Text style={styles.partCardTitle}>Faulty part detected</Text>
            <Text style={styles.partCardDesc}>
              Drum Bearing · #DC97-16151A{'\n'}
              Location: rear drum shaft, back panel access{'\n'}
              Est. replacement: 45–90 min
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Button
              title="← Back"
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={styles.actionBtn}
              accessibilityHint="Returns to job details"
            />
            <Button
              title="Start Repair →"
              variant="green"
              onPress={() => navigation.goBack()}
              style={styles.actionBtn}
              accessibilityHint="Marks that you are starting the repair and returns to jobs"
            />
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Model quality feedback</Text>
            <Text style={styles.sectionSub}>Help us improve: rate the model and add notes.</Text>

            <Text style={styles.label}>Quality (1–5)</Text>
            <View style={styles.ratingRow} accessibilityLabel="Rate model quality from 1 to 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  style={({ pressed }) => [
                    styles.ratingBtn,
                    n < 5 && styles.ratingBtnMargin,
                    qualityRating === n && styles.ratingBtnOn,
                    pressed && qualityRating !== n ? { opacity: 0.88 } : null,
                  ]}
                  onPress={() => {
                    setQualityRating(n);
                    announceForA11y(`Quality rating ${n} of 5`);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} out of 5 stars`}
                  accessibilityState={{ selected: qualityRating === n }}
                >
                  <Text style={[styles.ratingBtnText, qualityRating === n && styles.ratingBtnTextOn]}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mesh looks correct, textures missing..."
              placeholderTextColor={colors.muted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
              accessibilityLabel="Feedback notes"
              editable={!submitted && !feedbackSubmitting}
            />

            <Button
              title={submitted ? 'Thanks for your feedback' : 'Submit feedback'}
              onPress={submitFeedback}
              disabled={submitted || feedbackSubmitting}
              loading={feedbackSubmitting}
              variant="primary"
              style={styles.submitBtn}
              accessibilityHint="Sends your rating and notes"
            />
            {submitted && (
              <Text style={styles.thanks}>Your feedback helps improve model quality.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 21,
      paddingVertical: 13,
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
    topBarTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    viewer: {
      height: 320,
      backgroundColor: colors.borderStrong,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    vcontrols: {
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    vctrl: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      paddingVertical: 8,
      paddingHorizontal: 16,
      opacity: 0.85,
    },
    vctrlText: { fontSize: 14, color: colors.text },
    scroll: { flex: 1 },
    content: { padding: 21, paddingBottom: 52 },
    partCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.red,
      borderRadius: 18,
      padding: 18,
      marginBottom: 21,
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    partCardTitle: { fontSize: 17, color: colors.red, fontWeight: '700', marginBottom: 10 },
    partCardDesc: { fontSize: 16, color: colors.textSecondary, lineHeight: 26 },
    actionRow: { flexDirection: 'row', gap: 13, marginBottom: 26 },
    actionBtn: { flex: 1 },
    feedbackSection: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 23,
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: { fontSize: 21, fontWeight: '700', color: colors.text },
    sectionSub: { fontSize: 17, color: colors.textSecondary, marginTop: 5, marginBottom: 18 },
    label: { fontSize: 17, fontWeight: '600', color: colors.textSecondary, marginBottom: 10 },
    ratingRow: { flexDirection: 'row', marginBottom: 18 },
    ratingBtn: {
      flex: 1,
      minHeight: 60,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingBtnMargin: { marginRight: 10 },
    ratingBtnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    ratingBtnText: { fontSize: 20, fontWeight: '700', color: colors.textSecondary },
    ratingBtnTextOn: { color: '#FFFFFF' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      fontSize: 18,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 114,
      textAlignVertical: 'top',
      marginBottom: 18,
    },
    submitBtn: { marginBottom: 10 },
    thanks: { fontSize: 17, color: colors.green, textAlign: 'center' },
  });
}