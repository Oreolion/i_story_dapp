# Speak Your Story (iStory): AI-Powered Blockchain Journaling App

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-DB-orange?logo=supabase)
![Wagmi](https://img.shields.io/badge/Wagmi-2-green?logo=ethereum)
![Viem](https://img.shields.io/badge/Viem-2-green?logo=viem)
![Base](https://img.shields.io/badge/Base-L2-blue?logo=base)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Latest-purple?logo=framer)

## Overview

iStory is an innovative AI-powered web3 application that empowers users to chronicle their daily lives through voice journaling, immortalize their personal narratives on the blockchain, and monetize their stories in a decentralized ecosystem. Built on Base, a secure and scalable Layer 2 solution on Ethereum, this app ensures low-cost, fast transactions while maintaining Ethereum's security.

In a world where history has often been manipulated by conquerors, victors and dominating empires, iStory reclaims the power of authentic storytelling. Users can broadcast their unfiltered truths forever on the blockchain, ensuring tamper-proof preservation, while earning rewards through community engagement and NFT-based sales.

## Key Features

### ✨ Core Functionality

    Voice-to-Text Journaling: Record stories using browser-based audio capture with AI-powered transcription
    AI Enhancements: Get creative prompts, grammar polishing, and AI-generated suggestions
    Blockchain Immortality: Mint stories as NFTs on Base (Ethereum L2) with IPFS storage
    Monetization Suite: Earn $STORY tokens from likes, tips, and paywall sales

### 💬 Social Features

    Community Social Feed: Discover and engage with other stories
    Like System: Earn rewards for community engagement ($STORY tokens)
    Tip System: Support creators directly with custom $STORY token amounts
    Comment System: Leave thoughts and build community discussions
    Follow System: Build your storytelling community
    Story Sharing: Share stories across social platforms

### 💰 Monetization

    Paywall System: Set custom prices for exclusive stories
    $STORY Token Rewards: Earn from likes and community engagement
    NFT Minting: Compile stories into digital books and mint as NFTs
    Tip Jar: Accept voluntary tips from supporters

### 📚 Library & Curation

    Personal Library: Organize all your stories and books
    Book Compilation: Combine multiple stories into digital books
    Story Filtering: Search, filter, and organize by mood, date, and tags
    Audio Storage: All recordings stored securely with public URLs

### 👤 User Profiles

    Profile Customization: Build your creator profile with bio and avatar
    Streaks & Achievements: Track daily writing streaks and earn badges
    Statistics Dashboard: View your impact and community engagement metrics
    Writing Goals: Set and track monthly story targets

**Tagline:** Speak Your Story, Mint Your Legacy

## How It Works

Follow these simple steps to start your storytelling journey:

### Step 1: Record Your Story 🎙️
Use our AI Speech-to-Text feature to easily record your thoughts and experiences. Just hit record and speak naturally—no need to write!

### Step 2: Enhance & Polish ✨
Leveraging Gemini Flash AI, get grammar corrections, creative suggestions, and writing enhancements to make your story shine.

### Step 3: Secure Your Entries 🔐
Store your stories as NFTs on the blockchain for secure and permanent ownership. Your stories are immutable and truly yours forever.

### Step 4: Share & Earn 💰
Engage with the community, share your stories, and earn $STORY tokens based on interactions. Build your audience and monetize your creativity!

## Why iStory?

History is written by the victors, but your story deserves to be heard unedited. iStory counters narrative manipulation by giving individuals the tools to create, own, and profit from their personal histories on an immutable blockchain. Whether it's a daily reflection, a life milestone, or a cultural tale, your voice becomes part of an unbreakable digital archive—all powered by the efficiency of Base Layer 2.

## Tech Stack

### Frontend

    Framework: Next.js 14 (App Router) with React 18 and TypeScript for performant, SEO-friendly experiences
    Styling: Tailwind CSS for responsive, modern UI with full dark/light mode support
    Animations: Framer Motion for smooth, professional animations and transitions
    UI Components: shadcn/ui for accessible, customizable components
    Icons: Lucide React for consistent iconography

### Blockchain & Web3

    Wallet Integration: Wagmi + RainbowKit for seamless wallet connections
    Smart Contracts: Solidity contracts deployed on Base (Ethereum L2)
    Contract Interaction: Viem for efficient blockchain interactions
    Contracts Included:
        iStoryToken.sol - ERC20 token for rewards and payments
        LikeSystem.sol - Smart contract for like-based rewards
        StoryBookNFT.sol - ERC721 NFT contract for minting story books

### Backend & Database

    Database: Supabase (PostgreSQL) for real-time data and authentication
    Storage: Supabase Storage for audio files and media
    API: Next.js API Routes for serverless functions

### AI & External Services

    Speech-to-Text: Gemini Flash for accurate voice transcription
    Text Enhancement: Gemini Flash for AI-powered writing suggestions
    Text-to-Speech: Browser Speech Synthesis API for audio playback

### Development & Deployment

    Package Manager: npm/yarn/pnpm
    Linting: ESLint with TypeScript support
    Deployment: Vercel (recommended) or any Node.js hosting

## Pages & Features

### 🏠 Home Page (/)

    Hero section showcasing app features and benefits
    Key statistics (stories created, active users, tokens earned, books minted)
    Feature cards with gradient backgrounds
    Call-to-action buttons
    Beautiful gradient animations and glassmorphism design

### 🎙️ Record Page (/record)

    Audio Recording: Mic input with duration tracking
    Real-time Transcription: AI-powered speech-to-text using Gemini Flash
    AI Enhancement: Polish and improve written content
    Text-to-Speech: Preview stories with native browser audio
    Media Management: Save audio files to Supabase Storage
    Story Metadata: Add title, mood, tags, and paywall settings
    Database Save: Store stories with author wallet and audio URLs

### 📚 Library Page (/library)

    Personal Collection: View all your recorded stories and compiled books
    Advanced Filtering: Search by title, date, mood, and tags
    Story Statistics: Track likes, views, and engagement per story
    Book Compilation: Select multiple stories to compile into PDFs
    Audio Playback: Listen to recorded stories
    Mood Badges: Visual mood indicators for each story

### 🌐 Social Page (/social)

    Community Feed: Discover stories from other users
    Featured Writers: Showcase top storytellers
    Trending Topics: View popular hashtags and themes
    Story Cards: Rich story previews with author info, likes, and engagement
    Multiple Views: Feed, Trending, and Following tabs
    Community Stats: Display active users and engagement metrics

### 👥 Profile Page (/profile)

    User Profile: Customize name, bio, location, website, and avatar
    Writing Streaks: Track daily writing consistency with visual progress
    Achievements: Earn and display badges (First Story, Community Star, etc.)
    Statistics: View total stories, likes earned, followers, and impact metrics
    Writing Goals: Set and track monthly story targets
    Settings: User account and preference management

### 📖 Story Detail Page (/story/[storyId])

    Full Story Display: Read complete story content with rich formatting
    Author Profile: View author info, badges, and follower count
    Engagement Metrics: See likes, shares, and view counts
    Like System: Blockchain-integrated like button with $STORY rewards
    Tip System: Send custom $STORY token amounts to support creators
    Paywall Support: Unlock exclusive stories with token payment
    Audio Player: Listen to story recordings if available
    Comment Section: Post and read comments from community
    Share Functionality: Share stories to social media or copy link
    Save/Bookmark: Save stories for later reading
    Edit Option: Author can edit their own stories
    Enhanced UI: Mood-based gradient headers and smooth animations

## Project Structure

i_story_dapp/
├── app/
│   ├── api/                          # API Routes
│   │   ├── ai/
│   │   │   ├── enhance/              # Text enhancement endpoint
│   │   │   └── transcribe/           # Speech-to-text endpoint
│   │   ├── auth/                     # Authentication
│   │   ├── book/
│   │   │   └── compile/              # Book compilation
│   │   ├── journal/
│   │   │   └── save/                 # Save journal entries
│   │   ├── social/
│   │   │   ├── like/                 # Like functionality
│   │   │   └── share/                # Share functionality
│   │   └── user/
│   │       └── profile/              # User profile API
│   ├── hooks/
│   │   ├── useBrowserSupabase.ts     # Supabase singleton hook
│   │   ├── useIStoryToken.ts         # Token contract interactions
│   │   ├── useLikeSystem.ts          # Like system contract
│   │   └── useStoryBookNFT.ts        # NFT contract interactions
│   ├── story/
│   │   └── [storyId]/
│   │       └── page.tsx              # Story detail page
│   ├── library/
│   │   └── page.tsx                  # User library
│   ├── profile/
│   │   └── page.tsx                  # User profile
│   ├── record/
│   │   └── page.tsx                  # Recording page
│   ├── social/
│   │   └── page.tsx                  # Social feed
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   ├── utils/
│   │   └── supabase/                 # Supabase clients
│   ├── layout.tsx                    # Root layout with Footer
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
├── components/
│   ├── Footer.tsx                    # Beautiful footer component
│   ├── Navigation.tsx                # Top navigation bar
│   ├── Provider.tsx                  # Web3 & Theme providers
│   ├── ProvidersDynamic.tsx          # Dynamic provider wrapping
│   ├── StoryCard.tsx                 # Story card component
│   ├── AuthProvider.tsx              # Auth context
│   └── ui/                           # shadcn/ui components
├── contracts/                        # Solidity smart contracts
│   ├── iStoryToken.sol
│   ├── LikeSystem.sol
│   └── StoryBookNFT.sol
├── lib/
│   ├── ai.ts                         # AI utility functions
│   ├── database.ts                   # Database helpers
│   ├── ipfs.ts                       # IPFS integration
│   ├── utils.ts                      # General utilities
│   ├── wagmi.config.ts               # Wagmi configuration
│   ├── wagmi.config.server.ts        # Server-side Wagmi config
│   └── abis/                         # Contract ABIs
├── public/                           # Static assets
├── components.json                   # shadcn/ui config
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies

## Getting Started

### Prerequisites

    Node.js 18+ with npm, yarn, or pnpm

    Supabase account with project setup (PostgreSQL database + auth)

    MetaMask or compatible Web3 wallet configured for Base network

    Base Sepolia testnet access for development

    Google API key or similar for Gemini Flash AI services

### Installation

Clone the repository:

git clone https://github.com/Oreolion/web3_Ai_iStory.git
cd i_story_dapp

Install dependencies:

npm install
# or: yarn install / pnpm install

Set up environment variables: Create a .env.local file in the root directory:

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Gemini)
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key

# Web3 & Blockchain
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.base.org

# Smart Contracts
NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_LIKE_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_STORYBOOK_NFT_ADDRESS=0x...

Set up Supabase:

    Create tables: users, stories, comments, saved_stories, likes
    Enable Row Level Security (RLS) for data privacy
    Create storage bucket story-audio for audio files
    Configure authentication with OAuth or email/password

Deploy Smart Contracts (optional for testing):

# Install Hardhat
npm install --save-dev hardhat

# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

Run development server:

npm run dev

    Open http://localhost:3000 in your browser

Quick Start Guide

    Connect Wallet: Click "Connect Wallet" using MetaMask (switch to Base network)
    Create Profile: Navigate to /profile and set up your author information
    Record Story: Go to /record, hit record button, and speak your story
    Enhance: Use AI enhancement to polish your text
    Save: Click save to store your story with audio on blockchain
    Share: Go to /social and like/tip other stories to earn $STORY tokens
    Compile: Visit /library to compile stories into a book

## Development Scripts
Command 	Description
npm run dev 	Start development server on http://localhost:3000
npm run build 	Build for production
npm run start 	Start production server
npm run lint 	Run ESLint checks
npm run lint:fix 	Fix ESLint issues automatically

## API Endpoints

### AI Endpoints

    POST /api/ai/transcribe - Convert audio to text using Gemini Flash
    POST /api/ai/enhance - Enhance story text with AI suggestions

### Story Endpoints

    POST /api/journal/save - Save story to database
    POST /api/book/compile - Compile stories into a book

### Social Endpoints

    POST /api/social/like - Like a story
    POST /api/social/share - Share story to social media

### User Endpoints

    POST /api/user/profile - Update user profile
    GET /api/user/profile - Fetch user profile

## How to Contribute

We welcome contributions from the community! Here's how to contribute:

    Fork the repository and create a feature branch:

    git checkout -b feature/your-amazing-feature

Make your changes with clear, descriptive commits:

git commit -m 'Add amazing feature: description'

Push to your branch:

git push origin feature/your-amazing-feature

    Open a Pull Request with:
        Clear description of changes
        Why this change is needed
        Any related issues or tickets

### Guidelines

    Follow the existing code style and patterns
    Ensure TypeScript types are properly defined
    Test changes locally before submitting PR
    Update documentation if needed
    Be respectful and inclusive in all interactions

## Security

### Best Practices

    Encryption: All sensitive data uses AES-256 encryption before IPFS storage
    Authentication: Web3 signature verification via Wagmi
    Database Security: Supabase Row Level Security (RLS) policies enforce access control
    Smart Contract Audits: Contracts follow OpenZeppelin security standards

### Reporting Vulnerabilities

Found a security issue? Please report it privately to the team rather than opening a public issue:

    Email: security@istory.app
    Include detailed information about the vulnerability
    Allow time for us to respond and patch

Do not disclose the vulnerability publicly until a patch is available.

## Deployment

### Frontend Deployment

Vercel (Recommended):

npm install -g vercel
vercel --prod

Other Hosting:

    Build: npm run build
    Start: npm run start
    Works on any Node.js 18+ hosting

### Smart Contract Deployment

    Configure network in hardhat.config.js
    Set private key in .env.local
    Deploy: npx hardhat run scripts/deploy.js --network baseSepolia
    Copy contract addresses to .env.local

### IPFS Pinning

Use Pinata or similar for file permanence:

npm install --save-dev @pinata/sdk
```

## License

This project is licensed under the MIT License - see LICENSE file for details.

MIT © 2024 iStory Team

## Roadmap

### Current

    MVP: Core journaling and story management
    Voice recording and AI transcription
    Social feed and engagement
    Profile and user management
    Paywall and monetization system
    Beautiful footer component
    Story detail page with full features

### Q1 2026

    Mobile app (React Native)
    Advanced AI recommendations
    Trending stories leaderboard
    Cross-chain support (Optimism, Arbitrum)
    Enhanced notification system

### Q2 2026

    Story marketplace (buy/sell books)
    Community challenges (#MyLifeStoryChallenge)
    Video story support
    Collaborative storytelling
    Advanced analytics dashboard

### Future

    AI-generated audiobook narration
    Multi-language support
    AI story translation
    Community moderation system
    Verified creator badges

## Feedback & Support

### Get Help

    Discord: Join our community
    Twitter/X: @iStoryApp
    Email: support@istory.app

### Discussions

    GitHub Discussions
    Discord Server
    Reddit Community

## Team & Contact

### Project Lead

    Name: Remi Adedeji
    Twitter: @remyOreo_
    Email: remyoreo11@gmail.com

Contributing

Special thanks to all contributors who help make iStory better! 🙏
Target Audience
Primary Demographics

    Ages: 18-45 (Millennials & Gen Z focus)
    Tech-Savviness: Comfortable with Web3 and blockchain
    Geography: Global, with focus on blockchain-active regions (North America, Europe, Asia)
    Interest: Storytelling, digital ownership, creative expression

Key Personas

    Aspiring Storytellers: People who journal via voice and want AI enhancements
    Web3 Enthusiasts: Crypto users interested in NFTs and blockchain permanence
    Content Creators: Influencers looking to monetize stories and build communities
    Truth Advocates: Activists and historians preserving unfiltered narratives
    Side Hustlers: Freelancers earning through story monetization

Use Cases

    Daily voice journaling with AI transcription
    Compiling life stories into published books
    Building personal brand as a creator
    Earning passive income from story engagement
    Creating permanent, tamper-proof records
    Building engaged communities around storytelling

Market Size

    Total Addressable Market (TAM): ~10-20M users in journaling + NFT creator markets
    Early Adopters: Crypto holders with MetaMask (5M+ in Web3 space)
    Growth Potential: Emerging economies with strong Web3 adoption

The target customer for Speak Your Story is a diverse group of individuals who value personal expression, digital ownership, and financial empowerment through storytelling. Here's a breakdown:

Primary Demographics: Ages 18-45, with a focus on millennials and Gen Z who are tech-savvy and active on social media. Balanced gender split, appealing to both men and women interested in self-reflection, creativity, or activism. Global users, particularly in regions with high blockchain adoption (e.g., North America, Europe, Asia) and those facing narrative suppression or censorship.

Key Personas: Aspiring Storytellers and Journalers: Everyday people who want an easy way to document their lives via voice, without the hassle of writing. They seek AI tools to enhance their entries and compile them into books for personal growth or sharing. Blockchain and Crypto Enthusiasts: Web3 users who appreciate NFTs, tokens, and decentralization for owning and monetizing content. They value the app's use of Base (Ethereum L2) for low fees and tamper-proof storage. Content Creators and Influencers: Writers, podcasters, or social media users looking to broadcast authentic stories, build communities, and earn through likes, tips, paywalls, or NFT sales. They use viral features like streaks and leaderboards to grow their audience. History and Truth Advocates: Individuals concerned about manipulated narratives (e.g., activists, historians, or those from marginalized communities) who want to preserve unfiltered truths on an immutable blockchain. Monetization Seekers: Freelancers or side-hustlers aiming to turn personal stories into revenue streams, such as selling digital books or earning $STORY tokens from engagement.

Pain Points Addressed: Traditional journaling apps lack permanence and monetization; Speak Your Story counters this with blockchain immortality and rewards. Users frustrated by centralized platforms' censorship or data ownership issues find solace in decentralized, user-owned content.

Acquisition Channels: Crypto communities (e.g., X/Twitter, Discord, Reddit's r/cryptocurrency or r/web3). Storytelling forums (e.g., Wattpad, Medium users migrating to Web3). Viral marketing via #MyLifeStoryChallenge on social media. Partnerships with AI/blockchain influencers.

This app targets about 10-20 million potential users in the journaling (e.g., Day One app users) and NFT creator markets, with growth potential in emerging Web3 economies. Early adopters are likely crypto holders with wallets like MetaMask, seeking innovative dApps.

Preserve your truth. Mint your legacy. Speak Your Story. Made with ❤️ by the iStory Team
