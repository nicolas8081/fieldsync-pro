import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { CustomerHomeStackParamList, CustomerTabParamList } from './types';
import { CustomerHomeScreen } from '../screens/customer/CustomerHomeScreen';
import { ReportProblemScreen } from '../screens/customer/ReportProblemScreen';
import { CustomerTicketsScreen } from '../screens/customer/CustomerTicketsScreen';
import { CustomerChatScreen } from '../screens/customer/CustomerChatScreen';
import { TabBarItem, usePortalTabBarScreenOptions } from './portalTabBar';

const Stack = createNativeStackNavigator<CustomerHomeStackParamList>();
const Tab = createBottomTabNavigator<CustomerTabParamList>();

function CustomerHomeStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
    </Stack.Navigator>
  );
}

export function CustomerNavigator() {
  const tabBar = usePortalTabBarScreenOptions();
  return (
    <Tab.Navigator screenOptions={tabBar}>
      <Tab.Screen
        name="CustomerHomeStack"
        component={CustomerHomeStack}
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home, report a problem',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="🏠" label="Home" />,
        }}
      />
      <Tab.Screen
        name="CustomerTickets"
        component={CustomerTicketsScreen}
        options={{
          title: 'Tickets',
          tabBarAccessibilityLabel: 'My support tickets',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="📋" label="Tickets" />,
        }}
      />
      <Tab.Screen
        name="CustomerChat"
        component={CustomerChatScreen}
        options={{
          title: 'Chat',
          tabBarAccessibilityLabel: 'Chat with support or AI',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="💬" label="Chat" />,
        }}
      />
    </Tab.Navigator>
  );
}
