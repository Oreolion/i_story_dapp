'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useApp } from '../components/Provider';
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
  Zap,
  Shield,
  Globe,
  Sparkles,
  ExternalLink,
  Brain,
  Quote,
  ArrowRight
} from 'lucide-react';

// Add this constant for your contract address
const CONTRACTS = {
  NFT: "0xF61E9D022Df3835FdFbDD97069F293a39783635B",
};

// Features now use Memory Space design tokens
const features = [
  {
    icon: Mic,
    title: 'AI Speech-to-Text',
    description: 'Record your stories with advanced AI transcription supporting multiple languages.',
    colorClass: 'bg-gradient-memory',
    glowClass: 'hover-glow-memory',
  },
  {
    icon: Shield,
    title: 'Blockchain Security',
    description: 'Store your journal entries as NFTs on the blockchain for permanent, secure ownership.',
    colorClass: 'bg-gradient-growth',
    glowClass: 'hover-glow-story',
  },
  {
    icon: BookOpen,
    title: 'Digital Books',
    description: 'Compile your entries into beautiful digital books and mint them as collectible NFTs.',
    colorClass: 'bg-gradient-story',
    glowClass: 'hover-glow-story',
  },
  {
    icon: Coins,
    title: 'Earn $STORY Tokens',
    description: 'Get rewarded with tokens based on likes and community engagement with your stories.',
    colorClass: 'bg-gradient-to-r from-[hsl(var(--story-500))] to-[hsl(var(--story-400))]',
    glowClass: 'hover-glow-canonical',
  },
  {
    icon: Users,
    title: 'Social Community',
    description: 'Share public stories, follow other journalers, and build your storytelling reputation.',
    colorClass: 'bg-gradient-to-r from-[hsl(var(--tone-grateful))] to-[hsl(var(--tone-excited))]',
    glowClass: 'hover-glow-insight',
  },
  {
    icon: Brain,
    title: 'Cognitive Insights',
    description: 'AI analyzes your stories to reveal patterns, emotions, and life themes over time.',
    colorClass: 'bg-gradient-insight',
    glowClass: 'hover-glow-insight',
  },
];

const stats = [
  { label: 'Stories Created', value: '12.5K', icon: BookOpen },
  { label: 'Active Users', value: '2.8K', icon: Users },
  { label: '$STORY Earned', value: '45.2K', icon: Coins },
  { label: 'Books Minted', value: '892', icon: Award },
];

export default function HomePage() {
  const { user, isConnected, connectWallet } = useApp();
  const router = useRouter();

  return (
    <div className="space-y-16">
      {/* Hero Section - Memory Space Theme */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 relative"
      >
        {/* Ambient glow effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--memory-500)/0.1)] rounded-full blur-3xl animate-pulse-subtle" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--insight-500)/0.1)] rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
        </div>

        <div className="space-y-6">

          {/* Badges Container (Side by Side) - Memory Space styled */}
          <div className="flex flex-wrap justify-center gap-4">

            {/* Badge 1: Powered by AI - Using insight colors */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center space-x-2 bg-[hsl(var(--insight-500)/0.15)] border border-[hsl(var(--insight-500)/0.3)] px-4 py-2 rounded-full hover-glow-insight transition-all"
            >
              <Zap className="w-4 h-4 text-[hsl(var(--insight-500))]" />
              <span className="text-sm font-medium text-[hsl(var(--insight-400))]">
                Powered by AI & Blockchain
              </span>
            </motion.div>

            {/* Badge 2: Verified on Base - Using memory colors */}
            <motion.a
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              href={`https://sepolia.basescan.org/address/${CONTRACTS.NFT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-[hsl(var(--void-surface))] border border-[hsl(var(--memory-500)/0.3)] px-4 py-2 rounded-full hover-glow-memory transition-all cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-[hsl(var(--memory-500))]" />
              <span className="text-sm font-medium text-[hsl(var(--memory-400))] group-hover:text-[hsl(var(--memory-300))] transition-colors">
                Verified on Base Sepolia
              </span>
              <ExternalLink className="w-3 h-3 text-[hsl(var(--memory-600))] group-hover:text-[hsl(var(--memory-400))]" />
            </motion.a>

          </div>

          {/* Main heading with Memory Space gradient */}
          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="text-gradient-cosmic">
              Your Life Stories,
            </span>
            <br />
            <span className="text-foreground">
              Immortalized Forever
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Record your daily experiences with AI-powered speech-to-text, store them securely on the blockchain,
            and earn rewards as your stories inspire others in our vibrant community.
          </p>
        </div>

        {/* CTA Buttons - Memory Space styled */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isConnected ? (
            <Button
              size="lg"
              onClick={() => router.push('/record')}
              className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white text-lg px-8 py-3 shadow-lg hover:shadow-[var(--glow-memory)] transition-all"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={connectWallet}
              className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white text-lg px-8 py-3 shadow-lg hover:shadow-[var(--glow-memory)] transition-all"
            >
              Connect Wallet to Start
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/social')}
            className="text-lg px-8 py-3 border-[hsl(var(--memory-500)/0.3)] hover:border-[hsl(var(--memory-500))] hover:bg-[hsl(var(--memory-500)/0.1)] transition-all"
          >
            <Globe className="w-5 h-5 mr-2" />
            Explore Stories
          </Button>
        </div>
      </motion.section>

      {/* Stats Section - Memory Space Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = [
              { icon: 'text-[hsl(var(--memory-500))]', glow: 'hover-glow-memory' },
              { icon: 'text-[hsl(var(--insight-500))]', glow: 'hover-glow-insight' },
              { icon: 'text-[hsl(var(--story-500))]', glow: 'hover-glow-story' },
              { icon: 'text-[hsl(var(--growth-500))]', glow: 'hover-glow-story' },
            ][index];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <Card className={`card-elevated text-center backdrop-blur-sm ${colors.glow}`}>
                  <CardContent className="pt-6">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${colors.icon}`} />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* User Dashboard - Memory Space Canonical Card */}
      {isConnected && user && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Card className="card-canonical border-[hsl(var(--story-500)/0.3)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gradient-story">Welcome back!</CardTitle>
                  <CardDescription>Ready to share your next story?</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {user.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="bg-[hsl(var(--insight-500)/0.15)] text-[hsl(var(--insight-400))] border border-[hsl(var(--insight-500)/0.3)]">
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
                  <div className="text-3xl font-bold text-[hsl(var(--growth-500))]">{user.storyTokens}</div>
                  <div className="text-sm text-muted-foreground">$STORY Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[hsl(var(--memory-500))]">{user.balance} ETH</div>
                  <div className="text-sm text-muted-foreground">Wallet Balance</div>
                </div>
                <div className="text-center">
                  <Button
                    onClick={() => router.push('/record')}
                    className="w-full bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record New Story
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Features Grid - Memory Space Design */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Powerful Features for <span className="text-gradient-memory">Modern Storytelling</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of journaling with cutting-edge AI and blockchain technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className={`card-elevated h-full backdrop-blur-sm ${feature.glowClass} transition-all duration-300`}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${feature.colorClass} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How It <span className="text-gradient-insight">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From voice to blockchain in four simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connection line (hidden on mobile) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(var(--memory-500)/0.3)] via-[hsl(var(--insight-500)/0.3)] to-[hsl(var(--growth-500)/0.3)] -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {[
              {
                step: 1,
                icon: Mic,
                title: 'Record',
                description: 'Speak your story naturally using voice recording',
                colorClass: 'bg-gradient-memory',
                glowClass: 'hover-glow-memory',
              },
              {
                step: 2,
                icon: Brain,
                title: 'Analyze',
                description: 'AI extracts themes, emotions & insights',
                colorClass: 'bg-gradient-insight',
                glowClass: 'hover-glow-insight',
              },
              {
                step: 3,
                icon: Shield,
                title: 'Own',
                description: 'Store on blockchain, mint as NFT',
                colorClass: 'bg-gradient-story',
                glowClass: 'hover-glow-story',
              },
              {
                step: 4,
                icon: TrendingUp,
                title: 'Grow',
                description: 'Discover patterns over time',
                colorClass: 'bg-gradient-growth',
                glowClass: 'hover-glow-story',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                  className="relative"
                >
                  <Card className={`card-elevated text-center ${item.glowClass} transition-all duration-300`}>
                    <CardContent className="pt-8 pb-6 space-y-4">
                      {/* Step number badge */}
                      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${item.colorClass} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {item.step}
                      </div>

                      <div className={`w-14 h-14 mx-auto rounded-xl ${item.colorClass} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Stories from Our <span className="text-gradient-story">Community</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how iStory is transforming the way people preserve their memories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "The AI insights revealed patterns in my journaling I never noticed. It's like having a therapist who's always listening.",
              name: "Sarah Chen",
              role: "Daily Journaler",
              avatar: "SC",
            },
            {
              quote: "Finally, my stories are mine forever. No platform can delete them, no company can shut down. True digital ownership.",
              name: "Marcus Johnson",
              role: "Web3 Creator",
              avatar: "MJ",
            },
            {
              quote: "I've minted my travel journals as NFT books. My grandchildren will inherit these memories on the blockchain.",
              name: "Elena Rodriguez",
              role: "Travel Writer",
              avatar: "ER",
            },
          ].map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 + index * 0.1 }}
            >
              <Card className="card-elevated h-full hover-glow-insight transition-all duration-300">
                <CardContent className="pt-6 space-y-4">
                  <Quote className="w-8 h-8 text-[hsl(var(--insight-500)/0.5)]" />

                  <p className="text-muted-foreground italic leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  <div className="flex items-center space-x-3 pt-4 border-t border-[hsl(var(--memory-500)/0.1)]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--memory-500))] to-[hsl(var(--insight-500))] flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section - Memory Space Gradient */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="text-center space-y-8 py-16 bg-gradient-to-r from-[hsl(var(--memory-500)/0.1)] via-[hsl(var(--insight-500)/0.1)] to-[hsl(var(--story-500)/0.1)] rounded-3xl border border-[hsl(var(--memory-500)/0.2)] relative overflow-hidden"
      >
        {/* Subtle animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--insight-500)/0.05)] rounded-full blur-3xl animate-float-gentle" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--memory-500)/0.05)] rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Join the <span className="text-gradient-insight">Storytelling Revolution</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start your journey today and be part of a community that values authentic storytelling and creative expression.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/social')}
            className="bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] hover:from-[hsl(var(--memory-500))] hover:to-[hsl(var(--insight-500))] text-white text-lg px-8 py-3 shadow-lg hover:shadow-[var(--glow-memory)] transition-all"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Explore Community
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/library')}
            className="text-lg px-8 py-3 border-[hsl(var(--story-500)/0.3)] hover:border-[hsl(var(--story-500))] hover:bg-[hsl(var(--story-500)/0.1)] transition-all"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            View Library
          </Button>
        </div>
      </motion.section>
    </div>
  );
}