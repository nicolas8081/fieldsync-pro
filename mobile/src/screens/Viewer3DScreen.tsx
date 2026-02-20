import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Viewer3D'>;

export function Viewer3DScreen({ route, navigation }: Props) {
  const { jobId, modelUrl } = route.params;
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = () => {
    // In a real app, POST to backend e.g. POST /api/jobs/:id/model-feedback
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <Header title="3D Model" onBack={() => navigation.goBack()} />

      <View style={styles.viewerPlaceholder}>
        <Text style={styles.placeholderTitle}>3D viewer</Text>
        <Text style={styles.placeholderSub}>Job #{jobId}</Text>
        <Text style={styles.placeholderUrl} numberOfLines={1}>{modelUrl}</Text>
        <Text style={styles.placeholderHint}>
          Use expo-gl + three.js or a WebView to load .glb/.gltf models here.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Model quality feedback</Text>
          <Text style={styles.sectionSub}>
            Help us improve: rate the model and add notes.
          </Text>

          <Text style={styles.label}>Quality (1–5)</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                title={String(n)}
                variant={qualityRating === n ? 'primary' : 'outline'}
                onPress={() => setQualityRating(n)}
                style={n < 5 ? styles.ratingBtnWithMargin : styles.ratingBtn}
              />
            ))}
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Mesh looks correct, textures missing..."
            placeholderTextColor="#94a3b8"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
          />

          <Button
            title={submitted ? 'Thanks for your feedback' : 'Submit feedback'}
            onPress={submitFeedback}
            disabled={submitted}
            style={styles.submitBtn}
          />
          {submitted && (
            <Text style={styles.thanks}>Your feedback helps improve model quality.</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  viewerPlaceholder: {
    height: 220,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: '#475569' },
  placeholderSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  placeholderUrl: { fontSize: 12, color: '#94a3b8', marginTop: 4, maxWidth: '100%' },
  placeholderHint: { fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  sectionSub: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', marginBottom: 16 },
  ratingBtn: { flex: 1, minHeight: 44 },
  ratingBtnWithMargin: { flex: 1, minHeight: 44, marginRight: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: { marginBottom: 8 },
  thanks: { fontSize: 14, color: '#22c55e', textAlign: 'center' },
});
