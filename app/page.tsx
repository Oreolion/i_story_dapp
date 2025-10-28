'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
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
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'AI Speech-to-Text',
    description: 'Record your stories with advanced AI transcription supporting multiple languages.',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Shield,
    title: 'Blockchain Security',
    description: 'Store your journal entries as NFTs on the blockchain for permanent, secure ownership.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BookOpen,
    title: 'Digital Books',
    description: 'Compile your entries into beautiful digital books and mint them as collectible NFTs.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Coins,
    title: 'Earn $STORY Tokens',
    description: 'Get rewarded with tokens based on likes and community engagement with your stories.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Social Community',
    description: 'Share public stories, follow other journalers, and build your storytelling reputation.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Sparkles,
    title: 'AI Enhancements',
    description: 'Get creative prompts and polish your writing with AI-powered editing suggestions.',
    gradient: 'from-cyan-500 to-blue-500',
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
  

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 px-4 py-2 rounded-full"
          >
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-300">
              Powered by AI & Blockchain
            </span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Your Life Stories,
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Immortalized Forever
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Record your daily experiences with AI-powered speech-to-text, store them securely on the blockchain, 
            and earn rewards as your stories inspire others in our vibrant community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isConnected ? (
            <Link href="/record">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-8 py-3">
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            </Link>
          ) : (
            <Button 
              size="lg" 
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-8 py-3"
            >
              Connect Wallet to Start
            </Button>
          )}
          
          <Link href="/social">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              <Globe className="w-5 h-5 mr-2" />
              Explore Stories
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <Card className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* User Dashboard */}
      {isConnected && user && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Welcome back!</CardTitle>
                  <CardDescription>Ready to share your next story?</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {user.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="bg-purple-100 dark:bg-purple-900">
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
                  <div className="text-3xl font-bold text-emerald-600">{user.storyTokens}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">$STORY Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{user.balance} ETH</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</div>
                </div>
                <div className="text-center">
                  <Link href="/record">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                      <Mic className="w-4 h-4 mr-2" />
                      Record New Story
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Features Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Powerful Features for Modern Storytelling
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
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
                <Card className="h-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}>
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

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="text-center space-y-8 py-16 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-emerald-600/10 rounded-3xl"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Join the Storytelling Revolution
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Start your journey today and be part of a community that values authentic storytelling and creative expression.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/social">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-8 py-3">
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Community
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              <BookOpen className="w-5 h-5 mr-2" />
              View Library
            </Button>
          </Link>
        </div>
      </motion.section>
    </div>
  );
}