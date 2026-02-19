import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "e-Story",
  slug: "estory-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0f172a",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.estory.mobile",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "e-Story needs microphone access to record voice journals.",
      NSSpeechRecognitionUsageDescription:
        "e-Story uses speech recognition to transcribe your stories.",
      NSCameraUsageDescription:
        "e-Story needs camera access to update your profile photo.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0f172a",
    },
    package: "com.estory.mobile",
    permissions: [
      "RECORD_AUDIO",
      "CAMERA",
      "POST_NOTIFICATIONS",
      "VIBRATE",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  scheme: "estory",
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#7c3aed",
      },
    ],
    [
      "expo-av",
      {
        microphonePermission:
          "Allow e-Story to access your microphone for voice recording.",
      },
    ],
  ],
  extra: {
    API_BASE_URL: process.env.API_BASE_URL || "https://istory.vercel.app",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID || "",
    GOOGLE_CLIENT_ID_IOS: process.env.GOOGLE_CLIENT_ID_IOS || "",
    GOOGLE_CLIENT_ID_ANDROID: process.env.GOOGLE_CLIENT_ID_ANDROID || "",
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "",
    },
  },
});
