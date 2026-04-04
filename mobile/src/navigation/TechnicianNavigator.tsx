import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { TechnicianStackParamList } from './types';
import { JobListScreen } from '../screens/JobListScreen';
import { JobDetailScreen } from '../screens/JobDetailScreen';
import { Viewer3DScreen } from '../screens/Viewer3DScreen';

const Stack = createNativeStackNavigator<TechnicianStackParamList>();

export function TechnicianNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="JobList"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="JobList" component={JobListScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="Viewer3D" component={Viewer3DScreen} />
    </Stack.Navigator>
  );
}
