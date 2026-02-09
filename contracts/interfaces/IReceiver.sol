// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "./IERC165.sol";

/// @title IReceiver - Chainlink CRE Keystone report receiver
/// @notice Implementations must support the IReceiver interface through ERC165.
interface IReceiver is IERC165 {
    /// @notice Handles incoming keystone reports.
    /// @dev If this function call reverts, it can be retried with a higher gas
    /// limit. The receiver is responsible for discarding stale reports.
    /// @param metadata Report's metadata (workflowId + workflowName + workflowOwner).
    /// @param report Workflow report (ABI-encoded payload).
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
