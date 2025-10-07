// AI service utilities for speech-to-text and content enhancement
export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface EnhancementSuggestion {
  type: 'grammar' | 'style' | 'clarity' | 'tone';
  original: string;
  suggested: string;
  explanation: string;
}

export interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  category: 'reflection' | 'creative' | 'gratitude' | 'goals' | 'memories';
  mood?: string;
}

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // In production, this would call AssemblyAI or Google Cloud Speech-to-Text
      const mockTranscriptions = [
        "Today I experienced something truly remarkable. Walking through the old part of town, I discovered a hidden garden that seemed untouched by time. The way the light filtered through the ancient oak trees created patterns on the ground that looked almost magical.",
        
        "The conversation I had with my mentor today opened my eyes to new possibilities. We discussed the importance of taking calculated risks and how stepping outside our comfort zone is essential for personal growth.",
        
        "There's something powerful about quiet mornings before the world wakes up. I find myself most creative during these peaceful hours, when my thoughts can flow freely without distractions.",
        
        "Looking back on this year, I'm amazed by how much has changed. The challenges I faced seemed insurmountable at the time, but they taught me resilience and showed me strengths I didn't know I had."
      ];

      const randomText = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        text: randomText,
        confidence: 0.92 + Math.random() * 0.07, // 92-99% confidence
        language: 'en-US',
        duration: Math.floor(audioBlob.size / 1000) // Mock duration based on file size
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async enhanceText(text: string): Promise<{
    enhanced: string;
    suggestions: EnhancementSuggestion[];
  }> {
    try {
      // Mock AI text enhancement
      const suggestions: EnhancementSuggestion[] = [
        {
          type: 'style',
          original: 'really good',
          suggested: 'exceptional',
          explanation: 'More precise and impactful word choice'
        },
        {
          type: 'clarity',
          original: 'and stuff',
          suggested: 'and similar experiences',
          explanation: 'More specific and professional language'
        }
      ];

      const enhanced = text + "\n\n[AI Enhancement]: This reflection beautifully captures a moment of personal insight. The vivid imagery and emotional depth make it particularly engaging for readers.";

      await new Promise(resolve => setTimeout(resolve, 1500));

      return { enhanced, suggestions };
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw new Error('Failed to enhance text');
    }
  }

  async generatePrompts(mood?: string, category?: string): Promise<WritingPrompt[]> {
    try {
      const allPrompts: WritingPrompt[] = [
        {
          id: '1',
          title: 'Morning Gratitude',
          prompt: 'What are three things you\'re grateful for today, and why do they matter to you?',
          category: 'gratitude',
          mood: 'peaceful'
        },
        {
          id: '2',
          title: 'Future Self',
          prompt: 'Write a letter to yourself five years from now. What do you hope to tell your future self?',
          category: 'goals',
          mood: 'hopeful'
        },
        {
          id: '3',
          title: 'Childhood Memory',
          prompt: 'Describe a vivid memory from your childhood that still influences how you see the world today.',
          category: 'memories',
          mood: 'nostalgic'
        },
        {
          id: '4',
          title: 'Creative Challenge',
          prompt: 'If you could have any superpower for one day, what would it be and how would you use it?',
          category: 'creative',
          mood: 'playful'
        },
        {
          id: '5',
          title: 'Life Lesson',
          prompt: 'What\'s the most important lesson you\'ve learned recently, and how did you learn it?',
          category: 'reflection',
          mood: 'thoughtful'
        }
      ];

      // Filter by category and mood if provided
      let filteredPrompts = allPrompts;
      if (category) {
        filteredPrompts = filteredPrompts.filter(p => p.category === category);
      }
      if (mood) {
        filteredPrompts = filteredPrompts.filter(p => p.mood === mood);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      return filteredPrompts.slice(0, 3); // Return 3 prompts
    } catch (error) {
      console.error('Error generating prompts:', error);
      throw new Error('Failed to generate writing prompts');
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
  }> {
    try {
      // Mock sentiment analysis
      const sentiments = ['positive', 'neutral', 'negative'] as const;
      const emotions = ['joy', 'hope', 'contemplation', 'nostalgia', 'excitement', 'gratitude'];
      
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      const confidence = 0.7 + Math.random() * 0.3;
      const selectedEmotions = emotions.slice(0, Math.floor(Math.random() * 3) + 1);

      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        sentiment,
        confidence,
        emotions: selectedEmotions
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }
}

export const aiService = AIService.getInstance();