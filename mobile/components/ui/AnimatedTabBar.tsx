import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { GRADIENTS, GLASS, ANIMATION } from "./theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorX = useSharedValue(0);

  const tabCount = state.routes.length;
  const recordIndex = state.routes.findIndex((r) => r.name === "record");

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const containerStyle = {
    flexDirection: "row" as const,
    paddingBottom: Math.max(insets.bottom, 8),
    paddingTop: 8,
    paddingHorizontal: 8,
  };

  const bgContent = (
    <View style={containerStyle}>
      {/* Sliding indicator */}
      <Animated.View
        style={[
          indicatorStyle,
          {
            position: "absolute",
            top: 0,
            left: 0,
            height: 3,
            borderRadius: 1.5,
            overflow: "hidden",
          },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS.tabIndicator}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 40, height: 3 }}
        />
      </Animated.View>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        const isRecord = index === recordIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLayout = (e: { nativeEvent: { layout: { x: number; width: number } } }) => {
          if (isFocused) {
            const { x, width } = e.nativeEvent.layout;
            indicatorX.value = withSpring(x + width / 2 - 20, {
              damping: ANIMATION.springConfig.damping,
              stiffness: ANIMATION.springConfig.stiffness,
            });
          }
        };

        // Update indicator when focus changes
        React.useEffect(() => {
          // We re-run when isFocused changes; the next onLayout after a re-render
          // isn't reliable, so we manually set it if we tracked the position.
        }, [isFocused]);

        const iconColor = isFocused ? "#a78bfa" : "#64748b";
        const tabBarIcon = options.tabBarIcon;

        if (isRecord) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLayout={onLayout}
              activeOpacity={0.8}
              style={{
                flex: 1,
                alignItems: "center",
                marginTop: -16,
              }}
            >
              <LinearGradient
                colors={GRADIENTS.recording}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#7c3aed",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {tabBarIcon?.({ color: "#fff", size: 24, focused: isFocused })}
              </LinearGradient>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  marginTop: 4,
                  color: isFocused ? "#a78bfa" : "#64748b",
                }}
              >
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              if (isFocused) {
                indicatorX.value = withSpring(x + width / 2 - 20, {
                  damping: ANIMATION.springConfig.damping,
                  stiffness: ANIMATION.springConfig.stiffness,
                });
              }
            }}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 4,
            }}
          >
            {tabBarIcon?.({ color: iconColor, size: 22, focused: isFocused })}
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                marginTop: 4,
                color: isFocused ? "#a78bfa" : "#64748b",
              }}
            >
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // BlurView for native, fallback for web
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          borderTopWidth: 1,
          borderTopColor: GLASS.light.border,
        }}
      >
        {bgContent}
      </View>
    );
  }

  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={{
        borderTopWidth: 1,
        borderTopColor: GLASS.light.border,
      }}
    >
      {bgContent}
    </BlurView>
  );
}
