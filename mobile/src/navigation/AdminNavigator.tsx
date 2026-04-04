import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { AdminStackParamList, AdminTabParamList } from './types';
import { AdminTicketsScreen } from '../screens/admin/AdminTicketsScreen';
import { AdminSupportChatsScreen } from '../screens/admin/AdminSupportChatsScreen';
import { AdminSupportChatScreen } from '../screens/admin/AdminSupportChatScreen';
import { AdminTechniciansScreen } from '../screens/admin/AdminTechniciansScreen';
import { AdminAccountScreen } from '../screens/admin/AdminAccountScreen';
import { AdminTicketDetailScreen } from '../screens/admin/AdminTicketDetailScreen';
import { TabBarItem, usePortalTabBarScreenOptions } from './portalTabBar';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminTabs() {
  const tabBar = usePortalTabBarScreenOptions();
  return (
    <Tab.Navigator screenOptions={tabBar}>
      <Tab.Screen
        name="AdminTickets"
        component={AdminTicketsScreen}
        options={{
          title: 'Tickets',
          tabBarAccessibilityLabel: 'Support tickets queue',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="🎫" label="Tickets" />,
        }}
      />
      <Tab.Screen
        name="AdminSupportChats"
        component={AdminSupportChatsScreen}
        options={{
          title: 'Chat',
          tabBarAccessibilityLabel: 'Customer support conversations',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="💬" label="Chat" />,
        }}
      />
      <Tab.Screen
        name="AdminTechnicians"
        component={AdminTechniciansScreen}
        options={{
          title: 'Team',
          tabBarAccessibilityLabel: 'Technicians',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="👷" label="Team" />,
        }}
      />
      <Tab.Screen
        name="AdminAccount"
        component={AdminAccountScreen}
        options={{
          title: 'Account',
          tabBarAccessibilityLabel: 'Account and sign out',
          tabBarIcon: ({ focused }) => <TabBarItem focused={focused} emoji="⚙️" label="Account" />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminTicketDetail" component={AdminTicketDetailScreen} />
      <Stack.Screen name="AdminSupportChat" component={AdminSupportChatScreen} />
    </Stack.Navigator>
  );
}
