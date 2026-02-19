// Record Screen - Audio capture, transcription, enhancement, save
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Mic, Square, Play, Pause, Sparkles, Save, Eye, EyeOff } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { api, apiUpload } from "../../lib/api";

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

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <Mic size={48} color="#64748b" />
        <Text className="mt-4 text-lg text-slate-400">Sign in to record</Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="mt-4 rounded-full bg-violet-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </TouchableOpacity>
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
        // Reset
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
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        <Text className="py-6 text-2xl font-bold text-white">Record Story</Text>

        {/* Recording Controls */}
        <View className="items-center rounded-2xl bg-slate-800 p-8">
          <Text className="mb-4 text-4xl font-mono text-white">
            {formatTime(duration)}
          </Text>

          {step === "idle" && (
            <TouchableOpacity
              onPress={startRecording}
              className="h-20 w-20 items-center justify-center rounded-full bg-red-500"
            >
              <Mic size={36} color="#fff" />
            </TouchableOpacity>
          )}

          {step === "recording" && (
            <TouchableOpacity
              onPress={stopRecording}
              className="h-20 w-20 items-center justify-center rounded-full bg-red-600"
            >
              <Square size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {step === "recorded" && recordingUri && (
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={playRecording}
                className="h-14 w-14 items-center justify-center rounded-full bg-slate-700"
              >
                {isPlaying ? (
                  <Pause size={24} color="#fff" />
                ) : (
                  <Play size={24} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startRecording}
                className="h-14 w-14 items-center justify-center rounded-full bg-red-500"
              >
                <Mic size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {(step === "transcribing" || step === "enhancing" || step === "saving") && (
            <Text className="text-violet-400">
              {step === "transcribing" && "Transcribing..."}
              {step === "enhancing" && "Enhancing with AI..."}
              {step === "saving" && "Saving story..."}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {step === "recorded" && recordingUri && (
          <View className="mt-4 flex-row gap-3">
            {!transcript && (
              <TouchableOpacity
                onPress={transcribe}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-violet-600 p-3"
              >
                <Sparkles size={18} color="#fff" />
                <Text className="font-semibold text-white">Transcribe</Text>
              </TouchableOpacity>
            )}
            {transcript && !enhancedText && (
              <TouchableOpacity
                onPress={enhance}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-violet-600 p-3"
              >
                <Sparkles size={18} color="#fff" />
                <Text className="font-semibold text-white">Enhance</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Transcript / Enhanced Text */}
        {(transcript || enhancedText) && (
          <View className="mt-4">
            <Text className="mb-2 text-sm font-semibold text-slate-400">
              {enhancedText ? "Enhanced Story" : "Transcript"}
            </Text>
            <TextInput
              value={enhancedText || transcript}
              onChangeText={enhancedText ? setEnhancedText : setTranscript}
              multiline
              className="min-h-[120] rounded-xl bg-slate-800 p-4 text-base text-white"
              placeholderTextColor="#64748b"
            />
          </View>
        )}

        {/* Story Details */}
        {(transcript || enhancedText) && (
          <View className="mt-4 gap-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Story title"
              className="rounded-xl bg-slate-800 p-4 text-base text-white"
              placeholderTextColor="#64748b"
            />

            {/* Mood Selector */}
            <View>
              <Text className="mb-2 text-sm text-slate-400">Mood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSelectedMood(m)}
                      className={`rounded-full px-4 py-2 ${
                        selectedMood === m ? "bg-violet-600" : "bg-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-sm capitalize ${
                          selectedMood === m ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="Tags (comma separated)"
              className="rounded-xl bg-slate-800 p-4 text-base text-white"
              placeholderTextColor="#64748b"
            />

            {/* Visibility Toggle */}
            <TouchableOpacity
              onPress={() => setIsPublic(!isPublic)}
              className="flex-row items-center gap-3 rounded-xl bg-slate-800 p-4"
            >
              {isPublic ? (
                <Eye size={20} color="#a78bfa" />
              ) : (
                <EyeOff size={20} color="#64748b" />
              )}
              <Text className="text-base text-white">
                {isPublic ? "Public" : "Private"}
              </Text>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveStory}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-green-600 p-4"
            >
              <Save size={20} color="#fff" />
              <Text className="text-lg font-semibold text-white">
                Save Story
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
