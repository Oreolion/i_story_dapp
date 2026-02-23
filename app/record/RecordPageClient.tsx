"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

// Relative paths (Preserving your working structure)
import { useApp } from "../../components/Provider";
import { useAuth } from "../../components/AuthProvider";
import { supabaseClient } from "../../app/utils/supabase/supabaseClient";
import { ipfsService } from "../../app/utils/ipfsService";
import { useBackgroundMode } from "@/contexts/BackgroundContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added Label for better UX
import {
  Mic,
  Square,
  Save,
  Wand2,
  Volume2,
  Languages,
  Clock,
  FileText,
  Zap,
  Loader2,
  PlayCircle,
  StopCircle,
  Globe,
  Calendar as CalendarIcon, // Renamed to avoid conflict
  Lock,   // NEW: For Private icon
  Unlock, // NEW: For Public icon
  Undo2,
} from "lucide-react";

export default function RecordPage() {
  const { isConnected } = useApp();
  const { profile: authInfo } = useAuth();

  // Set background mode for this page
  useBackgroundMode('record');

  // State Management
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  
  // NEW: Visibility State
  const [isPublic, setIsPublic] = useState(false); // Default to Private

  // NEW: Date Selection for Backdating (Defaults to Today)
  const [storyDate, setStoryDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [preEnhanceText, setPreEnhanceText] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = supabaseClient;

  // Helper to get auth token for API calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      if (!supabase) return {};
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // --- 1. Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        handleTranscribe(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(
        () => setRecordingDuration((prev) => prev + 1),
        1000
      );
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
      toast.success("Recording stopped. Processing...");
    }
  };

  // --- 2. AI Transcription ---
  const handleTranscribe = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob);

      const authHeaders = await getAuthHeaders();
      const promise = fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { ...authHeaders },
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Transcription failed");
        }
        const data = await res.json();
        return data.text;
      });

      toast.promise(promise, {
        loading: "AI is transcribing...",
        success: (text) => {
          setTranscribedText((prev) => (prev ? prev + " " + text : text));
          if (!entryTitle) {
            const dateObj = new Date(storyDate);
            setEntryTitle(`Journal Entry - ${dateObj.toLocaleDateString()}`);
          }
          setIsProcessing(false);
          return "Transcription complete!";
        },
        error: (err) => {
          setIsProcessing(false);
          console.error(err);
          return "Failed to transcribe audio.";
        },
      });
    } catch (err) {
      setIsProcessing(false);
      console.error("Transcription setup error:", err);
      toast.error("Failed to start transcription.");
    }
  };

  // --- 3. AI Enhancement ---
  const enhanceText = async () => {
    if (!transcribedText.trim()) return;
    setIsProcessing(true);
    setPreEnhanceText(transcribedText); // Save original for revert

    try {
      const authHeaders = await getAuthHeaders();
      const promise = fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ text: transcribedText }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Enhancement failed");
        }
        const data = await res.json();
        return data.text;
      });

      toast.promise(promise, {
        loading: "Polishing story...",
        success: (enhanced) => {
          setTranscribedText(enhanced);
          setIsProcessing(false);
          return "Story enhanced! You can revert if you prefer the original.";
        },
        error: (err) => {
          setPreEnhanceText(null);
          setIsProcessing(false);
          return "Failed to enhance text.";
        },
      });
    } catch (err) {
      setPreEnhanceText(null);
      setIsProcessing(false);
      console.error("Enhancement setup error:", err);
      toast.error("Failed to start enhancement.");
    }
  };

  const revertEnhancement = () => {
    if (preEnhanceText) {
      setTranscribedText(preEnhanceText);
      setPreEnhanceText(null);
      toast.success("Reverted to original text.");
    }
  };

  // --- 4. Text-to-Speech ---
  const toggleTTS = () => {
    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    } else {
      if (!transcribedText.trim()) return;
      const utterance = new SpeechSynthesisUtterance(transcribedText);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingTTS(true);
    }
  };

  // --- 5. Save Logic (IPFS + Supabase + Backdating) ---
  const saveEntry = async () => {
    if (!authInfo) return toast.error("Please sign in.");
    if (!authInfo.id) return toast.error("User ID missing.");
    if (!transcribedText.trim() || !entryTitle.trim())
      return toast.error("Story is empty.");

    setIsProcessing(true);

    const promiseToSave = async () => {
      let audioUrl = null;
      let ipfsHash = null;
      const userId = authInfo.id;
      
      // Capture timestamps exactly when save is clicked
      const actualCreatedDate = new Date().toISOString(); // Real system time
      const backdatedStoryDate = new Date(storyDate).toISOString(); // User selected time

      try {
        // A. Upload Audio to Supabase
        if (audioBlob && supabase) {
          const fileName = `${userId}/${new Date().getTime()}.webm`; // Unique name
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("story-audio")
              .upload(fileName, audioBlob, { contentType: "audio/webm" });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from("story-audio")
              .getPublicUrl(uploadData.path);
            audioUrl = urlData.publicUrl;
          }
        }

        // B. Upload Content to IPFS (Immutable Record)
        // NEW: We include the custom 'storyDate', 'isPublic' and real timestamp in metadata
        const ipfsMetadata = {
          title: entryTitle,
          content: transcribedText,
          author: authInfo.wallet_address,
          audio: audioUrl,
          date: storyDate, // User-selected date
          timestamp: actualCreatedDate, // System upload time
          is_public: isPublic, // Visibility state
          app: "EStory DApp",
        };

        const ipfsResult = await ipfsService.uploadMetadata(ipfsMetadata);
        ipfsHash = ipfsResult.hash;
        console.log("Story pinned to IPFS:", ipfsHash);

        // C. Save to Supabase DB
        const storyData = {
          author_id: userId,
          author_wallet: authInfo.wallet_address,
          title: entryTitle,
          content: transcribedText,
          has_audio: !!audioBlob && !!audioUrl,
          audio_url: audioUrl,
          likes: 0,
          comments_count: 0,
          shares: 0,
          tags: [],
          mood: "neutral",
          ipfs_hash: ipfsHash,
          is_public: isPublic, // NEW: Save visibility status
          created_at: actualCreatedDate, // NEW: Actual system creation time
          story_date: backdatedStoryDate, // NEW: Explicit backdated field
          // Fallback: If your legacy code relies on created_at being the story date,
          // you might need to swap these, but storing BOTH is safest.
        };

        const { data: insertedStory, error: insertError } = await supabase!
          .from("stories")
          .insert([storyData])
          .select("id")
          .single();

        if (insertError) throw insertError;

        // Trigger AI analysis in background (fire-and-forget)
        if (insertedStory?.id) {
          const analyzeHeaders = await getAuthHeaders();
          fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...analyzeHeaders },
            body: JSON.stringify({
              storyId: insertedStory.id,
              storyText: transcribedText,
            }),
            keepalive: true,
          }).catch((err) => console.warn("Analysis trigger failed:", err));
        }

        return "Story saved & pinned to IPFS!";
      } catch (err: any) {
        throw new Error(err.message || "Save failed");
      }
    };

    toast.promise(promiseToSave(), {
      loading: "Saving to Database & IPFS...",
      success: (msg) => {
        setIsProcessing(false);
        setTranscribedText("");
        setEntryTitle("");
        setAudioBlob(null);
        setRecordingDuration(0);
        return msg;
      },
      error: (err) => {
        setIsProcessing(false);
        return err?.message || "Failed to save";
      },
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isConnected && !authInfo) {
    return (
      <div className="text-center space-y-8 py-16">
        <div className="w-24 h-24 mx-auto bg-[hsl(var(--memory-500)/0.15)] rounded-full flex items-center justify-center">
          <Mic className="w-12 h-12 text-[hsl(var(--memory-500))]" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign In to Record
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect your Web3 wallet or sign in with Google to start recording stories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] rounded-full flex items-center justify-center shadow-lg"
        >
          <Mic className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Record Your <span className="text-gradient-memory">Story</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Capture thoughts and experiences with AI transcription
        </p>
      </div>

      {/* Recording Controls */}
      <Card className="card-elevated rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>Audio Recording</span>
          </CardTitle>
          <CardDescription>
            Speak naturally and let AI handle transcription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-6">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-4 py-2 rounded-full"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">Recording</span>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">
                    {formatDuration(recordingDuration)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fancy Microphone Button */}
            <div className="relative flex items-center justify-center">
              {/* Animated pulse rings */}
              {isRecording && (
                <>
                  <motion.div
                    className="absolute w-40 h-40 rounded-full border-2 border-red-400/30"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute w-48 h-48 rounded-full border border-red-300/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute w-56 h-56 rounded-full border border-red-200/10"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                  />
                </>
              )}

              {/* Idle glow ring */}
              {!isRecording && !isProcessing && (
                <motion.div
                  className="absolute w-36 h-36 rounded-full"
                  style={{
                    background: "radial-gradient(circle, hsl(var(--memory-500) / 0.15) 0%, transparent 70%)",
                  }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Button
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`relative w-32 h-32 rounded-full text-white shadow-2xl transition-all duration-300 ${
                    isRecording
                      ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25"
                      : "bg-gradient-to-br from-[hsl(var(--memory-500))] via-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:shadow-[0_0_40px_hsl(var(--memory-500)/0.4)]"
                  }`}
                >
                  {/* Inner ring highlight */}
                  <span className="absolute inset-2 rounded-full border border-white/20" />
                  {isRecording ? (
                    <Square className="w-8 h-8 relative z-10" />
                  ) : (
                    <svg
                      className="w-10 h-10 relative z-10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                    </svg>
                  )}
                </Button>
              </motion.div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isRecording ? "Tap to stop recording" : "Tap to start recording"}
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4" />
                <span>Multi-language</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>ElevenLabs Scribe</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Details (Title & Date) */}
      <Card className="card-elevated rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-gray-500"
              >
                Title
              </Label>
              <Input
                id="title"
                placeholder="Give your story a title..."
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                className="text-lg"
                disabled={isProcessing}
              />
            </div>

            <div className="w-full md:w-48 space-y-2">
              <Label
                htmlFor="date"
                className="text-sm font-medium text-gray-500"
              >
                Date of Memory
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <Input
                  id="date"
                  type="date"
                  value={storyDate}
                  onChange={(e) => setStoryDate(e.target.value)}
                  className="pl-10 font-medium"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* NEW: Visibility Toggle */}
            <div className="w-full md:w-32 space-y-2">
              <Label className="text-sm font-medium text-gray-500">
                Visibility
              </Label>
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors ${isPublic ? 'bg-[hsl(var(--growth-500)/0.1)] border-[hsl(var(--growth-500)/0.3)]' : 'bg-[hsl(var(--void-light))] border-gray-200 dark:border-gray-700'}`}
                onClick={() => !isProcessing && setIsPublic(!isPublic)}
              >
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Unlock className="w-4 h-4 text-[hsl(var(--growth-500))]" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                  <span className={`text-sm font-medium ${isPublic ? 'text-[hsl(var(--growth-600))]' : 'text-gray-600 dark:text-gray-400'}`}>
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </CardContent>

        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Content</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {audioBlob && (
                <Badge
                  variant="secondary"
                  className="bg-[hsl(var(--growth-500)/0.15)] text-[hsl(var(--growth-600))] dark:text-[hsl(var(--growth-400))]"
                >
                  Audio Captured
                </Badge>
              )}
              {isProcessing && (
                <Badge
                  variant="secondary"
                  className="bg-[hsl(var(--memory-500)/0.15)] text-[hsl(var(--memory-600))] dark:text-[hsl(var(--memory-400))]"
                >
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-[hsl(var(--insight-500)/0.3)] text-[hsl(var(--insight-600))] dark:text-[hsl(var(--insight-400))] hidden sm:flex items-center gap-1"
              >
                <Globe className="w-3 h-3" /> IPFS Ready
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Your transcribed text will appear here, or you can type directly..."
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            className="min-h-[200px] text-base leading-relaxed resize-none"
            disabled={isProcessing}
          />
          <Separator />
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={toggleTTS}
              disabled={!transcribedText.trim()}
              variant="outline"
              className="flex-1"
            >
              {isPlayingTTS ? (
                <>
                  <StopCircle className="w-4 h-4 mr-2" /> Stop
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" /> Read Aloud
                </>
              )}
            </Button>
            {preEnhanceText ? (
              <Button
                onClick={revertEnhancement}
                variant="outline"
                className="flex-1 border-amber-300 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <Undo2 className="w-4 h-4 mr-2" /> Revert
              </Button>
            ) : (
              <Button
                onClick={enhanceText}
                disabled={!transcribedText.trim() || isProcessing}
                variant="outline"
                className="flex-1"
              >
                <Wand2 className="w-4 h-4 mr-2" /> Enhance with AI
              </Button>
            )}
            <Button
              onClick={saveEntry}
              disabled={
                !transcribedText.trim() || !entryTitle.trim() || isProcessing
              }
              className="flex-1 bg-gradient-growth hover:opacity-90"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isPublic ? 'Publish & Save' : 'Save Privately'}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Recording Tips */}
      <Card className="bg-[hsl(var(--insight-500)/0.05)] border-[hsl(var(--insight-500)/0.2)] rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg text-gradient-insight">Recording Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[hsl(var(--insight-500)/0.15)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[hsl(var(--insight-500))]">1</span>
              </div>
              <p>Speak clearly and moderately</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[hsl(var(--insight-500)/0.15)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[hsl(var(--insight-500))]">2</span>
              </div>
              <p>Find a quiet environment</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[hsl(var(--insight-500)/0.15)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[hsl(var(--insight-500))]">3</span>
              </div>
              <p>You can edit the text before saving</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[hsl(var(--insight-500)/0.15)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[hsl(var(--insight-500))]">4</span>
              </div>
              <p>Stories saved securely on blockchain</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}