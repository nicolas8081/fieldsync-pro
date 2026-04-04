import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'orange' | 'green';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** When disabled, skip the faded opacity (e.g. success state that should stay bold). */
  hideDisabledDimming?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  hideDisabledDimming = false,
}: ButtonProps) {
  const { colors, fonts } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: { container: { backgroundColor: colors.accent }, text: { color: '#FFFFFF' } },
    secondary: {
      container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
      text: { color: colors.text },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent },
      text: { color: colors.accent },
    },
    orange: { container: { backgroundColor: colors.accent }, text: { color: '#FFFFFF' } },
    green: { container: { backgroundColor: colors.green }, text: { color: '#FFFFFF' } },
  };

  const v = variantStyles[variant];

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [{ opacity: pressed && !isDisabled ? 0.9 : 1 }]}
    >
      <Animated.View
        style={[
          styles.container,
          v.container,
          disabled && !loading && !hideDisabledDimming && styles.disabled,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text.color as string} accessibilityLabel="Loading" />
        ) : (
          <Text style={[styles.text, { fontFamily: fonts.bold }, v.text, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 26,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  text: { fontSize: 17, fontWeight: 'normal', letterSpacing: 0.2 },
  disabled: { opacity: 0.45 },
});
