// Tracker Screen - Daily habit/mood tracking with AI journal generation
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  CalendarCheck,
  Plus,
  Trash2,
  Check,
  Circle,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "../../stores/authStore";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";
import type { Habit, DailyLog } from "../../types";

const MOODS = [
  { label: "Great", value: "great", emoji: "😊", color: "#4ade80" },
  { label: "Good", value: "good", emoji: "🙂", color: "#60a5fa" },
  { label: "Okay", value: "okay", emoji: "😐", color: "#facc15" },
  { label: "Tough", value: "tough", emoji: "😞", color: "#f87171" },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function TrackerScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingJournal, setGeneratingJournal] = useState(false);

  const today = formatDate(new Date());

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const res = await apiGet<{
        habits: Habit[];
        dailyLog: DailyLog | null;
      }>(`/api/habits?user_id=${user.id}&date=${today}`);
      if (res.ok && res.data) {
        setHabits(res.data.habits || []);
        if (res.data.dailyLog) {
          setDailyLog(res.data.dailyLog);
          setSelectedMood(res.data.dailyLog.mood || "");
          setNotes(res.data.dailyLog.notes || "");
        }
      }
    } catch (err) {
      console.error("[Tracker] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const completedIds = dailyLog?.completed_habit_ids || [];
  const completedCount = completedIds.length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  const saveDailyLog = async (updates: Partial<DailyLog>) => {
    const payload = {
      user_id: user!.id,
      date: today,
      completed_habit_ids: completedIds,
      mood: selectedMood,
      notes,
      ...updates,
    };
    const res = await apiPut<{ dailyLog: DailyLog }>("/api/habits", payload);
    if (res.ok && res.data?.dailyLog) {
      setDailyLog(res.data.dailyLog);
    }
  };

  const toggleHabit = async (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isCompleted = completedIds.includes(habitId);
    const newIds = isCompleted
      ? completedIds.filter((id) => id !== habitId)
      : [...completedIds, habitId];
    setDailyLog((prev) =>
      prev
        ? { ...prev, completed_habit_ids: newIds }
        : { user_id: user!.id, date: today, completed_habit_ids: newIds, mood: selectedMood, notes }
    );
    await saveDailyLog({ completed_habit_ids: newIds });
  };

  const addHabit = async () => {
    if (!newHabitTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await apiPost<{ habit: Habit }>("/api/habits", {
      user_id: user!.id,
      title: newHabitTitle.trim(),
      category: "general",
      target_frequency: "daily",
    });
    if (res.ok && res.data?.habit) {
      setHabits((prev) => [...prev, res.data!.habit]);
      setNewHabitTitle("");
    }
  };

  const deleteHabit = (habit: Habit) => {
    Alert.alert("Delete Habit", `Remove "${habit.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const res = await apiDelete(`/api/habits?id=${habit.id}`);
          if (res.ok) {
            setHabits((prev) => prev.filter((h) => h.id !== habit.id));
          }
        },
      },
    ]);
  };

  const selectMood = async (mood: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMood(mood);
    await saveDailyLog({ mood });
  };

  const saveNotes = async () => {
    await saveDailyLog({ notes });
  };

  const generateJournal = async () => {
    if (!user) return;
    setGeneratingJournal(true);
    try {
      const completedHabits = habits
        .filter((h) => completedIds.includes(h.id))
        .map((h) => h.title);
      const prompt = [
        selectedMood && `Today I felt ${selectedMood}.`,
        completedHabits.length > 0 &&
          `I completed these habits: ${completedHabits.join(", ")}.`,
        notes && `Notes: ${notes}`,
      ]
        .filter(Boolean)
        .join(" ");

      if (!prompt) {
        Alert.alert("Add some data first", "Select a mood or complete some habits before generating a journal.");
        return;
      }

      const enhanceRes = await apiPost<{ enhanced: string }>("/api/ai/enhance", {
        text: prompt,
        type: "journal",
      });
      if (enhanceRes.ok && enhanceRes.data?.enhanced) {
        const saveRes = await apiPost("/api/journal/save", {
          content: enhanceRes.data.enhanced,
          source: "tracker",
          mood: selectedMood,
          date: today,
        });
        if (saveRes.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Journal Created", "Your AI journal entry has been saved!");
        }
      }
    } catch (err) {
      console.error("[Tracker] Journal generation failed:", err);
      Alert.alert("Error", "Failed to generate journal entry.");
    } finally {
      setGeneratingJournal(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <CalendarCheck size={48} color="#64748b" />
        <Text className="mt-4 text-lg text-slate-400">Sign in to track your habits</Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="mt-4 rounded-full bg-violet-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-bold text-white">Daily Tracker</Text>
          <Text className="text-sm text-slate-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Progress Card */}
        <View className="mx-4 mb-4 rounded-xl bg-slate-800 p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-slate-300">Today's Progress</Text>
            <Text className="text-sm font-semibold text-emerald-400">
              {completedCount}/{totalHabits}
            </Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-slate-700">
            <View
              className="h-3 rounded-full bg-emerald-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          {totalHabits > 0 && progressPercent === 100 && (
            <Text className="mt-2 text-center text-xs text-emerald-400">
              All habits completed! Great job!
            </Text>
          )}
        </View>

        {/* Mood Selector */}
        <View className="mx-4 mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">How are you feeling?</Text>
          <View className="flex-row gap-2">
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                onPress={() => selectMood(mood.value)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  selectedMood === mood.value ? "border-2" : "bg-slate-800"
                }`}
                style={
                  selectedMood === mood.value
                    ? { backgroundColor: mood.color + "20", borderColor: mood.color }
                    : undefined
                }
              >
                <Text className="text-lg">{mood.emoji}</Text>
                <Text
                  className={`mt-1 text-xs font-medium ${
                    selectedMood === mood.value ? "text-white" : "text-slate-400"
                  }`}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habits List */}
        <View className="mx-4 mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">Habits</Text>
          {loading ? (
            <ActivityIndicator color="#a78bfa" />
          ) : (
            <>
              {habits.map((habit) => {
                const isCompleted = completedIds.includes(habit.id);
                return (
                  <TouchableOpacity
                    key={habit.id}
                    onPress={() => toggleHabit(habit.id)}
                    onLongPress={() => deleteHabit(habit)}
                    className="mb-2 flex-row items-center rounded-xl bg-slate-800 p-3"
                  >
                    {isCompleted ? (
                      <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                        <Check size={14} color="#fff" />
                      </View>
                    ) : (
                      <Circle size={24} color="#64748b" className="mr-3" />
                    )}
                    <Text
                      className={`flex-1 text-base ${
                        isCompleted
                          ? "text-slate-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {habit.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteHabit(habit)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color="#64748b" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              {/* Add Habit Row */}
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={newHabitTitle}
                  onChangeText={setNewHabitTitle}
                  placeholder="Add a habit..."
                  placeholderTextColor="#64748b"
                  className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-white"
                  onSubmitEditing={addHabit}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={addHabit}
                  className="h-12 w-12 items-center justify-center rounded-xl bg-violet-600"
                >
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Daily Notes */}
        <View className="mx-4 mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={saveNotes}
            placeholder="How was your day? Any reflections..."
            placeholderTextColor="#64748b"
            className="min-h-[100px] rounded-xl bg-slate-800 p-4 text-white"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* AI Journal Button */}
        <View className="mx-4 mb-4">
          <TouchableOpacity
            onPress={generateJournal}
            disabled={generatingJournal}
            className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${
              generatingJournal ? "bg-violet-800" : "bg-violet-600"
            }`}
          >
            {generatingJournal ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Sparkles size={20} color="#fff" />
            )}
            <Text className="font-semibold text-white">
              {generatingJournal ? "Generating..." : "Generate AI Journal"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
