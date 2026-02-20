import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobListScreen } from '../screens/JobListScreen';
import { JobDetailScreen } from '../screens/JobDetailScreen';
import { Viewer3DScreen } from '../screens/Viewer3DScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="JobList"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f1f5f9' },
        }}
      >
        <Stack.Screen name="JobList" component={JobListScreen} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} />
        <Stack.Screen name="Viewer3D" component={Viewer3DScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
