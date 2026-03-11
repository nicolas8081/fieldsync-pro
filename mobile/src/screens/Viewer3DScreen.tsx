import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Viewer3D'>;

export function Viewer3DScreen({ route, navigation }: Props) {
  const { jobId, modelUrl } = route.params;
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = () => {
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusBarText}>10:12</Text>
        <Text style={styles.statusBarText}>⚡70%</Text>
      </View>

      <View style={styles.viewer}>
        {/* Simple washer silhouette placeholder (prototype style) */}
        <View style={styles.washer}>
          <View style={styles.wbody}>
            <View style={styles.wdoor} />
          </View>
          <View style={styles.highlight} />
          <View style={styles.hlabel}>
            <Text style={styles.hlabelText}>Drum Bearing</Text>
          </View>
        </View>
        <View style={styles.vcontrols}>
          <View style={styles.vctrl}><Text style={styles.vctrlText}>↻ Rotate</Text></View>
          <View style={styles.vctrl}><Text style={styles.vctrlText}>⊕ Zoom</Text></View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.partCard}>
          <Text style={styles.partCardTitle}>🔴 FAULTY PART DETECTED</Text>
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
          />
          <Button
            title="Start Repair →"
            variant="green"
            onPress={() => navigation.goBack()}
            style={styles.actionBtn}
          />
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>Model quality feedback</Text>
          <Text style={styles.sectionSub}>Help us improve: rate the model and add notes.</Text>

          <Text style={styles.label}>Quality (1–5)</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.ratingBtn,
                  n < 5 && styles.ratingBtnMargin,
                  qualityRating === n && styles.ratingBtnOn,
                ]}
                onPress={() => setQualityRating(n)}
              >
                <Text style={[styles.ratingBtnText, qualityRating === n && styles.ratingBtnTextOn]}>
                  {n}
                </Text>
              </TouchableOpacity>
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
          />

          <Button
            title={submitted ? 'Thanks for your feedback' : 'Submit feedback'}
            onPress={submitFeedback}
            disabled={submitted}
            variant="primary"
            style={styles.submitBtn}
          />
          {submitted && (
            <Text style={styles.thanks}>Your feedback helps improve model quality.</Text>
          )}
        </View>
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
  viewer: {
    minHeight: 280,
    backgroundColor: '#0b1829',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  washer: {
    position: 'relative',
    width: 120,
    height: 140,
  },
  wbody: {
    width: 108,
    height: 118,
    backgroundColor: '#1e2a3a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2a3a50',
    position: 'absolute',
    bottom: 0,
    left: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  wdoor: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#2a4060',
    backgroundColor: '#1a3050',
  },
  highlight: {
    position: 'absolute',
    top: 18,
    right: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,71,87,.4)',
    borderWidth: 2,
    borderColor: colors.red,
  },
  hlabel: {
    position: 'absolute',
    top: 12,
    right: 30,
    backgroundColor: colors.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hlabelText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  vcontrols: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  vctrl: {
    backgroundColor: 'rgba(255,255,255,.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  vctrlText: { fontSize: 10, color: colors.text },
  scroll: { flex: 1 },
  content: { padding: 12, paddingBottom: 40 },
  partCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  partCardTitle: { fontSize: 12, color: colors.red, fontWeight: '700', marginBottom: 6 },
  partCardDesc: { fontSize: 11, color: colors.muted, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flex: 1 },
  feedbackSection: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: colors.muted, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', marginBottom: 14 },
  ratingBtn: { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  ratingBtnMargin: { marginRight: 8 },
  ratingBtnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  ratingBtnText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  ratingBtnTextOn: { color: colors.navy },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.soft,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  submitBtn: { marginBottom: 8 },
  thanks: { fontSize: 13, color: colors.green, textAlign: 'center' },
});
