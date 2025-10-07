"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/components/Provider";
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
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function RecordPage() {
  const { user, isConnected } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);

        // Mock transcription - in real app, send to AssemblyAI or Google Cloud Speech
        setIsProcessing(true);
        setTimeout(() => {
          setTranscribedText(
            "Today was an incredible day. I woke up early and went for a walk in the park. The morning mist was still hanging over the lake, and I could hear birds chirping in the trees. It reminded me of how important it is to take time for these simple moments of beauty in our busy lives. I met an elderly gentleman who was feeding the ducks, and we had a wonderful conversation about his youth and the changes he's witnessed over the decades. These unexpected human connections are what make life truly meaningful."
          );
          setIsProcessing(false);
          toast.success("Recording transcribed successfully!");
        }, 2000);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

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

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      toast.success("Recording stopped");
    }
  };

  const enhanceText = () => {
    // Mock AI enhancement
    setIsProcessing(true);
    setTimeout(() => {
      setTranscribedText(
        (prev) =>
          prev +
          "\n\n[AI Enhanced]: This entry beautifully captures the essence of mindful living and the value of unexpected human connections. The imagery of morning mist and birdsong creates a peaceful, contemplative mood that perfectly complements the meaningful encounter with the elderly gentleman."
      );
      setIsProcessing(false);
      toast.success("Text enhanced with AI suggestions!");
    }, 1500);
  };

  const saveEntry = async () => {
    if (!transcribedText.trim()) {
      toast.error("Please add some content to save");
      return;
    }

    setIsProcessing(true);

    try {
      // Mock saving to blockchain/IPFS
      setTimeout(() => {
        toast.success("Journal entry saved to blockchain!");
        setIsProcessing(false);
        setTranscribedText("");
        setAudioBlob(null);
        setRecordingDuration(0);
      }, 2000);
    } catch (error) {
      toast.error("Failed to save entry");
      setIsProcessing(false);
    }
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
            Connect your Web3 wallet to start recording and storing your stories
            on the blockchain.
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
          Capture your thoughts and experiences with AI-powered transcription
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
            Speak naturally and let AI handle the transcription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Status */}
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
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
                <span>Multi-language support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Real-time transcription</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Entry Title</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Your transcribed text will appear here, or you can type directly..."
            value={entryTitle}
            onChange={(e) => setEntryTitle(e.target.value)}
            className="min-h-[50px] text-base leading-relaxed resize-none"
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
                  <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                  Processing
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
              disabled={!transcribedText.trim() || isProcessing}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isProcessing ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Saving to Blockchain...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Entry
                </>
              )}
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
              <p>
                Speak clearly and at a moderate pace for better transcription
                accuracy
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">2</span>
              </div>
              <p>Find a quiet environment to minimize background noise</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">3</span>
              </div>
              <p>You can edit the transcribed text before saving your story</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">4</span>
              </div>
              <p>Each story is stored as an NFT on the blockchain forever</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
