import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Viewer3D'>;

export function Viewer3DScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const submitFeedback = () => {
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusBarText}>10:12</Text>
        <View style={styles.statusBarRight}>
          <ThemeToggle />
          <Text style={styles.statusBarText}>⚡70%</Text>
        </View>
      </View>

      <View style={styles.viewer}>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 13,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statusBarRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    statusBarText: { fontSize: 16, color: colors.textSecondary },
    viewer: {
      minHeight: 364,
      backgroundColor: colors.borderStrong,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 31,
    },
    washer: { position: 'relative', width: 156, height: 182 },
    wbody: {
      width: 140,
      height: 153,
      backgroundColor: colors.muted,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      position: 'absolute',
      bottom: 0,
      left: 8,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 31,
    },
    wdoor: {
      width: 73,
      height: 73,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      backgroundColor: colors.navy,
    },
    highlight: {
      position: 'absolute',
      top: 23,
      right: 16,
      width: 21,
      height: 21,
      borderRadius: 10,
      backgroundColor: colors.redLight,
      borderWidth: 2,
      borderColor: colors.red,
    },
    hlabel: {
      position: 'absolute',
      top: 16,
      right: 39,
      backgroundColor: colors.red,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    hlabelText: { fontSize: 13, color: '#fff', fontWeight: '600' },
    vcontrols: {
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
    },
    vctrl: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      paddingVertical: 10,
      paddingHorizontal: 16,
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
