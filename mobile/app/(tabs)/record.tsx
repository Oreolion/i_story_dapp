// Record Screen - Audio capture, transcription, enhancement, save
// Migrated from old Animated API to react-native-reanimated
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Mic, Square, Play, Pause, Sparkles, Save, Eye, EyeOff } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { api, apiUpload } from "../../lib/api";
import {
  GlassCard,
  GradientButton,
  Badge,
  AnimatedListItem,
  GRADIENTS,
} from "../../components/ui";

type RecordingStep = "idle" | "recording" | "recorded" | "transcribing" | "enhancing" | "saving";

const MOODS = [
  "peaceful", "inspiring", "adventurous", "nostalgic",
  "thoughtful", "exciting", "neutral",
];

export default function RecordScreen() {
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<RecordingStep>("idle");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [enhancedText, setEnhancedText] = useState("");
  const [title, setTitle] = useState("");
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reanimated pulse animations
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (step === "recording") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.4, { duration: 300 });
    }
  }, [step]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" }}>
        <GlassCard intensity="medium" style={{ padding: 32, alignItems: "center", marginHorizontal: 24 }}>
          <Mic size={48} color="#64748b" />
          <Text style={{ marginTop: 16, fontSize: 17, color: "#94a3b8" }}>Sign in to record</Text>
          <View style={{ marginTop: 16 }}>
            <GradientButton
              onPress={() => router.push("/auth/login")}
              title="Sign In"
              gradient={GRADIENTS.primary}
            />
          </View>
        </GlassCard>
      </SafeAreaView>
    );
  }

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Microphone access is needed to record.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setStep("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("[Record] Start failed:", err);
      Toast.show({ type: "error", text1: "Recording failed to start" });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setStep("recorded");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (err) {
      console.error("[Record] Stop failed:", err);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error("[Record] Play failed:", err);
    }
  };

  const transcribe = async () => {
    if (!recordingUri) return;
    setStep("transcribing");
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: recordingUri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as unknown as Blob);

      const res = await apiUpload<{ text: string }>("/api/ai/transcribe", formData);
      if (res.ok && res.data?.text) {
        setTranscript(res.data.text);
        setStep("recorded");
        Toast.show({ type: "success", text1: "Transcription complete!" });
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error("[Record] Transcribe failed:", err);
      Toast.show({ type: "error", text1: "Transcription failed" });
      setStep("recorded");
    }
  };

  const enhance = async () => {
    if (!transcript) return;
    setStep("enhancing");
    try {
      const res = await api<{ text: string }>("/api/ai/enhance", {
        method: "POST",
        body: { text: transcript },
      });
      if (res.ok && res.data?.text) {
        setEnhancedText(res.data.text);
        setStep("recorded");
        Toast.show({ type: "success", text1: "Story enhanced!" });
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error("[Record] Enhance failed:", err);
      Toast.show({ type: "error", text1: "Enhancement failed" });
      setStep("recorded");
    }
  };

  const saveStory = async () => {
    const content = enhancedText || transcript;
    if (!content || !title) {
      Toast.show({ type: "error", text1: "Title and content are required" });
      return;
    }
    setStep("saving");
    try {
      const res = await api("/api/journal/save", {
        method: "POST",
        body: {
          title,
          content,
          mood: selectedMood,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          hasAudio: !!recordingUri,
          is_public: isPublic,
        },
      });

      if (res.ok) {
        Toast.show({ type: "success", text1: "Story saved!" });
        setStep("idle");
        setRecordingUri(null);
        setTranscript("");
        setEnhancedText("");
        setTitle("");
        setTags("");
        router.push("/library");
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error("[Record] Save failed:", err);
      Toast.show({ type: "error", text1: "Failed to save story" });
      setStep("recorded");
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
        <AnimatedListItem index={0}>
          <Text style={{ paddingVertical: 24, fontSize: 24, fontWeight: "700", color: "#fff" }}>
            Record Story
          </Text>
        </AnimatedListItem>

        {/* Recording Controls */}
        <AnimatedListItem index={1}>
          <GlassCard intensity="medium" style={{ padding: 32, alignItems: "center" }}>
            {/* Recording Status Badge */}
            {step === "recording" && (
              <View style={{ marginBottom: 12 }}>
                <Badge text="Recording" variant="error" />
              </View>
            )}

            <Text style={{ marginBottom: 24, fontSize: 40, color: "#fff", fontVariant: ["tabular-nums"] }}>
              {formatTime(duration)}
            </Text>

            {step === "idle" && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startRecording();
                }}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    shadowColor: "#0b5ed7",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 12,
                  }}
                >
                  <LinearGradient
                    colors={GRADIENTS.recording}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 128,
                      height: 128,
                      borderRadius: 64,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Mic size={40} color="#fff" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            )}

            {step === "recording" && (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                {/* Double pulse rings */}
                <Animated.View
                  style={[
                    pulseRingStyle,
                    {
                      position: "absolute",
                      width: 152,
                      height: 152,
                      borderRadius: 76,
                      borderWidth: 2,
                      borderColor: "#d94040",
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    pulseRingStyle,
                    {
                      position: "absolute",
                      width: 168,
                      height: 168,
                      borderRadius: 84,
                      borderWidth: 1,
                      borderColor: "rgba(217, 64, 64, 0.3)",
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    stopRecording();
                  }}
                  activeOpacity={0.85}
                  style={{
                    width: 128,
                    height: 128,
                    borderRadius: 64,
                    backgroundColor: "#d94040",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#d94040",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 24,
                    elevation: 12,
                  }}
                >
                  <Square size={36} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {step === "recorded" && recordingUri && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                <TouchableOpacity
                  onPress={playRecording}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    intensity="heavy"
                    style={{
                      width: 56,
                      height: 56,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 28,
                    }}
                  >
                    {isPlaying ? (
                      <Pause size={24} color="#fff" />
                    ) : (
                      <Play size={24} color="#fff" />
                    )}
                  </GlassCard>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    startRecording();
                  }}
                  activeOpacity={0.85}
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
                      shadowColor: "#0b5ed7",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    <Mic size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {(step === "transcribing" || step === "enhancing" || step === "saving") && (
              <Text style={{ color: "#a78bfa", fontSize: 15 }}>
                {step === "transcribing" && "Transcribing..."}
                {step === "enhancing" && "Enhancing with AI..."}
                {step === "saving" && "Saving story..."}
              </Text>
            )}

            {step === "idle" && (
              <Text style={{ marginTop: 16, fontSize: 12, color: "#64748b" }}>Tap to start recording</Text>
            )}
            {step === "recording" && (
              <Text style={{ marginTop: 16, fontSize: 12, color: "rgba(217,64,64,0.7)" }}>Tap to stop</Text>
            )}
          </GlassCard>
        </AnimatedListItem>

        {/* Action Buttons */}
        {step === "recorded" && recordingUri && (
          <AnimatedListItem index={2}>
            <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
              {!transcript && (
                <View style={{ flex: 1 }}>
                  <GradientButton
                    onPress={transcribe}
                    title="Transcribe"
                    icon={<Sparkles size={18} color="#fff" />}
                    gradient={GRADIENTS.primary}
                    fullWidth
                  />
                </View>
              )}
              {transcript && !enhancedText && (
                <View style={{ flex: 1 }}>
                  <GradientButton
                    onPress={enhance}
                    title="Enhance"
                    icon={<Sparkles size={18} color="#fff" />}
                    gradient={GRADIENTS.accent}
                    fullWidth
                  />
                </View>
              )}
            </View>
          </AnimatedListItem>
        )}

        {/* Transcript / Enhanced Text */}
        {(transcript || enhancedText) && (
          <AnimatedListItem index={3}>
            <View style={{ marginTop: 16 }}>
              <Text style={{ marginBottom: 8, fontSize: 13, fontWeight: "600", color: "#94a3b8" }}>
                {enhancedText ? "Enhanced Story" : "Transcript"}
              </Text>
              <GlassCard intensity="light" style={{ padding: 16 }}>
                <TextInput
                  value={enhancedText || transcript}
                  onChangeText={enhancedText ? setEnhancedText : setTranscript}
                  multiline
                  style={{ minHeight: 120, fontSize: 15, color: "#fff" }}
                  placeholderTextColor="#64748b"
                />
              </GlassCard>
            </View>
          </AnimatedListItem>
        )}

        {/* Story Details */}
        {(transcript || enhancedText) && (
          <AnimatedListItem index={4}>
            <View style={{ marginTop: 16, gap: 12 }}>
              <GlassCard intensity="light" style={{ padding: 0 }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Story title"
                  style={{ padding: 16, fontSize: 15, color: "#fff" }}
                  placeholderTextColor="#64748b"
                />
              </GlassCard>

              {/* Mood Selector */}
              <View>
                <Text style={{ marginBottom: 8, fontSize: 13, color: "#94a3b8" }}>Mood</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {MOODS.map((m) => {
                      const isSelected = selectedMood === m;
                      return isSelected ? (
                        <GradientButton
                          key={m}
                          onPress={() => setSelectedMood(m)}
                          title={m}
                          gradient={GRADIENTS.primary}
                          size="sm"
                        />
                      ) : (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setSelectedMood(m)}
                        >
                          <GlassCard
                            intensity="light"
                            style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                          >
                            <Text style={{ fontSize: 13, color: "#94a3b8", textTransform: "capitalize" }}>
                              {m}
                            </Text>
                          </GlassCard>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <GlassCard intensity="light" style={{ padding: 0 }}>
                <TextInput
                  value={tags}
                  onChangeText={setTags}
                  placeholder="Tags (comma separated)"
                  style={{ padding: 16, fontSize: 15, color: "#fff" }}
                  placeholderTextColor="#64748b"
                />
              </GlassCard>

              {/* Visibility Toggle */}
              <TouchableOpacity onPress={() => setIsPublic(!isPublic)}>
                <GlassCard
                  intensity="light"
                  style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  {isPublic ? (
                    <Eye size={20} color="#a78bfa" />
                  ) : (
                    <EyeOff size={20} color="#64748b" />
                  )}
                  <Text style={{ fontSize: 15, color: "#fff" }}>
                    {isPublic ? "Public" : "Private"}
                  </Text>
                </GlassCard>
              </TouchableOpacity>

              {/* Save Button */}
              <GradientButton
                onPress={saveStory}
                title="Save Story"
                icon={<Save size={20} color="#fff" />}
                gradient={GRADIENTS.success}
                size="lg"
                fullWidth
              />
            </View>
          </AnimatedListItem>
        )}

        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
