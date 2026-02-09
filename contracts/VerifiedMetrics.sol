// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";

/**
 * @title VerifiedMetrics
 * @notice Stores AI-verified story metrics attested by Chainlink CRE.
 * @dev Extends ReceiverTemplate to receive signed CRE reports via the
 *      KeystoneForwarder. The forwarder verifies DON node signatures
 *      before calling onReport(), which delegates to _processReport().
 *
 *      Buyers can trust these metrics for paywalled content because
 *      they are cryptographically verified by Chainlink DON nodes.
 */
contract VerifiedMetrics is ReceiverTemplate {

    struct Metrics {
        uint8 significanceScore;   // 0-100
        uint8 emotionalDepth;      // 1-5
        uint8 qualityScore;        // 0-100
        uint32 wordCount;
        string[] themes;
        bytes32 attestationId;
        uint256 verifiedAt;
        bool exists;
    }

    // storyId (bytes32 hash) => Metrics
    mapping(bytes32 => Metrics) public metrics;

    event MetricsVerified(
        bytes32 indexed storyId,
        address indexed author,
        uint8 significanceScore,
        uint8 emotionalDepth,
        uint8 qualityScore,
        uint32 wordCount,
        bytes32 attestationId
    );

    /**
     * @param _forwarderAddress Chainlink KeystoneForwarder on this chain.
     *        Base Sepolia: 0x82300bd7c3958625581cc2f77bc6464dcecdf3e5
     */
    constructor(address _forwarderAddress) ReceiverTemplate(_forwarderAddress) {}

    // ─── CRE Report Processing ───────────────────────────────────────

    /**
     * @notice Decodes and stores verified metrics from a CRE report.
     * @dev Called by ReceiverTemplate.onReport() after forwarder validation.
     *      The report bytes are ABI-encoded as:
     *        (bytes32 storyId, address author, uint8 significanceScore,
     *         uint8 emotionalDepth, uint8 qualityScore, uint32 wordCount,
     *         string[] themes, bytes32 attestationId)
     *
     *      This matches the encodeAbiParameters() call in the CRE workflow's
     *      httpCallback.ts.
     */
    function _processReport(bytes calldata report) internal override {
        (
            bytes32 storyId,
            address author,
            uint8 significanceScore,
            uint8 emotionalDepth,
            uint8 qualityScore,
            uint32 wordCount,
            string[] memory themes,
            bytes32 attestationId
        ) = abi.decode(
            report,
            (bytes32, address, uint8, uint8, uint8, uint32, string[], bytes32)
        );

        require(significanceScore <= 100, "Significance out of range");
        require(emotionalDepth >= 1 && emotionalDepth <= 5, "Emotional depth out of range");
        require(qualityScore <= 100, "Quality out of range");

        metrics[storyId] = Metrics({
            significanceScore: significanceScore,
            emotionalDepth: emotionalDepth,
            qualityScore: qualityScore,
            wordCount: wordCount,
            themes: themes,
            attestationId: attestationId,
            verifiedAt: block.timestamp,
            exists: true
        });

        emit MetricsVerified(
            storyId,
            author,
            significanceScore,
            emotionalDepth,
            qualityScore,
            wordCount,
            attestationId
        );
    }

    // ─── Read Functions (unchanged) ──────────────────────────────────

    /**
     * @notice Get verified metrics for a story
     */
    function getMetrics(bytes32 storyId) external view returns (
        uint8 significanceScore,
        uint8 emotionalDepth,
        uint8 qualityScore,
        uint32 wordCount,
        string[] memory themes,
        bytes32 attestationId,
        uint256 verifiedAt
    ) {
        require(metrics[storyId].exists, "Not verified");
        Metrics storage m = metrics[storyId];
        return (
            m.significanceScore,
            m.emotionalDepth,
            m.qualityScore,
            m.wordCount,
            m.themes,
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
}
