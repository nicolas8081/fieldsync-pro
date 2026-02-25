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

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: '#2563eb' },
    text: { color: '#fff' },
  },
  secondary: {
    container: { backgroundColor: '#64748b' },
    text: { color: '#fff' },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#2563eb' },
    text: { color: '#2563eb' },
  },
  danger: {
    container: { backgroundColor: '#ef4444' },
    text: { color: '#fff' },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const v = variantStyles[variant];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.container,
          v.container,
          disabled && styles.disabled,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text.color as string} />
        ) : (
          <Text style={[styles.text, v.text, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  disabled: {
    opacity: 0.45,
  },
});
