"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import { StoryMetadata, EmotionalTone, LifeDomain, AnalysisStatus } from "@/app/types";
import {
  Sparkles,
  Loader2,
  Brain,
  Heart,
  MapPin,
  Users,
  Clock,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Star,
  Hourglass,
} from "lucide-react";

interface StoryInsightsProps {
  storyId: string;
  storyText: string;
}

// Color mappings for emotional tones
const emotionColors: Record<EmotionalTone, string> = {
  reflective: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  joyful: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  anxious: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  hopeful: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  melancholic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  grateful: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  frustrated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  peaceful: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  excited: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  uncertain: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

// Color mappings for life domains
const domainColors: Record<LifeDomain, string> = {
  work: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  relationships: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  health: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  identity: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  growth: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  creativity: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  spirituality: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  family: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  adventure: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  learning: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export function StoryInsights({ storyId, storyText }: StoryInsightsProps) {
  const [metadata, setMetadata] = useState<StoryMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, [storyId]);

  const fetchMetadata = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/stories/${storyId}/metadata`);
      if (!res.ok) throw new Error("Failed to fetch metadata");

      const data = await res.json();
      setMetadata(data.metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setIsAnalyzing(true);

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, storyText }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data = await res.json();
      setMetadata(data.metadata);
      toast.success("Insights generated!");
    } catch (error: unknown) {
      console.error("Analysis error:", error);
      const message = error instanceof Error ? error.message : "Failed to generate insights";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending state - analysis is queued
  if (metadata?.analysis_status === 'pending') {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-0 shadow-lg">
        <CardContent className="py-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
            <Hourglass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analysis Queued
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your story is waiting to be analyzed. This usually takes a few moments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing state - analysis is in progress
  if (metadata?.analysis_status === 'processing') {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg">
        <CardContent className="py-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analyzing Your Story
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI is extracting themes, emotions, and patterns from your story...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed state - analysis failed, show retry button
  if (metadata?.analysis_status === 'failed') {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-0 shadow-lg">
        <CardContent className="py-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analysis Failed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Something went wrong while analyzing your story. Please try again.
            </p>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isAnalyzing}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No metadata - show generate button
  if (!metadata) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-0 shadow-lg">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Insights Available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Let AI analyze your story to extract themes, emotions, and patterns.
            </p>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Has metadata - display insights
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI Insights</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateInsights}
              disabled={isAnalyzing}
              className="text-gray-500 hover:text-purple-600"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brief Insight */}
          {metadata.brief_insight && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  &ldquo;{metadata.brief_insight}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Emotional Tone & Life Domain */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-gray-400" />
              <Badge className={emotionColors[metadata.emotional_tone]}>
                {metadata.emotional_tone}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <Badge className={domainColors[metadata.life_domain]}>
                {metadata.life_domain}
              </Badge>
            </div>
            {/* Key life moment badge for high significance stories */}
            {metadata.significance_score > 0.7 && (
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500" />
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Key life moment
                </Badge>
              </div>
            )}
          </div>

          {/* Themes */}
          {metadata.themes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Sparkles className="w-4 h-4" />
                <span>Themes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.themes.map((theme) => (
                  <Badge
                    key={theme}
                    variant="secondary"
                    className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Intensity</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(metadata.intensity_score * 100)}%
                </span>
              </div>
              <Progress
                value={metadata.intensity_score * 100}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Significance</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(metadata.significance_score * 100)}%
                </span>
              </div>
              <Progress
                value={metadata.significance_score * 100}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Entities */}
          {(metadata.people_mentioned.length > 0 ||
            metadata.places_mentioned.length > 0 ||
            metadata.time_references.length > 0) && (
            <div className="pt-4 border-t dark:border-gray-700 space-y-3">
              {metadata.people_mentioned.length > 0 && (
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.people_mentioned.map((person) => (
                      <span
                        key={person}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        {person}
                        {metadata.people_mentioned.indexOf(person) <
                          metadata.people_mentioned.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {metadata.places_mentioned.length > 0 && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.places_mentioned.map((place) => (
                      <span
                        key={place}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        {place}
                        {metadata.places_mentioned.indexOf(place) <
                          metadata.places_mentioned.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {metadata.time_references.length > 0 && (
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.time_references.map((time) => (
                      <span
                        key={time}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        {time}
                        {metadata.time_references.indexOf(time) <
                          metadata.time_references.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
