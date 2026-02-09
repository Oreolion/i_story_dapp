// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * CRE Verification Contract Template
 *
 * Pattern: Authorized CRE forwarder writes verified results on-chain.
 * Only the CRE forwarder address can call store functions.
 *
 * Usage:
 * 1. Copy to contracts/YourContract.sol
 * 2. Customize the data struct and storage
 * 3. Deploy and set CRE forwarder address
 */
contract CREVerifier is Ownable {
    // CRE forwarder address (set after workflow deployment)
    address public creForwarder;

    // Verified data storage
    struct VerifiedData {
        uint256 value;
        uint256 timestamp;
        bytes32 attestationId;
        bool exists;
    }

    mapping(bytes32 => VerifiedData) public verifiedData;

    event DataVerified(
        bytes32 indexed dataId,
        uint256 value,
        bytes32 attestationId,
        uint256 timestamp
    );

    modifier onlyCRE() {
        require(msg.sender == creForwarder, "Only CRE forwarder");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * Store verified data (called by CRE workflow)
     */
    function storeVerifiedData(
        bytes32 dataId,
        uint256 value,
        bytes32 attestationId
    ) external onlyCRE {
        verifiedData[dataId] = VerifiedData({
            value: value,
            timestamp: block.timestamp,
            attestationId: attestationId,
            exists: true
        });

        emit DataVerified(dataId, value, attestationId, block.timestamp);
    }

    /**
     * Check if data has been verified
     */
    function isVerified(bytes32 dataId) external view returns (bool) {
        return verifiedData[dataId].exists;
    }

    /**
     * Get verified data
     */
    function getData(bytes32 dataId) external view returns (VerifiedData memory) {
        require(verifiedData[dataId].exists, "Data not verified");
        return verifiedData[dataId];
    }

    /**
     * Admin: Set CRE forwarder address
     */
    function setCREForwarder(address _forwarder) external onlyOwner {
        require(_forwarder != address(0), "Invalid forwarder");
        creForwarder = _forwarder;
    }
}
