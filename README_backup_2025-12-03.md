````markdown
# Speak Your Story (iStory)

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-DB-orange?logo=supabase)
![Base](https://img.shields.io/badge/Base-L2-blue?logo=base)

AI-powered Web3 journaling: record voice entries, enhance with AI, and mint stories as NFTs on Base (L2).

**Tagline:** Speak Your Story, Mint Your Legacy

> This README has been refreshed for clarity and production-readiness. It includes contribution guidance and licensing.


## Why iStory

iStory provides an immutable, user-owned way to preserve personal narratives with AI-assisted tooling and tokenized rewards. Built on Base L2 for low fees and fast transactions.

## Tech Stack (short)

- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS
- Animations: Framer Motion
- Web3: Wagmi, RainbowKit, Viem
- Backend: Next.js API routes, Supabase
- AI: Gemini Flash (external)


## Pages & Features (high level)

- Home (`/`) — Hero, stats, feature highlights
- Record (`/record`) — Record audio, transcribe, enhance, save
- Library (`/library`) — Manage personal stories and compiled books
- Social (`/social`) — Community feed, likes, tips
- Profile (`/profile`) — User settings, streaks, achievements
- Story detail (`/story/[storyId]`) — Full story view, likes, tips, audio


## Project structure (top-level)

```
i_story_dapp/
├─ app/                # Next.js app router pages & API
├─ components/         # UI components
├─ contracts/          # Solidity contracts
├─ lib/                # helpers and configs (viem, wagmi, ipfs)
├─ public/             # static assets
├─ README.md
├─ LICENSE
└─ CODE_OF_CONDUCT.md
```


## Getting started (development)

Prerequisites:
- Node.js 18+ and npm/yarn/pnpm
- Supabase project (DB + Storage + Auth)
- MetaMask or WalletConnect for Base network

Clone and install:

```bash
git clone https://github.com/Oreolion/web3_Ai_iStory.git
cd i_story_dapp
npm install
```

Create `.env.local` (example):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_LIKE_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_STORYBOOK_NFT_ADDRESS=0x...
```

Run dev server:

```bash
npm run dev
# http://localhost:3000
```


## Quick start checklist

1. Connect Wallet (MetaMask / WalletConnect)
2. Create profile (`/profile`)
3. Record a story (`/record`)
4. Enhance and save
5. Share on social feed (`/social`)

## Development scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Fix ESLint issues |


## API endpoints (summary)

- `POST /api/ai/transcribe` — speech-to-text
- `POST /api/ai/enhance` — text enhancement
- `POST /api/journal/save` — save story + metadata
- `POST /api/book/compile` — compile stories into a book
- `POST /api/social/like` — like a story

Refer to `app/api/**` for the full route implementations.


## Contributing

Thanks for considering contributing! Please follow these guidelines:

- Read `CODE_OF_CONDUCT.md` before contributing.
- Open an issue to discuss significant changes before implementing.
- Keep PRs focused and include tests where possible.
- Run linters and build locally: `npm run lint` and `npm run build`.

Quick flow:

```bash
git checkout -b feature/your-feature
# implement changes
npm run lint && npm run build
git commit -m "feat: short description"
git push origin feature/your-feature
```

We recommend adding a `CONTRIBUTING.md` later with a PR checklist and CI guidance; I can scaffold that for you.


## Security & privacy notes

- Use RLS in Supabase and validate JWTs / signatures server-side.
- Avoid storing secrets in the repo; use environment variables or secret managers.
- Add input validation and file-size limits to upload endpoints.

Report security issues privately: `security@istory.app`.


## Deployment

Recommended: Vercel for Next.js hosting; use Vercel secrets for envs.

Production build:

```bash
npm run build
npm run start
```

Smart contract workflow (Hardhat):

1. Configure network in `hardhat.config.js`.
2. Keep private keys in env / secret managers.
3. Deploy with `npx hardhat run scripts/deploy.js --network <network>`.

IPFS pinning: use Pinata or similar for persistence.


## License

This project is released under the MIT License. See `LICENSE` for details.

## Roadmap

### Current

- [x] MVP: Core journaling and story management
- [x] Voice recording and AI transcription
- [x] Social feed and engagement
- [x] Profile and user management
- [x] Paywall and monetization system
- [x] Beautiful footer component
- [x] Story detail page with full features

### Q1 2026

- [ ] Mobile app (React Native)
- [ ] Advanced AI recommendations
- [ ] Trending stories leaderboard
- [ ] Cross-chain support (Optimism, Arbitrum)
- [ ] Enhanced notification system

### Q2 2026

- [ ] Story marketplace (buy/sell books)
- [ ] Community challenges (#MyLifeStoryChallenge)
- [ ] Video story support
- [ ] Collaborative storytelling
- [ ] Advanced analytics dashboard

### Future

- [ ] AI-generated audiobook narration
- [ ] Multi-language support
- [ ] AI story translation
- [ ] Community moderation system
- [ ] Verified creator badges

## Feedback & Support

### Get Help

- **Discord**: [Join our community](https://discord.gg/istory)
- **Twitter/X**: [@iStoryApp](https://twitter.com/istoryapp)
- **Email**: [support@istory.app](mailto:support@istory.app)

### Discussions

- [GitHub Discussions](https://github.com/Oreolion/web3_Ai_iStory/discussions)
- [Discord Server](https://discord.gg/istory)
- [Reddit Community](https://reddit.com/r/istoryapp)

## Team & Contact

### Project Lead

- **Name**: Remi Adedeji
- **Twitter**: [@remyOreo_](https://twitter.com/remyOreo_)
- **Email**: [remyoreo11@gmail.com](mailto:remyoreo11@gmail.com)

### Contributing

Special thanks to all contributors who help make iStory better! 🙏

---

## Target Audience

### Primary Demographics

- **Ages**: 18-45 (Millennials & Gen Z focus)
- **Tech-Savviness**: Comfortable with Web3 and blockchain
- **Geography**: Global, with focus on blockchain-active regions (North America, Europe, Asia)
- **Interest**: Storytelling, digital ownership, creative expression

### Key Personas

- **Aspiring Storytellers**: People who journal via voice and want AI enhancements
- **Web3 Enthusiasts**: Crypto users interested in NFTs and blockchain permanence
- **Content Creators**: Influencers looking to monetize stories and build communities
- **Truth Advocates**: Activists and historians preserving unfiltered narratives
- **Side Hustlers**: Freelancers earning through story monetization

### Use Cases

- Daily voice journaling with AI transcription
- Compiling life stories into published books
- Building personal brand as a creator
- Earning passive income from story engagement
- Creating permanent, tamper-proof records
- Building engaged communities around storytelling

---

TODO: USER SHOULD BE ABLE TO CREATE SPECIFIC PAST INTERESTING LIFE STORIES WITH DATE
Target Customer for Speak Your Story (iStory)

The target customer for Speak Your Story is a diverse group of individuals who value personal expression, digital ownership, and financial empowerment through storytelling. Here's a breakdown:

Primary Demographics:
        Ages 18-45, with a focus on millennials and Gen Z who are tech-savvy and active on social media.
        Balanced gender split, appealing to both men and women interested in self-reflection, creativity, or activism.
        Global users, particularly in regions with high blockchain adoption (e.g., North America, Europe, Asia) and those facing narrative suppression or censorship.

Key Personas:
        Aspiring Storytellers and Journalers: Everyday people who want an easy way to document their lives via voice, without the hassle of writing. They seek AI tools to enhance their entries and compile them into books for personal growth or sharing.
        Blockchain and Crypto Enthusiasts: Web3 users who appreciate NFTs, tokens, and decentralization for owning and monetizing content. They value the app's use of Base (Ethereum L2) for low fees and tamper-proof storage.
        Content Creators and Influencers: Writers, podcasters, or social media users looking to broadcast authentic stories, build communities, and earn through likes, tips, paywalls, or NFT sales. They use viral features like streaks and leaderboards to grow their audience.
        History and Truth Advocates: Individuals concerned about manipulated narratives (e.g., activists, historians, or those from marginalized communities) who want to preserve unfiltered truths on an immutable blockchain.
        Monetization Seekers: Freelancers or side-hustlers aiming to turn personal stories into revenue streams, such as selling digital books or earning $STORY tokens from engagement.

Pain Points Addressed:
        Traditional journaling apps lack permanence and monetization; Speak Your Story counters this with blockchain immortality and rewards.
        Users frustrated by centralized platforms' censorship or data ownership issues find solace in decentralized, user-owned content.

Acquisition Channels:
        Crypto communities (e.g., X/Twitter, Discord, Reddit's r/cryptocurrency or r/web3).
        Storytelling forums (e.g., Wattpad, Medium users migrating to Web3).
        Viral marketing via #MyLifeStoryChallenge on social media.
        Partnerships with AI/blockchain influencers.

This app targets about 10-20 million potential users in the journaling (e.g., Day One app users) and NFT creator markets, with growth potential in emerging Web3 economies. Early adopters are likely crypto holders with wallets like MetaMask, seeking innovative dApps.

*Preserve your truth. Mint your legacy. Speak Your Story.*
**Made with ❤️ by the iStory Team**

````
