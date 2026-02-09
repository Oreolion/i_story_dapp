# Decision Log & References

## Decision Log

### Why private-first instead of public-first?
Public-first incentivizes performance over authenticity. Private-first with selective sharing creates higher-quality public content and differentiates from social media.

### Why "canonical" stories?
Not all memories are equally important. Introducing intentional selection prevents noise, enables meaningful NFT minting, and creates the foundation for AI that understands what matters to the user.

### Why metadata extraction before graph database?
GraphRAG (Neo4j) is powerful but complex. Starting with a metadata table in Supabase proves the value of cognitive features before committing to architectural complexity. Can migrate to graph later if needed.

### Why Gemini Flash for analysis?
Already used for enhancement, keeps the stack simple. Fast and cost-effective for metadata extraction. Can swap for other models later if needed.

### Why keep social features for now?
Need users before we can serve users. Social provides discovery, engagement loops, and monetization validation. Will rebalance hierarchy after cognitive features are validated.

## References

- **Project Vision:** Research document "The Architecture of Digital Immortality"
In a world where history has often been manipulated by conquerors, victors and dominating empires, iStory reclaims the power of authentic storytelling. Users can broadcast their unfiltered truths forever on the blockchain, ensuring tamper-proof preservation, while earning rewards through community engagement and NFT-based sales.
- **Competitive Analysis:** StoriedLife, Remento, Rewind.ai (capture-focused, not cognitive)
- **Psychological Framework:** Self-Defining Memories (Singer), Self-Memory System (Conway)
- **Technical Reference:** GraphRAG (Microsoft Research) — future consideration
