# Speak Your Story(iStory): AI-Powered Blockchain Journaling App

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-orange?logo=supabase)](https://supabase.com/)
[![Wagmi](https://img.shields.io/badge/Wagmi-2-green?logo=ethereum)](https://wagmi.sh/)
[![Viem](https://img.shields.io/badge/Viem-2-green?logo=viem)](https://viem.sh/)
[![RainbowKit](https://img.shields.io/badge/RainbowKit-2-purple?logo=rainbow)](https://www.rainbowkit.com/)
[![Base](https://img.shields.io/badge/Base-L2-blue?logo=base)](https://base.org/)

## Overview

**Speak Your Story** is an innovative AI-powered web application that empowers users to chronicle their daily lives through voice journaling, immortalize their personal narratives on the blockchain, and monetize their stories in a decentralized ecosystem. Built on **Base**, a secure and scalable Layer 2 solution on Ethereum, this app ensures low-cost, fast transactions while maintaining Ethereum's security. In a world where history has often been manipulated by conquerors and dominating empires, this app reclaims the power of authentic storytelling. Users can broadcast their unfiltered truths forever on the blockchain, ensuring tamper-proof preservation, while earning rewards through community engagement and NFT-based sales.

### Key Features
- **Voice-to-Text Journaling**: Effortlessly record your stories using browser-based audio capture, powered by AI for accurate transcription and multilingual support.
- **Blockchain Immortality**: Mint journal entries and compiled books as NFTs on Base (Ethereum Layer 2), stored securely on IPFS for eternal, decentralized preservation.
- **AI Enhancements**: Get creative prompts, grammar polishing, and even AI-generated book covers to elevate your narratives.
- **Monetization & Community**: Earn $STORY tokens from likes and tips, sell books behind paywalls, or trade NFTs on a custom marketplace. Share, like, and follow to build a global storytelling network.
- **Social Virality**: Gamified streaks, leaderboards, "Story of the Day" highlights, and easy sharing to X, Instagram, and more.
- **Secure & Private**: End-to-end encryption, Web3 wallet authentication, and compliance with GDPR/CCPA.

**Tagline**: *Speak Your Story, Mint Your Legacy*

## Why This App?
History is written by the victors, but your story deserves to be heard unedited. Speak Your Story counters narrative manipulation by giving individuals the tools to create, own, and profit from their personal histories on an immutable blockchain. Whether it's a daily reflection, a life milestone, or a cultural tale, your voice becomes part of an unbreakable digital archive—all powered by the efficiency of Base Layer 2.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) with React and TypeScript for a performant, SEO-friendly web app.
- **Styling**: Tailwind CSS for responsive, modern UI with dark/light mode support.
- **Database**: Supabase for scalable, real-time metadata storage (user profiles, engagement logs).
- **Web3 Integration**: Wagmi, Viem, and RainbowKit for seamless wallet connections, transaction handling, and Base (Ethereum L2) interactions.
- **AI Services**: AssemblyAI/Google Cloud for speech-to-text; Hugging Face/Grammarly for text enhancement; DALL·E for visuals.
- **Blockchain**: Base (Ethereum Layer 2) smart contracts (Solidity) with OpenZeppelin for NFTs and token rewards; IPFS for decentralized storage.
- **Other Tools**: Framer Motion for animations; pdfkit for book compilation; react-share for social integrations.

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm.
- A Supabase account and project setup (for database and auth).
- MetaMask or compatible Web3 wallet configured for Base network.
- Base testnet access (e.g., Base Sepolia) for development.

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/speak-your-story.git
   cd speak-your-story
   ```
2. Install dependencies:
   ```
   npm install
   # or yarn install / pnpm install
   ```
3. Set up environment variables:
   Create a `.env.local` file in the root directory and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_key
   NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org  # For Base testnet
   WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
   NEXT_PUBLIC_JOURNAL_NFT_ADDRESS=your_deployed_contract_address
   ```
   - Get Supabase keys from your project dashboard.
   - AssemblyAI key for speech-to-text (or use Google Cloud alternative).
   - Base RPC URL from official docs or Alchemy/Infura.
   - WalletConnect ID from [WalletConnect Cloud](https://cloud.walletconnect.com).

4. Set up Supabase:
   - Create tables for users, journals, likes, and books via the Supabase dashboard or SQL editor.
   - Enable Row Level Security (RLS) for private data.

5. Deploy Smart Contracts:
   - Install Hardhat: `npm install --save-dev hardhat`.
   - Configure Hardhat for Base (update `hardhat.config.js` with Base network details).
   - Compile and deploy to Base Sepolia:
     ```
     npx hardhat compile
     npx hardhat run scripts/deploy.js --network baseSepolia
     ```
   - Update contract addresses in `.env.local` (e.g., `NEXT_PUBLIC_JOURNAL_NFT_ADDRESS`).

6. Run the development server:
   ```
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage
- **Connect Wallet**: Use RainbowKit to sign in via MetaMask (switch to Base network).
- **Record a Story**: Navigate to `/record`, start audio capture, and let AI transcribe.
- **Save to Blockchain**: Mint your entry as an NFT on Base.
- **Compile & Monetize**: Select entries at `/library`, generate a PDF book, and list for sale.
- **Engage Socially**: Like/share at `/social` to earn $STORY tokens.

## Project Structure
```
speak-your-story/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Serverless API endpoints
│   ├── record/           # Recording page
│   ├── library/          # User library
│   ├── social/           # Social feed
│   └── profile/          # User profile with streaks
├── components/           # Reusable UI components (e.g., RecordButton, JournalCard)
├── lib/                  # Utilities (Web3 config for Base, Supabase client, IPFS)
├── contracts/            # Solidity smart contracts (JournalNFT.sol, etc.)
├── scripts/              # Hardhat deployment scripts
├── public/               # Static assets (fonts, icons)
├── styles/               # Global CSS (Tailwind)
└── README.md             # This file
```

## Development Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (Jest + Cypress) |

## Contributing
1. Fork the repo and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Commit changes (`git commit -m 'Add amazing feature'`).
3. Push to the branch (`git push origin feature/amazing-feature`).
4. Open a Pull Request.

We welcome contributions that enhance storytelling, security, or accessibility. Please adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security
- **Encryption**: AES-256 for journal data before IPFS upload.
- **Auth**: Web3 signatures via Wagmi; Supabase RLS for DB access.
- **Audits**: Smart contracts audited with OpenZeppelin Defender.
- Report vulnerabilities privately to [security@speakyourstory.app](mailto:security@speakyourstory.app).

## Deployment
- **Frontend**: Deploy to Vercel: `vercel --prod`.
- **Contracts**: Use Hardhat for Base mainnet deployment after testnet validation.
- **IPFS**: Pin files via Pinata for reliability.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap
- [x] MVP: Core journaling and NFT minting on Base testnet.
- [ ] Mobile App (React Native).
- [ ] Advanced AI: Sentiment-based prompts.
- [ ] Cross-Chain Support (e.g., Optimism or Arbitrum).
- [ ] Viral Campaigns: #MyLifeStoryChallenge integration.

## Contact
- **Project Lead**: [Remi Adedeji](https://x.com/@remyOreo_)
- **Discussions**: Join us on [Discord](https://discord.gg/yourinvite) or X [@speakyourstory](https://x.com/speakyourstory).

---

*Preserve your truth. Mint your legacy. Speak Your Story.*


### Target Customer for Speak Your Story (iStory)

The target customer for **Speak Your Story** is a diverse group of individuals who value personal expression, digital ownership, and financial empowerment through storytelling. Here's a breakdown:

- **Primary Demographics**:
  - Ages 18-45, with a focus on millennials and Gen Z who are tech-savvy and active on social media.
  - Balanced gender split, appealing to both men and women interested in self-reflection, creativity, or activism.
  - Global users, particularly in regions with high blockchain adoption (e.g., North America, Europe, Asia) and those facing narrative suppression or censorship.

- **Key Personas**:
  - **Aspiring Storytellers and Journalers**: Everyday people who want an easy way to document their lives via voice, without the hassle of writing. They seek AI tools to enhance their entries and compile them into books for personal growth or sharing.
  - **Blockchain and Crypto Enthusiasts**: Web3 users who appreciate NFTs, tokens, and decentralization for owning and monetizing content. They value the app's use of Base (Ethereum L2) for low fees and tamper-proof storage.
  - **Content Creators and Influencers**: Writers, podcasters, or social media users looking to broadcast authentic stories, build communities, and earn through likes, tips, paywalls, or NFT sales. They use viral features like streaks and leaderboards to grow their audience.
  - **History and Truth Advocates**: Individuals concerned about manipulated narratives (e.g., activists, historians, or those from marginalized communities) who want to preserve unfiltered truths on an immutable blockchain.
  - **Monetization Seekers**: Freelancers or side-hustlers aiming to turn personal stories into revenue streams, such as selling digital books or earning $STORY tokens from engagement.

- **Pain Points Addressed**:
  - Traditional journaling apps lack permanence and monetization; Speak Your Story counters this with blockchain immortality and rewards.
  - Users frustrated by centralized platforms' censorship or data ownership issues find solace in decentralized, user-owned content.

- **Acquisition Channels**:
  - Crypto communities (e.g., X/Twitter, Discord, Reddit's r/cryptocurrency or r/web3).
  - Storytelling forums (e.g., Wattpad, Medium users migrating to Web3).
  - Viral marketing via #MyLifeStoryChallenge on social media.
  - Partnerships with AI/blockchain influencers.

This app targets about 10-20 million potential users in the journaling (e.g., Day One app users) and NFT creator markets, with growth potential in emerging Web3 economies. Early adopters are likely crypto holders with wallets like MetaMask, seeking innovative dApps.
