"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/components/Provider";
import { useAuth } from "@/components/AuthProvider";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
// Use the singleton client we fixed earlier
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";

export default function RecordPage() {
  const { isConnected } = useApp();
  const authInfo = useAuth(); // Contains the real Supabase user ID and wallet
  
  // State Management
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the singleton client directly
  const supabase = supabaseClient;

  // --- 1. Recording & Transcription Logic ---
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
        // Create the audio blob
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        
        // Stop tracks to release mic
        stream.getTracks().forEach((track) => track.stop());

        // Start Real AI Transcription
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
      toast.error("Failed to access microphone. Please check permissions.");
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

  // Call the backend API we created to use Gemini Flash
  const handleTranscribe = async (blob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", blob);

    const promise = fetch("/api/ai/transcribe", {
      method: "POST",
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
      loading: "Gemini is transcribing...",
      success: (text) => {
        setTranscribedText((prev) => (prev ? prev + " " + text : text));
        if (!entryTitle) {
          setEntryTitle("Journal Entry " + new Date().toLocaleTimeString());
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
  };

  // --- 2. AI Text Enhancement Logic ---
  const enhanceText = () => {
    if (!transcribedText.trim()) return;
    setIsProcessing(true);

    const promise = fetch("/api/ai/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      loading: "Gemini is polishing your story...",
      success: (enhanced) => {
        setTranscribedText(enhanced);
        setIsProcessing(false);
        return "Story enhanced!";
      },
      error: "Failed to enhance text.",
    });
  };

  // --- 3. Text-to-Speech (Native Browser API) ---
  const toggleTTS = () => {
    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    } else {
      if (!transcribedText.trim()) return;
      
      const utterance = new SpeechSynthesisUtterance(transcribedText);
      // Optional: You can customize voice/rate/pitch here
      // utterance.rate = 1; 
      
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlayingTTS(true);
    }
  };

  // --- 4. Database Save Logic ---
  const saveEntry = async () => {
    // Auth Guards
    if (!isConnected || !authInfo) {
      return toast.error("You must be signed in to save a story.");
    }
    if (!authInfo.id) {
      return toast.error("User ID is missing, cannot save.");
    }
    if (!transcribedText.trim() || !entryTitle.trim()) {
      return toast.error("Please provide a title and content.");
    }

    setIsProcessing(true);

    const promiseToSave = async () => {
      let audioUrl = null;
      const userId = authInfo.id;

      try {
        // Step A: Upload Audio to Supabase Storage (if audio exists)
        if (audioBlob && supabase) {
          console.log("Uploading audio blob...");
          const fileName = `${userId}/${new Date().toISOString()}.webm`;
          
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("story-audio")
              .upload(fileName, audioBlob, { contentType: "audio/webm" });

          if (uploadError) {
            console.error("Audio upload error:", uploadError);
            toast.error("Audio upload failed. Saving text only.");
          } else {
            const { data: urlData } = supabase.storage
              .from("story-audio")
              .getPublicUrl(uploadData.path);
            audioUrl = urlData.publicUrl;
          }
        }

        // Step B: Insert Record into Database
        const storyData = {
          author_id: userId,
          author_wallet: authInfo.wallet_address, // Critical: links to the public user profile
          title: entryTitle,
          content: transcribedText,
          has_audio: !!audioBlob && !!audioUrl,
          audio_url: audioUrl,
          likes: 0,
          comments_count: 0,
          shares: 0,
          tags: [],
          mood: "neutral",
        };

        const { error: insertError } = await supabase!
          .from("stories")
          .insert([storyData]);

        if (insertError) throw insertError;

        return "Story saved successfully!";
      } catch (err: any) {
        throw new Error(err.message || "Save failed");
      }
    };

    toast.promise(promiseToSave(), {
      loading: "Saving to blockchain database...",
      success: (msg) => {
        setIsProcessing(false);
        // Reset state on success
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

  if (!isConnected) {
    return (
      <div className="text-center space-y-8 py-16">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
          <Mic className="w-12 h-12 text-purple-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Connect Your Wallet
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Please connect your Web3 wallet to start recording stories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          <Mic className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Record Your Story
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Capture thoughts and experiences with AI transcription
        </p>
      </div>

      {/* Recording Controls */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>Audio Recording</span>
          </CardTitle>
          <CardDescription>
            Speak naturally and let Gemini AI handle transcription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-4 py-2 rounded-full"
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-32 h-32 rounded-full text-white shadow-xl ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600"
                }`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </motion.div>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4" />
                <span>Multi-language</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Gemini AI</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription & Title */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Entry Title</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-0">
          <Input
            placeholder="Give your story a title..."
            value={entryTitle}
            onChange={(e) => setEntryTitle(e.target.value)}
            className="text-lg"
            disabled={isProcessing}
          />
        </CardContent>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Transcription</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {audioBlob && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600"
                >
                  Audio Captured
                </Badge>
              )}
              {isProcessing && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-600"
                >
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}
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
            {/* Read Aloud / Stop Button */}
            <Button
              onClick={toggleTTS}
              disabled={!transcribedText.trim()}
              variant="outline"
              className="flex-1"
            >
              {isPlayingTTS ? (
                <>
                  <StopCircle className="w-4 h-4 mr-2" /> Stop Reading
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" /> Read Aloud
                </>
              )}
            </Button>

            <Button
              onClick={enhanceText}
              disabled={!transcribedText.trim() || isProcessing}
              variant="outline"
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Enhance with AI
            </Button>
            <Button
              onClick={saveEntry}
              disabled={
                !transcribedText.trim() || !entryTitle.trim() || isProcessing
              }
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recording Tips */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-lg">Recording Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">1</span>
              </div>
              <p>Speak clearly and moderately</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">2</span>
              </div>
              <p>Find a quiet environment</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">3</span>
              </div>
              <p>You can edit the text before saving</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">4</span>
              </div>
              <p>Stories saved securely on blockchain</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}