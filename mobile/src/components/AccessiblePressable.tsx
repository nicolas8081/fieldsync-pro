import React, { ReactNode } from 'react';
import {
  Pressable,
  PressableProps,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

export type AccessiblePressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Opacity when pressed; on web, also applies while hovered. */
  pressedOpacity?: number;
  children: ReactNode;
};

/**
 * Pressable with visible press/hover feedback, optional Android ripple, and forwarded a11y props.
 */
export function AccessiblePressable({
  style,
  pressedOpacity = 0.82,
  disabled,
  android_ripple,
  children,
  ...rest
}: AccessiblePressableProps) {
  const ripple =
    android_ripple ??
    (Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.14)', borderless: false } : undefined);

  return (
    <Pressable
      disabled={disabled}
      android_ripple={ripple}
      {...rest}
      style={(state) => {
        const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
        const interact = state.pressed && !disabled;
        return [flat, interact ? { opacity: pressedOpacity } : null];
      }}
    >
      {children}
    </Pressable>
  );
}
