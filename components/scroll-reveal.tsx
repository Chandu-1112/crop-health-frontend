import React, { useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

type ScrollRevealProps = {
  scrollY: Animated.Value;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Keeps cards subtle while they move into and out of the viewport.
 * The native driver handles the scroll-linked opacity and translation.
 */
export function ScrollReveal({ scrollY, children, style }: ScrollRevealProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [layout, setLayout] = useState<{ y: number; height: number } | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setLayout((current) =>
      current && current.y === y && current.height === height
        ? current
        : { y, height },
    );
  };

  const viewportHeight = Math.max(windowHeight, 1);
  const animationStyle = layout
    ? {
        opacity: scrollY.interpolate({
          inputRange: [
            layout.y - viewportHeight,
            layout.y - viewportHeight * 0.72,
            layout.y + layout.height * 0.55,
            layout.y + layout.height,
          ],
          outputRange: [0, 1, 1, 0],
          extrapolate: "clamp" as const,
        }),
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [
                layout.y - viewportHeight,
                layout.y - viewportHeight * 0.72,
                layout.y + layout.height,
              ],
              outputRange: [14, 0, -8],
              extrapolate: "clamp" as const,
            }),
          },
        ],
      }
    : styles.hidden;

  return (
    <Animated.View onLayout={handleLayout} style={[style, animationStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
    transform: [{ translateY: 14 }],
  },
});
