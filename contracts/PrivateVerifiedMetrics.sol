// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";

/**
 * @title PrivateVerifiedMetrics
 * @notice Privacy-preserving CRE-attested story metrics.
 * @dev Only stores minimal cryptographic proofs on-chain:
 *      - A quality tier (1-5) and boolean threshold
 *      - A keccak256 hash of full metrics (provable off-chain)
 *      - An author commitment hash (not raw wallet address)
 *
 *      Full metrics are stored off-chain (Supabase) visible only
 *      to the author. The blockchain attests that verification
 *      happened without broadcasting what was found.
 */
contract PrivateVerifiedMetrics is ReceiverTemplate {

    struct MinimalMetrics {
        bool meetsQualityThreshold;  // qualityScore >= 70
        uint8 qualityTier;           // 1-5 (ranges: 0-20, 21-40, 41-60, 61-80, 81-100)
        bytes32 metricsHash;         // keccak256(abi.encode(all scores + themes + salt))
        bytes32 authorCommitment;    // keccak256(abi.encodePacked(authorWallet, storyId))
        bytes32 attestationId;
        uint256 verifiedAt;
        bool exists;
    }

    // storyId (bytes32 hash) => MinimalMetrics
    mapping(bytes32 => MinimalMetrics) public metrics;

    // No raw address, no scores, no themes in events
    event MetricsVerified(
        bytes32 indexed storyId,
        bytes32 indexed authorCommitment,
        uint8 qualityTier,
        bool meetsQualityThreshold
    );

    /**
     * @param _forwarderAddress Chainlink KeystoneForwarder on this chain.
     *        Base Sepolia: 0x82300bd7c3958625581cc2f77bc6464dcecdf3e5
     */
    constructor(address _forwarderAddress) ReceiverTemplate(_forwarderAddress) {}

    // --- CRE Report Processing ---

    /**
     * @notice Decodes and stores minimal privacy-preserving metrics from a CRE report.
     * @dev Called by ReceiverTemplate.onReport() after forwarder validation.
     *      The report bytes are ABI-encoded as:
     *        (bytes32 storyId, bytes32 authorCommitment, bool meetsQualityThreshold,
     *         uint8 qualityTier, bytes32 metricsHash, bytes32 attestationId)
     */
    function _processReport(bytes calldata report) internal override {
        (
            bytes32 storyId,
            bytes32 authorCommitment,
            bool meetsQualityThreshold,
            uint8 qualityTier,
            bytes32 metricsHash,
            bytes32 attestationId
        ) = abi.decode(
            report,
            (bytes32, bytes32, bool, uint8, bytes32, bytes32)
        );

        require(qualityTier >= 1 && qualityTier <= 5, "Quality tier out of range");

        metrics[storyId] = MinimalMetrics({
            meetsQualityThreshold: meetsQualityThreshold,
            qualityTier: qualityTier,
            metricsHash: metricsHash,
            authorCommitment: authorCommitment,
            attestationId: attestationId,
            verifiedAt: block.timestamp,
            exists: true
        });

        emit MetricsVerified(
            storyId,
            authorCommitment,
            qualityTier,
            meetsQualityThreshold
        );
    }

    // --- Read Functions ---

    /**
     * @notice Get minimal verified metrics for a story
     */
    function getMetrics(bytes32 storyId) external view returns (
        bool meetsQualityThreshold,
        uint8 qualityTier,
        bytes32 metricsHash,
        bytes32 authorCommitment,
        bytes32 attestationId,
        uint256 verifiedAt
    ) {
        require(metrics[storyId].exists, "Not verified");
        MinimalMetrics storage m = metrics[storyId];
        return (
            m.meetsQualityThreshold,
            m.qualityTier,
            m.metricsHash,
            m.authorCommitment,
            m.attestationId,
            m.verifiedAt
        );
    }

    /**
     * @notice Check if a story has been verified
     */
    function isVerified(bytes32 storyId) external view returns (bool) {
        return metrics[storyId].exists;
    }

    /**
     * @notice Get attestation ID for a verified story
     */
    function getAttestationId(bytes32 storyId) external view returns (bytes32) {
        require(metrics[storyId].exists, "Not verified");
        return metrics[storyId].attestationId;
    }

    /**
     * @notice Prove authorship by recomputing the commitment hash.
     * @dev Returns true if keccak256(abi.encodePacked(author, storyId)) matches
     *      the stored authorCommitment. Allows an author to prove they own
     *      the story without the commitment being reversible by others.
     */
    function verifyAuthor(bytes32 storyId, address author) external view returns (bool) {
        if (!metrics[storyId].exists) return false;
        bytes32 computed = keccak256(abi.encodePacked(author, storyId));
        return computed == metrics[storyId].authorCommitment;
    }

    /**
     * @notice Prove full metrics integrity by comparing the hash.
     * @dev The caller provides the hash they computed off-chain from the
     *      full metrics data. Returns true if it matches the on-chain hash.
     */
    function verifyMetricsHash(bytes32 storyId, bytes32 hash) external view returns (bool) {
        if (!metrics[storyId].exists) return false;
        return hash == metrics[storyId].metricsHash;
    }
}
