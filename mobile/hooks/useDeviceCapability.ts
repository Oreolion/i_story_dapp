// Hook: Device capability detection (mobile replacement for web WebGL check)
import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";
import * as Device from "expo-device";

interface DeviceCapability {
  isLowEndDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  platform: string;
  modelName: string | null;
}

export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>({
    isLowEndDevice: false,
    screenWidth: Dimensions.get("window").width,
    screenHeight: Dimensions.get("window").height,
    pixelRatio: Dimensions.get("window").scale,
    platform: Platform.OS,
    modelName: null,
  });

  useEffect(() => {
    const { width, height, scale } = Dimensions.get("window");
    const totalMemory = Device.totalMemory;
    // Heuristic: devices with < 3GB RAM are low-end
    const isLowEndDevice = totalMemory ? totalMemory < 3 * 1024 * 1024 * 1024 : false;

    setCapability({
      isLowEndDevice,
      screenWidth: width,
      screenHeight: height,
      pixelRatio: Math.min(scale, 3),
      platform: Platform.OS,
      modelName: Device.modelName,
    });

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setCapability((prev) => ({
        ...prev,
        screenWidth: window.width,
        screenHeight: window.height,
      }));
    });

    return () => subscription?.remove();
  }, []);

  return capability;
}
