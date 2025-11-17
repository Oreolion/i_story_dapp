"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/components/Provider"; // For connection status
import { useAuth } from "@/components/AuthProvider"; // For getting the user's real Supabase ID
import { supabaseClient } from "@/app/utils/supabase/supabaseClient"; // For DB/Storage operations
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
  MicOff,
  Square,
  Save,
  Wand2,
  Volume2,
  Languages,
  Clock,
  Upload,
  Sparkles,
  FileText,
  Zap,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { SupabaseClient } from '@supabase/supabase-js';
import { useBrowserSupabase } from "../hooks/useBrowserSupabase";

export default function RecordPage() {
  const { user, isConnected } = useApp(); // Use useApp for connection status and basic UI data
  const authInfo = useAuth(); // Use useAuth to get the real Supabase user ID for database operations
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
              const supabase = useBrowserSupabase()


  // --- startRecording, stopRecording, enhanceText ---
  // (These functions are unchanged from your code)
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
        const blob = new Blob(chunks, { type: "audio/webm" }); // Use webm, it's well-supported
        setAudioBlob(blob);
        setIsProcessing(true);
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
          loading: "Transcribing (mock)...",
          success: () => {
            setTranscribedText(
              "This is a mock transcription of your recorded audio. In a real app, this would come from an AI speech-to-text service."
            );
            if (!entryTitle)
              setEntryTitle(
                "My Recorded Story " + new Date().toLocaleTimeString()
              );
            setIsProcessing(false);
            return "Transcription complete!";
          },
          error: "Transcription failed",
        });
        stream.getTracks().forEach((track) => track.stop());
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
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
      toast.success("Recording stopped");
    }
  };

  const enhanceText = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setTranscribedText(
        (prev) =>
          prev +
          "\n\n[AI Enhanced]: This is an AI suggestion added to enhance your story."
      );
      setIsProcessing(false);
      toast.success("Text enhanced with AI!");
    }, 1500);
  };

  // *** REFACTORED saveEntry FUNCTION ***
  const saveEntry = async () => {
    if (!isConnected || !authInfo) {
      return toast.error("You must be signed in to save a story.");
    }
    if (!authInfo.id) {
      console.error("AuthInfo is present, but user ID is missing.", authInfo);
      return toast.error("User ID is missing, cannot save.");
    }
    if (!transcribedText.trim() || !entryTitle.trim()) {
      return toast.error("Please provide a title and content for your story.");
    }

    setIsProcessing(true);

    // We define the async function that toast.promise will track
    const promiseToSave = async () => {
      let audioUrl = null;
      const userId = authInfo.id; // Get the real user ID (UUID)

      try {
        // Step 1: Upload audio if it exists
        if (audioBlob) {
          console.log("Uploading audio blob...");
          const fileName = `${userId}/${new Date().toISOString()}.webm`;
          const { data: uploadData, error: uploadError } =
            await supabase?.storage
              .from("story-audio") // Bucket name
              .upload(fileName, audioBlob, { contentType: "audio/webm" });

          if (uploadError) {
            // This is a "soft" failure. We toast it, but continue.
            console.error("Audio upload error:", uploadError);
            toast.error("Failed to upload audio. Saving text only.");
            audioUrl = null; // Ensure audioUrl is null
          } else {
            // Get the public URL of the uploaded file
            const { data: urlData } = supabase?.storage
              .from("story-audio")
              .getPublicUrl(uploadData.path);
            audioUrl = urlData.publicUrl;
            console.log("Audio uploaded successfully:", audioUrl);
          }
        } else {
          console.log("No audio; saving text-only entry.");
        }

        // Step 2: Prepare the story data for the database
        const storyData = {
          author_id: userId, // Foreign key to the 'users' table
          author_wallet: authInfo.wallet_address,
          title: entryTitle,
          content: transcribedText,
          has_audio: !!audioBlob && !!audioUrl, // Only true if audio exists AND upload succeeded
          audio_url: audioUrl, // Null if no audio or upload failed
          likes: 0,
          comments_count: 0,
          shares: 0,
          tags: [], // Default empty array
          mood: "neutral", // Default mood
          // We are NOT sending `token_id`, which is correct.
        };

        console.log("Inserting story data into database:", storyData);

        // Step 3: Insert the story data into the 'stories' table
        const { error: insertError } = await supabase
          ?.from("stories")
          .insert([storyData]); // Note: insert still expects an array

        if (insertError) {
          // This is a "hard" failure. We must stop and reject the promise.
          console.error("Database insert error:", insertError);
          // Throw an error, which will be caught by toast.promise's `error` block
          throw new Error(`Database save failed: ${insertError.message}`);
        }

        // If we get here, everything worked.
        console.log("Story saved successfully to database.");
        // This is the message that will be passed to the `success` handler
        return "Story saved successfully!";
      } catch (err) {
        // This is the safety net. It catches the `throw new Error` above
        // OR any other unexpected error (e.g., network timeout)
        console.error("An unexpected error occurred during save:", err);
        // Re-throw the error so toast.promise can catch it.
        if (err instanceof Error) {
          throw err; // Pass the original error message
        }
        throw new Error("An unknown error occurred while saving.");
      }
    };

    // Pass the *execution* of your async function to toast.promise
    toast.promise(promiseToSave(), {
      loading: "Saving your story...", // Changed message to be more accurate
      success: (message) => {
        setIsProcessing(false);
        // Reset the form on success
        setTranscribedText("");
        setEntryTitle("");
        setAudioBlob(null);
        setRecordingDuration(0);
        return String(message);
      },
      error: (err) => {
        setIsProcessing(false);
        // `err` is the Error object we threw.
        // `err.message` will contain the clean error string.
        return err.message;
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

  // --- Main Render ---
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          {" "}
          <Mic className="w-8 h-8 text-white" />{" "}
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
          {" "}
          <CardTitle className="flex items-center justify-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>Audio Recording</span>
          </CardTitle>{" "}
          <CardDescription>
            Speak naturally and let AI handle transcription
          </CardDescription>{" "}
        </CardHeader>
        <CardContent className="space-y-6">
          {" "}
          <div className="text-center space-y-4">
            {" "}
            <AnimatePresence>
              {" "}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-4 py-2 rounded-full"
                >
                  {" "}
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />{" "}
                  <span className="font-medium">Recording</span>{" "}
                  <Clock className="w-4 h-4" />{" "}
                  <span className="font-mono">
                    {formatDuration(recordingDuration)}
                  </span>{" "}
                </motion.div>
              )}{" "}
            </AnimatePresence>{" "}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {" "}
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
                {" "}
                {isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}{" "}
              </Button>{" "}
            </motion.div>{" "}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              {" "}
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4" />
                <span>Multi-language</span>
              </div>{" "}
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>AI Transcription</span>
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </CardContent>
      </Card>
      {/* Transcription & Title */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Entry Title</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-0">
          {" "}
          <Input
            placeholder="Give your story a title..."
            value={entryTitle}
            onChange={(e) => setEntryTitle(e.target.value)}
            className="text-lg"
            disabled={isProcessing}
          />{" "}
        </CardContent>
        <CardHeader>
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Transcription</span>
            </CardTitle>{" "}
            <div className="flex items-center space-x-2">
              {" "}
              {audioBlob && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600"
                >
                  Audio Captured
                </Badge>
              )}{" "}
              {isProcessing && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-600"
                >
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </CardHeader>
        <CardContent className="space-y-4">
          {" "}
          <Textarea
            placeholder="Your transcribed text will appear here, or you can type directly..."
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            className="min-h-[200px] text-base leading-relaxed resize-none"
            disabled={isProcessing}
          />{" "}
          <Separator />{" "}
          <div className="flex flex-col sm:flex-row gap-4">
            {" "}
            <Button
              onClick={enhanceText}
              disabled={!transcribedText.trim() || isProcessing}
              variant="outline"
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Enhance with AI
            </Button>{" "}
            <Button
              onClick={saveEntry}
              disabled={
                !transcribedText.trim() || !entryTitle.trim() || isProcessing
              }
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              {" "}
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}{" "}
              Save Entry{" "}
            </Button>{" "}
          </div>{" "}
        </CardContent>
      </Card>
      {/* Recording Tips */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-lg">Recording Tips</CardTitle>
        </CardHeader>
        <CardContent>
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            {" "}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">1</span>
              </div>
              <p>Speak clearly and moderately</p>
            </div>{" "}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">2</span>
              </div>
              <p>Find a quiet environment</p>
            </div>{" "}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">3</span>
              </div>
              <p>You can edit the text before saving</p>
            </div>{" "}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">4</span>
              </div>
              <p>Stories saved securely on blockchain</p>
            </div>{" "}
          </div>{" "}
        </CardContent>
      </Card>
    </div>
  );
}
