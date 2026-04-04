import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AdminStackParamList, AdminTabParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { usePortalData } from '../../context/PortalDataContext';
import { ThemeColors } from '../../theme';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AccessiblePressable } from '../../components/AccessiblePressable';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList, 'AdminSupportChats'>,
  NativeStackNavigationProp<AdminStackParamList>
>;

export function AdminSupportChatsScreen() {
  const { colors } = useTheme();
  const { getSupportInboxForAdmin } = usePortalData();
  const navigation = useNavigation<Nav>();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inbox = useMemo(() => getSupportInboxForAdmin(), [getSupportInboxForAdmin]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Customer chat</Text>
          <Text style={styles.subtitle}>Same thread customers see under Chat → Admin / support</Text>
        </View>
        <ThemeToggle />
      </View>
      <FlatList
        data={inbox}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No conversations yet. When a customer messages support in their portal, the thread appears here.
          </Text>
        }
        renderItem={({ item }) => (
          <AccessiblePressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('AdminSupportChat', {
                customerEmail: item.customerEmail,
                customerName: item.customerName,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${item.customerName}`}
            accessibilityHint="Opens conversation"
          >
            <Text style={styles.name}>{item.customerName}</Text>
            <Text style={styles.email}>{item.customerEmail}</Text>
            <Text style={styles.preview} numberOfLines={2}>
              {item.lastPreview || 'No messages'}
            </Text>
            <Text style={styles.time}>{new Date(item.updatedAt).toLocaleString()}</Text>
          </AccessiblePressable>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 21,
      paddingVertical: 14,
    },
    titleBlock: { flex: 1, marginRight: 12 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center', color: colors.textSecondary, fontSize: 16, marginTop: 40, paddingHorizontal: 24 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    name: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
    email: { fontSize: 14, color: colors.accent, marginBottom: 8 },
    preview: { fontSize: 15, color: colors.textSecondary, lineHeight: 21 },
    time: { fontSize: 12, color: colors.muted, marginTop: 10 },
  });
}
