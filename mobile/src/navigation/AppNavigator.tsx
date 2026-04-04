import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from './types';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { CustomerNavigator } from './CustomerNavigator';
import { AdminNavigator } from './AdminNavigator';
import { TechnicianNavigator } from './TechnicianNavigator';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function AppNavigator() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
        </AuthStack.Navigator>
      ) : user.role === 'customer' ? (
        <CustomerNavigator />
      ) : user.role === 'admin' ? (
        <AdminNavigator />
      ) : (
        <TechnicianNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
