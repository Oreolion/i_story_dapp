# Speak Your Story (eStories): AI-Powered Sovereign Storytelling Platform

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-cyan?logo=tailwind-css)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-DB-orange?logo=supabase)
![Wagmi](https://img.shields.io/badge/Wagmi-2.17-green?logo=ethereum)
![Viem](https://img.shields.io/badge/Viem-2.38-green?logo=viem)
![Base](https://img.shields.io/badge/Base-L2-blue?logo=base)
![Vitest](https://img.shields.io/badge/Vitest-4-green?logo=vitest)
![Playwright](https://img.shields.io/badge/Playwright-E2E-orange?logo=playwright)

## Overview

eStories is an innovative AI-powered web3 storytelling platform that empowers users to write and record stories about anything they're passionate about — personal journals, historical narratives, geopolitical analysis, cultural tales, creative non-fiction, and more. Every story gets AI-powered analysis that helps users improve as storytellers over time, with the option to immortalize their narratives on the blockchain and monetize them in a decentralized ecosystem. Built on Base, a secure and scalable Layer 2 solution on Ethereum, this app ensures low-cost, fast transactions while maintaining Ethereum's security.

In a world where history has often been manipulated by conquerors, victors, and dominating empires, eStories reclaims the power of authentic storytelling. Whether you're documenting your personal journey, writing about the geopolitics of our time, preserving cultural traditions, or crafting historical essays, eStories gives your stories tamper-proof provenance and permanent preservation on the blockchain — while earning through tips, paywall sales, and NFT-based collections.

**An implicit superpower:** The more you write, the better you get. eStories's AI analysis provides feedback on narrative coherence, emotional depth, thematic consistency, and storytelling quality — turning every story into a micro-lesson in the craft of writing.

## Key Features

### ✨ Core Functionality

- Voice-to-Text Storytelling: Record stories using browser-based audio capture with AI-powered transcription (ElevenLabs Scribe) — or type directly
- Write About Anything: Personal journals, history, geopolitics, culture, creative non-fiction, memoirs, and more
- AI Enhancements: Get creative prompts, grammar polishing, and AI-generated suggestions (Google Gemini 2.5 Flash)
- Storytelling Craft Feedback: AI analyzes narrative coherence, emotional depth, and thematic quality — helping you improve with every story
- Blockchain Immortality: Mint stories as NFTs on Base (Ethereum L2) with IPFS storage via Pinata
- Monetization Suite: Earn $STORY tokens from  tips, and paywall sales — particularly valuable for public stories on history, culture, and geopolitics

### 🧠 Cognitive Layer (Phase 1 - NEW)

- AI Story Analysis: Automatic extraction of themes, emotions, and life domains from stories
- Emotional Insights: AI-detected emotional tone (hopeful, reflective, joyful, etc.)
- Entity Extraction: Automatically identifies people, places, and time references mentioned
- Significance Scoring: AI evaluates intensity and significance of each story
- Story Insights UI: Beautiful component displaying AI-generated insights for each story
- Weekly Reflections: AI-generated weekly summaries of journaling patterns (Phase 3 infrastructure ready)

### 🔐 Authentication & Security

- Dual Auth: Sign in via Google OAuth or Web3 wallet
- Nonce-Based Signing: Server-generated nonces prevent wallet signature replay attacks
- Account Linking: Link Google and wallet for unified access (Profile > Settings)
- Signature Verification: Wallet linking uses HMAC-signed tokens + viem message signing
- Bearer Token Auth: All API routes protected with Supabase JWT verification
- Rate Limiting: Route-specific rate limits (AI: 10/min, Auth: 20/min, Default: 60/min)
- Security Headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Onboarding Flow: New Google users auto-onboarded, wallet users go through setup

### 💬 Social Features

- Community Social Feed: Discover and engage with other stories
- Like System: Show appreciation for stories you enjoy
- Tip System: Support creators directly with custom $STORY token amounts
- Comment System: Leave thoughts and build community discussions
- Follow System: Build your storytelling community
- Story Sharing: Share stories across social platforms

### 💰 Monetization

- Paywall System: Set custom prices for exclusive stories
- $STORY Token Rewards: Earn from tips and paywall sales
- NFT Minting: Compile stories into digital books and mint as NFTs
- Tip Jar: Accept voluntary tips from supporters

### 📚 Library & Curation

- Personal Library: Organize all your stories and books
- Book Compilation: Combine multiple stories into digital books
- Story Filtering: Search, filter, and organize by mood, date, and tags
- Audio Storage: All recordings stored securely with public URLs

### 👤 User Profiles

- Profile Customization: Build your creator profile with bio and avatar
- Streaks & Achievements: Track daily writing streaks and earn badges
- Statistics Dashboard: View your impact and community engagement metrics
- Writing Goals: Set and track monthly story targets

**Tagline:** Speak Your Story, Mint Your Legacy

## How It Works

Follow these simple steps to start your storytelling journey:

### Step 1: Record or Write Your Story 🎙️

Use our AI Speech-to-Text feature to record your story by voice, or type directly. Write about whatever moves you — personal reflections, historical events, cultural traditions, geopolitical analysis, or creative non-fiction.

### Step 2: Enhance & Polish ✨

Leveraging Gemini Flash AI, get grammar corrections, creative suggestions, and writing enhancements to make your story shine.

### Step 3: Secure Your Entries 🔐

Store your stories as NFTs on the blockchain for secure and permanent ownership. Your stories are immutable and truly yours forever.

### Step 4: Share & Earn 💰

Share your stories with the community and earn $STORY tokens through tips and paywall sales. Build your audience and monetize your creativity!

## Why eStories?

History is written by the victors, but your story deserves to be heard unedited. eStories counters narrative manipulation by giving individuals the tools to create, own, and profit from their stories on an immutable blockchain. Whether it's a daily reflection, a historical essay, a geopolitical analysis, a cultural narrative, a life milestone, or a creative memoir — your voice becomes part of an unbreakable digital archive powered by the efficiency of Base Layer 2.

**Why storytelling, not just journaling?** Private journals are the entry point — the habit of daily writing that builds the muscle. But the real value emerges when writers develop their craft enough to publish stories worth reading and paying for. eStories's AI feedback loop accelerates that journey: every story analyzed is a step toward becoming a stronger storyteller.

## Tech Stack

### Frontend

- Framework: Next.js 15.5.9 (App Router) with React 19 and TypeScript for performant, SEO-friendly experiences
- Styling: Tailwind CSS 4 for responsive, modern UI with full dark/light mode support
- Animations: Framer Motion for smooth, professional animations and transitions
- UI Components: shadcn/ui for accessible, customizable components
- Icons: Lucide React for consistent iconography

### Blockchain & Web3

- Wallet Integration: Wagmi + RainbowKit for seamless wallet connections
- Smart Contracts: Solidity contracts deployed on Base (Ethereum L2)
- Contract Interaction: Viem for efficient blockchain interactions
- Contracts Included:
  - eStoriesToken.sol - ERC20 token ($STORY) with 100M max supply cap, pausable, role-based minting
  - StoryProtocol.sol - Smart contract for tips and paywall payments
  - StoryNFT.sol - ERC721 NFT contract for minting story books with mint fee (0.001 ETH) and ERC2981 royalties

### Backend & Database

- Database: Supabase (PostgreSQL) for real-time data and authentication
- Storage: Supabase Storage for audio files and media
- API: Next.js API Routes for serverless functions

### AI & External Services

- Speech-to-Text: ElevenLabs Scribe for accurate voice transcription
- Text Enhancement: Google Gemini 2.5 Flash for AI-powered writing suggestions
- Story Analysis: Google Gemini 2.5 Flash for cognitive metadata extraction
- Text-to-Speech: Browser Speech Synthesis API for audio playback
- IPFS Storage: Pinata for decentralized file storage
- Email: Resend for transactional emails

### Testing Infrastructure

- Unit Testing: Vitest with React Testing Library
- E2E Testing: Playwright (Chrome, Firefox, Safari)
- Coverage: @vitest/coverage-v8 for code coverage reports
- Mocking: vi.mock for dependency mocking

### Development & Deployment

- Package Manager: npm (Node.js 19+)
- Linting: ESLint with TypeScript support
- Smart Contracts: Hardhat for Solidity development
- Deployment: Vercel (recommended) or any Node.js hosting

## Pages & Features

### 🏠 Home Page (/)

- Hero section showcasing app features and benefits
- Key statistics (stories created, active users, tokens earned, books minted)
- Feature cards with gradient backgrounds
- Call-to-action buttons
- Beautiful gradient animations and glassmorphism design

### 🎙️ Record Page (/record)

- Audio Recording: Mic input with duration tracking
- Real-time Transcription: AI-powered speech-to-text using Gemini Flash
- AI Enhancement: Polish and improve written content
- Text-to-Speech: Preview stories with native browser audio
- Media Management: Save audio files to Supabase Storage
- Story Metadata: Add title, mood, tags, and paywall settings
- Database Save: Store stories with author wallet and audio URLs

### 📚 Library Page (/library)

- Personal Collection: View all your recorded stories and compiled books
- Advanced Filtering: Search by title, date, mood, and tags
- Story Statistics: Track likes, views, and engagement per story
- Book Compilation: Select multiple stories to compile into PDFs
- Audio Playback: Listen to recorded stories
- Mood Badges: Visual mood indicators for each story

### 🌐 Social Page (/social)

- Community Feed: Discover stories from other users
- Featured Writers: Showcase top storytellers
- Trending Topics: View popular hashtags and themes
- Story Cards: Rich story previews with author info, likes, and engagement
- Multiple Views: Feed, Trending, and Following tabs
- Community Stats: Display active users and engagement metrics

### 👥 Profile Page (/profile)

- User Profile: Customize name, bio, location, website, and avatar
- Writing Streaks: Track daily writing consistency with visual progress
- Achievements: Earn and display badges (First Story, Community Star, etc.)
- Statistics: View total stories, likes earned, followers, and impact metrics
- Writing Goals: Set and track monthly story targets
- Settings: User account and preference management
- Linked Accounts: Link Google OAuth and Web3 wallet from Settings tab

### 📖 Story Detail Page (/story/[storyId])

- Full Story Display: Read complete story content with rich formatting
- Author Profile: View author info, badges, and follower count
- Engagement Metrics: See likes, shares, and view counts
- Like System: Show appreciation for stories you enjoy
- Tip System: Send custom $STORY token amounts to support creators
- Paywall Support: Unlock exclusive stories with token payment
- Audio Player: Listen to story recordings if available
- Comment Section: Post and read comments from community
- Share Functionality: Share stories to social media or copy link
- Save/Bookmark: Save stories for later reading
- Edit Option: Author can edit their own stories
- Enhanced UI: Mood-based gradient headers and smooth animations

## Project Structure

```markdown
i_story_dapp/
├── app/
│   ├── api/                          # API Routes
│   │   ├── ai/
│   │   │   ├── analyze/              # Story analysis endpoint (Phase 1)
│   │   │   ├── enhance/              # Text enhancement endpoint
│   │   │   └── transcribe/           # Speech-to-text endpoint
│   │   ├── auth/
│   │   │   ├── callback/             # OAuth callback handler (redirect whitelist)
│   │   │   ├── initiate-link/        # Start account linking (HMAC token)
│   │   │   ├── link-account/         # Account linking (wallet ↔ Google)
│   │   │   ├── link-google/          # Link Google to wallet account
│   │   │   ├── login/                # Wallet auth (nonce-verified)
│   │   │   ├── nonce/                # Server-side nonce generation
│   │   │   └── onboarding/           # New user onboarding
│   │   ├── book/
│   │   │   └── compile/              # Book compilation
│   │   ├── journal/
│   │   │   └── save/                 # Save journal entries
│   │   ├── notifications/            # Notification system
│   │   ├── social/
│   │   │   ├── follow/               # Follow system
│   │   │   └── like/                 # Like functionality (real DB)
│   │   ├── tip/                      # Tipping system
│   │   ├── paywall/                  # Paywall payments
│   │   └── user/
│   │       └── profile/              # User profile API (real DB)
│   ├── hooks/
│   │   ├── useBrowserSupabase.ts     # Supabase singleton hook
│   │   ├── useeStoriesToken.ts         # Token contract interactions
│   │   ├── useStoriesProtocol.ts       # Protocol contract (tips/paywall)
│   │   ├── useStoriesNFT.ts            # NFT contract interactions
│   │   ├── useNotifications.ts       # Notification system hook
│   │   ├── usePatterns.ts            # Pattern aggregation hook
│   │   └── useReflection.ts          # Weekly reflection hook
│   ├── robots.ts                     # SEO: Crawler directives
│   ├── sitemap.ts                    # SEO: Dynamic sitemap (public stories)
│   ├── opengraph-image.tsx           # SEO: Default branded OG image
│   ├── story/
│   │   └── [storyId]/
│   │       ├── page.tsx              # Server component (metadata + JSON-LD)
│   │       ├── StoryPageClient.tsx   # Client component (UI)
│   │       └── opengraph-image.tsx   # Dynamic per-story OG image
│   ├── books/
│   │   └── [bookId]/
│   │       ├── page.tsx              # Server component (metadata + JSON-LD)
│   │       └── BookPageClient.tsx    # Client component (UI)
│   ├── library/
│   │   ├── page.tsx                  # Server component (metadata)
│   │   └── LibraryPageClient.tsx     # Client component (UI)
│   ├── profile/
│   │   ├── page.tsx                  # Server component (metadata)
│   │   └── ProfilePageClient.tsx     # Client component (UI)
│   ├── record/
│   │   ├── page.tsx                  # Server component (metadata)
│   │   └── RecordPageClient.tsx      # Client component (UI)
│   ├── social/
│   │   ├── page.tsx                  # Server component (metadata)
│   │   └── SocialPageClient.tsx      # Client component (UI)
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces (includes StoryMetadata)
│   ├── utils/
│   │   ├── supabase/                 # Supabase clients (browser, server, admin)
│   │   ├── ipfsService.ts            # IPFS/Pinata service
│   │   └── emailService.ts           # Resend email service
│   ├── layout.tsx                    # Root layout (metadata, JSON-LD, Footer)
│   ├── page.tsx                      # Home page (server wrapper)
│   ├── HomePageClient.tsx            # Home page (client UI)
│   └── globals.css                   # Global styles
├── __tests__/                        # Unit tests (Vitest)
│   ├── api/
│   │   └── analyze.test.ts           # Analyze endpoint tests (38 tests)
│   ├── components/
│   │   └── StoryInsights.test.tsx    # StoryInsights tests (41 tests)
│   ├── RecordPage.test.tsx           # Record page tests
│   └── setup.ts                      # Test setup & mocks
├── e2e/                              # E2E tests (Playwright)
│   └── navigation.spec.ts
├── components/
│   ├── Footer.tsx                    # Footer component
│   ├── Navigation.tsx                # Top navigation bar
│   ├── Provider.tsx                  # Web3 & Theme providers
│   ├── StoryCard.tsx                 # Story card component
│   ├── StoryInsights.tsx             # AI insights display (Phase 1)
│   ├── AuthProvider.tsx              # Auth context
│   ├── AuthButton.tsx                # Auth action button
│   ├── AuthModal.tsx                 # Auth modal dialog
│   ├── OnboardingModal.tsx           # New user onboarding modal
│   └── ui/                           # shadcn/ui components
├── contracts/                        # Solidity smart contracts
│   ├── eStoriesToken.sol               # ERC20 $STORY token
│   ├── StoryProtocol.sol             # Tips & paywall payments
│   └── StoryNFT.sol                  # ERC721 book NFTs
├── middleware.ts                      # API rate limiting (route-specific)
├── scripts/                          # Utility scripts
│   ├── deploy.ts                     # Contract deployment
│   ├── verify.ts                     # Contract verification
│   ├── verify-deployment.ts          # Post-deploy ABI verification
│   ├── think.ts                      # Claude thinking agent (Phase 1.5)
│   └── backfill-metadata.ts          # Metadata backfill script
├── lib/
│   ├── auth.ts                       # Shared auth middleware (Bearer token validation)
│   ├── crypto.ts                     # Crypto utilities (timing-safe comparison)
│   ├── contracts.ts                  # Contract addresses & ABIs
│   ├── wagmi.config.ts               # Wagmi configuration
│   ├── wagmi.config.server.ts        # Server-side Wagmi config
│   ├── viemClient.ts                 # Viem client setup
│   └── abis/                         # Contract ABI JSON files
├── supabase/
│   └── migrations/                   # Database migrations
│       ├── 001_create_weekly_reflections.sql
│       ├── 002_enable_rls_policies.sql
│       └── 003_add_oauth_fields.sql
├── public/                           # Static assets + manifest.json (PWA)
├── vitest.config.ts                  # Vitest configuration
├── playwright.config.ts              # Playwright configuration
├── hardhat.config.ts                 # Hardhat configuration
├── components.json                   # shadcn/ui config
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+ with npm, yarn, or pnpm
- Supabase account with project setup (PostgreSQL database + auth)
- MetaMask or compatible Web3 wallet configured for Base network
- Base Sepolia testnet access for development
- Google API key or similar for Gemini Flash AI services

### Installation

Clone the repository:

```bash
npm install
# or: yarn install / pnpm install
```

Set up environment variables: Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your_google_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Web3 & Blockchain
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id

# Smart Contracts (Base Sepolia)
NEXT_PUBLIC_eStories_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_STORY_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_STORY_NFT_ADDRESS=0x...

# Security
CRON_SECRET=your_cron_secret
```

Set up Supabase:

- Create tables: users, stories, comments, saved_stories, likes, story_metadata, weekly_reflections
- Enable Row Level Security (RLS) for data privacy
- Create storage bucket story-audio for audio files
- Configure authentication with OAuth or email/password

Deploy Smart Contracts (optional for testing):

```bash
# Install Hardhat
npm install --save-dev hardhat

# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

Run development server:

```bash
npm run dev
```

Open <http://localhost:3000> in your browser

Quick Start Guide

- Connect Wallet: Click "Connect Wallet" using MetaMask (switch to Base network)
- Create Profile: Navigate to /profile and set up your author information
- Record Story: Go to /record, hit record button, and speak your story
- Enhance: Use AI enhancement to polish your text
- Save: Click save to store your story with audio on blockchain
- Share: Go to /social to discover stories, tip creators, and build community
- Compile: Visit /library to compile stories into a book

## Development Scripts

| Command | Description |
| --------- | ------------- |
| `npm run dev` | Start development server on <http://localhost:3000> |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |

### Testing Commands

| Command | Description |
| --------- | ------------- |
| `npx vitest` | Run unit tests (watch mode) |
| `npx vitest run` | Run unit tests once |
| `npx vitest run --coverage` | Run tests with coverage report |
| `npx playwright test` | Run E2E tests |
| `npx playwright test --ui` | Run E2E tests with interactive UI |

### Smart Contract Commands

| Command | Description |
| --------- | ------------- |
| `npx hardhat compile` | Compile Solidity contracts |
| `npx hardhat run scripts/deploy.ts --network baseSepolia` | Deploy to Base Sepolia |
| `npx hardhat run scripts/verify.ts --network baseSepolia` | Verify on Basescan |
| `npx hardhat run scripts/verify-deployment.ts --network baseSepolia` | Verify deployed ABIs match expected interfaces |

### Utility Scripts

| Command                                       | Description                                    |
|-----------------------------------------------|------------------------------------------------|
| `npx ts-node scripts/think.ts "problem"`| Run Claude thinking agent for complex problems |
| `npx ts-node scripts/backfill-metadata.ts` | Backfill metadata for existing stories |

## API Endpoints

All API routes require Bearer token authentication unless noted. Rate limits apply globally (middleware.ts).

### AI Endpoints (Auth Required)

- POST /api/ai/transcribe - Convert audio to text (max 25MB, audio/* only)
- POST /api/ai/enhance - Enhance story text with AI (max 50K chars)
- POST /api/ai/analyze - Extract cognitive metadata (verifies story ownership)
- POST /api/ai/reflection - Generate weekly AI reflection (1 per week limit)

### Auth Endpoints

- GET /api/auth/nonce - Generate server-side nonce for wallet signing (no auth)
- POST /api/auth/login - Authenticate with wallet signature (verifies nonce)
- GET /api/auth/callback - OAuth callback handler (validates redirect URL)
- POST /api/auth/onboarding - Complete new user onboarding (auth required)
- POST /api/auth/initiate-link - Start account linking (auth + wallet signature)
- POST /api/auth/link-account - Link wallet to Google account (auth + signature)
- POST /api/auth/link-google - Link Google OAuth to wallet account (linking token)

### Story Endpoints (Auth Required)

- POST /api/journal/save - Save story to database (triggers AI analysis)
- GET /api/stories/[storyId]/metadata - Get story metadata/insights
- POST /api/book/compile - Compile stories into a book (verifies author ownership)

### Social Endpoints (Auth Required)

- POST /api/social/like - Like/unlike a story (atomic toggle, real DB)
- POST /api/social/follow - Follow/unfollow user (verifies wallet ownership)
- POST /api/tip - Send $STORY tokens to creators
- POST /api/paywall - Unlock paywalled content

### Notification Endpoints (Auth Required)

- GET /api/notifications - Fetch user notifications (with pagination)
- POST /api/notifications - Create notification
- PUT /api/notifications - Mark as read
- DELETE /api/notifications - Delete notification(s)

### User Endpoints (Auth Required)

- GET /api/user/profile - Fetch authenticated user's real profile
- PUT /api/user/profile - Update profile (name, bio, avatar only)
- GET/POST/PUT/DELETE /api/habits - Habit tracking (verifies user ownership)

### Infrastructure Endpoints

- POST /api/ipfs/upload - Upload to IPFS (auth required, max 50MB, MIME whitelist)
- POST /api/email/send - Send email via Resend (auth required)
- POST /api/sync/verify_tx - Verify blockchain tx (auth + wallet ownership)
- POST /api/cron/distribute-rewards - (Disabled) Reserved for future token distribution programs
- GET /api/admin/analysis-stats - Analysis stats (ADMIN_SECRET, timing-safe)

## How to Contribute

We welcome contributions from the community! Here's how to contribute:

Fork the repository and create a feature branch:

```bash
git checkout -b feature/your-amazing-feature
```

Make your changes with clear, descriptive commits:

```bash
git commit -m 'Add amazing feature: description'
```

Push to your branch:

```bash
git push origin feature/your-amazing-feature
```

Open a Pull Request with:

- Clear description of changes
- Why this change is needed
- Any related issues or tickets

### Guidelines

- Follow the existing code style and patterns
- Ensure TypeScript types are properly defined
- Test changes locally before submitting PR
- Update documentation if needed
- Be respectful and inclusive in all interactions

## Security

### Security Architecture

eStories implements a comprehensive, layered security model addressing 34 audit findings across API routes, smart contracts, and infrastructure.

**API Security:**
- Bearer Token Authentication: All API routes validate Supabase JWTs via shared `lib/auth.ts` middleware
- Ownership Verification: Users can only modify their own resources (stories, habits, profiles)
- Rate Limiting: In-memory middleware with route-specific limits (AI: 10/min, Auth: 20/min, Default: 60/min)
- Input Validation: File size limits (25MB audio, 50MB IPFS), MIME type whitelists, text length caps
- Error Sanitization: No internal error details leaked to clients — generic messages only

**Authentication Security:**
- Nonce-Based Wallet Signing: Server-generated UUID nonces with 5-minute expiry prevent signature replay attacks
- HMAC-Signed Linking Tokens: Account linking requires cryptographically signed tokens proving wallet ownership
- OAuth Redirect Whitelisting: Only approved redirect paths accepted after OAuth callback
- Timing-Safe Secret Comparison: Cron and admin endpoints use constant-time comparison to prevent timing attacks

**Infrastructure Security:**
- Security Headers: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- Database Security: Supabase Row Level Security (RLS) policies enforce access control
- Smart Contract Security: OpenZeppelin AccessControl, MAX_SUPPLY caps, mint fees, Pausable patterns

### Smart Contract Security

| Contract | Security Features |
|----------|-------------------|
| eStoriesToken | MAX_SUPPLY cap (100M tokens), Pausable, AccessControl (MINTER_ROLE, PAUSER_ROLE) |
| StoryProtocol | Pausable, AccessControl |
| StoryNFT | Mint fee (0.001 ETH) prevents spam, AccessControl, ERC2981 royalties, secure withdrawal pattern |

### Reporting Vulnerabilities

Found a security issue? Please report it privately to the team rather than opening a public issue:

- Email: <remyoreo11@gmail.com>
- Include detailed information about the vulnerability
- Allow time for us to respond and patch

Do not disclose the vulnerability publicly until a patch is available.

## Deployment

### Frontend Deployment

Vercel (Recommended):

```bash
npm install -g vercel
vercel --prod
```

Other Hosting:

- Build: `npm run build`
- Start: `npm run start`
- Works on any Node.js 18+ hosting

### Smart Contract Deployment

- Configure network in hardhat.config.ts
- Set private key in .env.local
- Deploy: `npx hardhat run scripts/deploy.ts --network baseSepolia`
- Verify ABI: `npx hardhat run scripts/verify-deployment.ts --network baseSepolia`
- Copy contract addresses to lib/contracts.ts and .env.local

### IPFS Pinning

Use Pinata or similar for file permanence:

```bash
npm install --save-dev @pinata/sdk
```


### Q2 2026

- Mobile app (React Native)
- Story marketplace (buy/sell books)
- Community challenges (#MyLifeStoriesChallenge)
- Video story support
- Cross-chain support (Optimism, Arbitrum)

### Future

- Graph-based memory (theme relationships)
- AI-generated audiobook narration
- Multi-language support with AI translation
- Memory API for external AI agents
- ERC-8004 agent identity integration

## Feedback & Support

### Get Help

- Discord: Join our community
- Twitter/X: @eStoriesApp
- Email: <support@eStories.app>

### Discussions

- GitHub Discussions
- Discord Server
- Reddit Community

## Team & Contact

### Project Lead

- Name: Remi Adedeji
- Twitter: @remyOreo_
- Email: <remyoreo11@gmail.com>

Contributing

Special thanks to all contributors who help make eStories better! 🙏

### Use Cases

- **Personal Journals**: Daily voice journaling with AI transcription for self-reflection and growth
- **Historical Writing**: Essays and narratives about historical events, eras, and figures
- **Geopolitical Analysis**: Commentary on world events, international relations, and political dynamics
- **Cultural Storytelling**: Preserving oral histories, traditions, indigenous knowledge, and cultural narratives
- **Creative Non-Fiction**: Memoirs, essays, travel writing, and longform storytelling
- **Storytelling Craft Development**: Improving writing skills through AI feedback on coherence, emotional depth, and thematic quality
- Compiling stories into published books and NFT collections
- Mind decluttering, self-reflection, themes, insights, and pattern discovery across stories
- Building personal brand as a creator and earning from story engagement
- Creating permanent, tamper-proof records with blockchain provenance

### Market Size

- Total Addressable Market (TAM): ~10-20M users in journaling + NFT creator markets
- Early Adopters: Crypto holders with MetaMask (5M+ in Web3 space)
- Growth Potential: Emerging economies with strong Web3 adoption

The target customer for Speak Your Story is a diverse group of individuals who value personal expression, digital ownership, and financial empowerment through storytelling. Here's a breakdown:

Primary Demographics: Ages 18-45, with a focus on millennials and Gen Z who are tech-savvy and active on social media. Balanced gender split, appealing to both men and women interested in self-reflection, creativity, or activism. Global users, particularly in regions with high blockchain adoption (e.g., North America, Europe, Asia) and those facing narrative suppression or censorship.

Key Personas: **Aspiring Storytellers & Writers**: People passionate about writing — whether personal journals, historical essays, cultural narratives, or creative non-fiction. They use AI craft feedback to improve with every story. **History & Culture Enthusiasts**: Writers who want to document and preserve historical events, cultural traditions, geopolitical analysis, and oral histories with tamper-proof provenance. Their public stories are ideal for paywalling. **Blockchain & Crypto Enthusiasts**: Web3 users who appreciate NFTs, tokens, and decentralization for owning and monetizing content. They value Base (Ethereum L2) for low fees and tamper-proof storage. **Content Creators & Influencers**: Writers, podcasters, or social media users looking to broadcast authentic stories, build communities, and earn through tips, paywalls, or NFT sales. **Truth Advocates**: Individuals concerned about manipulated narratives (e.g., activists, historians, or those from marginalized communities) who want to preserve unfiltered truths on an immutable blockchain. **Craft Builders**: People who want to get better at storytelling — eStories's AI analysis on coherence, emotional depth, and narrative quality turns every story into a writing lesson.

Pain Points Addressed: Traditional journaling apps lack permanence and monetization; Speak Your Story counters this with blockchain immortality and rewards. Users frustrated by centralized platforms' censorship or data ownership issues find solace in decentralized, user-owned content.

Acquisition Channels: Crypto communities (e.g., X/Twitter, Discord, Reddit's r/cryptocurrency or r/web3). Storytelling forums (e.g., Wattpad, Medium users migrating to Web3). Viral marketing via #MyLifeStoriesChallenge on social media. Partnerships with AI/blockchain influencers.

#### *Preserve your truth. Master your craft. Mint your legacy. Speak Your Story. Made with love by the eStories Team*
