'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useApp } from '../components/Provider';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Mic,
  BookOpen,
  Users,
  Coins,
  TrendingUp,
  Award,
  Shield,
  Globe,
  Brain,
  Quote,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const CONTRACTS = {
  NFT: "0xF61E9D022Df3835FdFbDD97069F293a39783635B",
};

// Features - simplified, no individual gradients
const features = [
  {
    icon: Mic,
    title: 'Voice Capture',
    description: 'Record your stories naturally with advanced AI transcription supporting multiple languages.',
  },
  {
    icon: Shield,
    title: 'Blockchain Permanence',
    description: 'Store entries on-chain for permanent, secure ownership that outlasts any platform.',
  },
  {
    icon: BookOpen,
    title: 'Digital Books',
    description: 'Compile your entries into beautiful digital books and mint them as collectible NFTs.',
  },
  {
    icon: Coins,
    title: 'Earn Rewards',
    description: 'Get $STORY tokens based on likes and community engagement with your stories.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Share public stories, follow other journalers, and build your storytelling reputation.',
  },
  {
    icon: Brain,
    title: 'Cognitive Insights',
    description: 'AI reveals patterns, emotions, and life themes across your stories over time.',
  },
];

const stats = [
  { label: 'Stories Created', value: '12.5K', icon: BookOpen },
  { label: 'Active Users', value: '2.8K', icon: Users },
  { label: '$STORY Earned', value: '45.2K', icon: Coins },
  { label: 'Books Minted', value: '892', icon: Award },
];

export default function HomePage() {
  const { user, isConnected } = useApp();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();

  return (
    <div className="space-y-24">
      {/* Hero Section - Single orchestrated entrance animation */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-8 pt-8 md:pt-16"
      >
        <div className="space-y-6">
          {/* Subtle badges - no animations, no gradients */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="badge-subtle inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by AI & Blockchain
            </span>
            <a
              href={`https://sepolia.basescan.org/address/${CONTRACTS.NFT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="badge-subtle inline-flex items-center gap-2 hover:border-[hsl(var(--memory-500)/0.3)] transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Verified on Base
            </a>
          </div>

          {/* Main heading with display font */}
          <h1 className="heading-display-lg text-4xl md:text-6xl lg:text-7xl">
            <span className="text-gradient-cosmic">
              Your Life Stories,
            </span>
            <br />
            <span className="text-foreground">
              Immortalized Forever
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Record your experiences with AI transcription, store them permanently on the blockchain,
            and discover patterns in your own narrative over time.
          </p>
        </div>

        {/* CTA Buttons - ONE gradient button only (primary CTA) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {isConnected ? (
            <Button
              size="lg"
              onClick={() => router.push('/record')}
              className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white text-lg px-8 h-12"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => openConnectModal?.()}
              className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white text-lg px-8 h-12"
            >
              Connect Wallet to Start
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/social')}
            className="text-lg px-8 h-12 border-[hsl(var(--memory-500)/0.2)] hover:border-[hsl(var(--memory-500)/0.4)] hover:bg-[hsl(var(--memory-500)/0.05)]"
          >
            <Globe className="w-5 h-5 mr-2" />
            Explore Stories
          </Button>
        </div>
      </motion.section>

      {/* Stats Section - Static, no staggered animations */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = [
              'text-[hsl(var(--memory-500))]',
              'text-[hsl(var(--insight-500))]',
              'text-[hsl(var(--story-500))]',
              'text-[hsl(var(--growth-500))]',
            ][index];
            return (
              <Card key={stat.label} className="card-elevated text-center hover-shadow-subtle">
                <CardContent className="pt-6">
                  <Icon className={`w-7 h-7 mx-auto mb-2 ${colors}`} />
                  <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* User Dashboard - Only shown when connected */}
      {isConnected && user && (
        <section>
          <Card className="card-canonical border-[hsl(var(--story-500)/0.3)]">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="heading-section text-2xl text-gradient-story">Welcome back</CardTitle>
                  <CardDescription>Ready to capture your next story?</CardDescription>
                </div>
                <div className="flex gap-2">
                  {user.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="badge-subtle">
                      <Award className="w-3 h-3 mr-1" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-[hsl(var(--growth-500))]">{user.storyTokens}</div>
                  <div className="text-sm text-muted-foreground">$STORY Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-semibold text-[hsl(var(--memory-500))]">{user.balance} ETH</div>
                  <div className="text-sm text-muted-foreground">Wallet Balance</div>
                </div>
                <div className="flex items-center justify-center">
                  <Button
                    onClick={() => router.push('/record')}
                    className="btn-solid-memory"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record New Story
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Features Grid - Static, typography-led */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="heading-section text-3xl md:text-4xl text-foreground">
            Built for <span className="text-gradient-memory">Modern Storytelling</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered capture, blockchain permanence, and cognitive insights that help you understand your own narrative.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="card-elevated hover-shadow-subtle">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--memory-500)/0.1)] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-[hsl(var(--memory-500))]" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works - Static timeline */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="heading-section text-3xl md:text-4xl text-foreground">
            How It <span className="text-gradient-insight">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From voice to blockchain in four simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-[hsl(var(--memory-500)/0.2)]" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, icon: Mic, title: 'Record', description: 'Speak your story naturally' },
              { step: 2, icon: Brain, title: 'Analyze', description: 'AI extracts insights' },
              { step: 3, icon: Shield, title: 'Own', description: 'Store on blockchain' },
              { step: 4, icon: TrendingUp, title: 'Grow', description: 'Discover patterns' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="relative inline-flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--void-surface))] border border-[hsl(var(--memory-500)/0.3)] flex items-center justify-center text-sm font-medium text-[hsl(var(--memory-500))] mb-4">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[hsl(var(--memory-500)/0.1)] flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[hsl(var(--memory-500))]" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials - Static cards */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="heading-section text-3xl md:text-4xl text-foreground">
            From Our <span className="text-gradient-story">Community</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear how iStory is helping people preserve and understand their memories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "The AI insights revealed patterns in my journaling I never noticed. It's like having a mirror for my thoughts.",
              name: "Sarah Chen",
              role: "Daily Journaler",
              initials: "SC",
            },
            {
              quote: "Finally, my stories are mine forever. No platform can delete them, no company can shut down. True ownership.",
              name: "Marcus Johnson",
              role: "Web3 Creator",
              initials: "MJ",
            },
            {
              quote: "I've minted my travel journals as NFT books. My grandchildren will inherit these memories on the blockchain.",
              name: "Elena Rodriguez",
              role: "Travel Writer",
              initials: "ER",
            },
          ].map((testimonial) => (
            <Card key={testimonial.name} className="card-elevated hover-shadow-subtle">
              <CardContent className="pt-6 space-y-4">
                <Quote className="w-6 h-6 text-[hsl(var(--memory-500)/0.3)]" />
                <p className="text-muted-foreground italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--memory-500)/0.1)]">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--memory-500)/0.15)] flex items-center justify-center text-[hsl(var(--memory-500))] font-medium text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA - Subtle, not overwhelming */}
      <section className="text-center space-y-8 py-16 px-6 bg-[hsl(var(--void-light))] dark:bg-[hsl(var(--void-medium))] rounded-2xl border border-[hsl(var(--memory-500)/0.1)]">
        <h2 className="heading-section text-3xl md:text-4xl text-foreground">
          Start Your Story Today
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Join a community that values authentic storytelling and permanent memory preservation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/social')}
            className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white px-8 h-12"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Explore Community
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/library')}
            className="px-8 h-12 border-[hsl(var(--memory-500)/0.2)] hover:border-[hsl(var(--memory-500)/0.4)] hover:bg-[hsl(var(--memory-500)/0.05)]"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            View Library
          </Button>
        </div>
      </section>
    </div>
  );
}
