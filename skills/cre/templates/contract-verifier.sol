// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReceiverTemplate} from "../interfaces/ReceiverTemplate.sol";

/**
 * CRE Verification Contract Template
 *
 * Pattern: Extends ReceiverTemplate to receive signed CRE reports
 * via the Chainlink KeystoneForwarder. The forwarder verifies DON
 * node signatures before calling onReport(), which delegates to
 * _processReport().
 *
 * IMPORTANT: Do NOT use the old `onlyCRE` modifier pattern.
 * ReceiverTemplate handles forwarder validation automatically.
 *
 * Usage:
 *   1. Copy to contracts/YourContract.sol
 *   2. Copy contracts/interfaces/ directory (IERC165, IReceiver, ReceiverTemplate)
 *   3. Customize VerifiedData struct and _processReport() decode
 *   4. Deploy with KeystoneForwarder address:
 *      - Base Sepolia: 0x82300bd7c3958625581cc2f77bc6464dcecdf3e5
 *   5. Ensure ABI params in _processReport match workflow's encodeAbiParameters
 */
contract CREVerifier is ReceiverTemplate {

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

    /**
     * @param _forwarderAddress Chainlink KeystoneForwarder address.
     *        Base Sepolia: 0x82300bd7c3958625581cc2f77bc6464dcecdf3e5
     */
    constructor(address _forwarderAddress) ReceiverTemplate(_forwarderAddress) {}

    /**
     * @notice Decodes and stores verified data from a CRE report.
     * @dev Called by ReceiverTemplate.onReport() after forwarder validation.
     *      The report bytes must match the workflow's encodeAbiParameters() call.
     */
    function _processReport(bytes calldata report) internal override {
        (
            bytes32 dataId,
            uint256 value,
            bytes32 attestationId
        ) = abi.decode(report, (bytes32, uint256, bytes32));

        verifiedData[dataId] = VerifiedData({
            value: value,
            timestamp: block.timestamp,
            attestationId: attestationId,
            exists: true
        });

        emit DataVerified(dataId, value, attestationId, block.timestamp);
    }

    function isVerified(bytes32 dataId) external view returns (bool) {
        return verifiedData[dataId].exists;
    }

    function getData(bytes32 dataId) external view returns (VerifiedData memory) {
        require(verifiedData[dataId].exists, "Data not verified");
        return verifiedData[dataId];
    }
}
