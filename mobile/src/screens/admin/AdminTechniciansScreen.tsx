import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';

export function AdminTechniciansScreen() {
  const { colors } = useTheme();
  const { technicians } = usePortalData();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Technicians</Text>
        <ThemeToggle />
      </View>
      <FlatList
        data={technicians}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.avail, item.available ? styles.availOn : styles.availOff]}>
                <Text style={styles.availText}>{item.available ? 'Available' : 'Busy'}</Text>
              </View>
            </View>
            <Text style={styles.meta}>{item.specialty}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 21, paddingVertical: 14 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    list: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    name: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
    avail: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    availOn: { backgroundColor: colors.greenLight },
    availOff: { backgroundColor: colors.yellowLight },
    availText: { fontSize: 12, fontWeight: '700', color: colors.text },
    meta: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
    phone: { fontSize: 15, color: colors.accent, fontWeight: '600' },
  });
}
