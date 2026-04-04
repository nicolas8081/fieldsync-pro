import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

/** Single tab cell: emoji + label inside one pill, full width of the tab slot for uniform alignment. */
export function TabBarItem({
  focused,
  emoji,
  label,
}: {
  focused: boolean;
  emoji: string;
  label: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={portalTabBarStyles.tabPillOuter}>
      <View
        style={[
          portalTabBarStyles.tabPill,
          focused && {
            backgroundColor: colors.accentLight,
            borderColor: colors.accentBorder,
          },
        ]}
      >
        <Text style={portalTabBarStyles.tabEmoji} allowFontScaling>
          {emoji}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            portalTabBarStyles.tabPillLabel,
            {
              fontFamily: fonts.semibold,
              color: focused ? colors.accent : colors.muted,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/** Shared bottom tab bar options: size, padding, safe area, colors. */
export function usePortalTabBarScreenOptions() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return {
    headerShown: false as const,
    tabBarHideOnKeyboard: true,
    tabBarShowLabel: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    /** Widen icon slot so the pill can span emoji + label (default wrapper is ~31×28). */
    tabBarIconStyle: portalTabBarStyles.tabBarIconSlot,
    tabBarItemStyle: portalTabBarStyles.tabItem,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 8,
      paddingBottom: bottomPad,
      minHeight: 58 + bottomPad,
    },
  };
}

const portalTabBarStyles = StyleSheet.create({
  tabBarIconSlot: {
    width: '100%',
    height: 54,
    marginTop: 0,
  },
  tabItem: {
    flex: 1,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  tabPillOuter: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  tabPill: {
    flex: 1,
    width: '100%',
    minHeight: 50,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
  },
  tabPillLabel: {
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
    letterSpacing: -0.15,
  },
});
