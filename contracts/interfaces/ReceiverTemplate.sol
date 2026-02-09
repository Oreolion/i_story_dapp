// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "./IERC165.sol";
import {IReceiver} from "./IReceiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReceiverTemplate - Abstract base for Chainlink CRE report receivers
/// @notice Validates the KeystoneForwarder caller and optional workflow identity,
///         then delegates to _processReport() for business logic.
abstract contract ReceiverTemplate is IReceiver, Ownable {
    address private s_forwarderAddress;
    address private s_expectedAuthor;
    bytes10 private s_expectedWorkflowName;
    bytes32 private s_expectedWorkflowId;

    error InvalidForwarderAddress();
    error InvalidSender(address sender, address expected);
    error InvalidAuthor(address received, address expected);
    error InvalidWorkflowName(bytes10 received, bytes10 expected);
    error InvalidWorkflowId(bytes32 received, bytes32 expected);
    error WorkflowNameRequiresAuthorValidation();

    event ForwarderAddressUpdated(address indexed previousForwarder, address indexed newForwarder);
    event ExpectedAuthorUpdated(address indexed previousAuthor, address indexed newAuthor);
    event ExpectedWorkflowNameUpdated(bytes10 indexed previousName, bytes10 indexed newName);
    event ExpectedWorkflowIdUpdated(bytes32 indexed previousId, bytes32 indexed newId);

    constructor(address _forwarderAddress) Ownable(msg.sender) {
        if (_forwarderAddress == address(0)) {
            revert InvalidForwarderAddress();
        }
        s_forwarderAddress = _forwarderAddress;
        emit ForwarderAddressUpdated(address(0), _forwarderAddress);
    }

    // ─── Core onReport implementation ────────────────────────────────

    function onReport(
        bytes calldata metadata,
        bytes calldata report
    ) external override {
        // Verify caller is the trusted Chainlink Forwarder
        if (s_forwarderAddress != address(0) && msg.sender != s_forwarderAddress) {
            revert InvalidSender(msg.sender, s_forwarderAddress);
        }

        // Verify workflow identity (if any permission fields are set)
        if (
            s_expectedWorkflowId != bytes32(0) ||
            s_expectedAuthor != address(0) ||
            s_expectedWorkflowName != bytes10(0)
        ) {
            (bytes32 workflowId, bytes10 workflowName, address workflowOwner) = _decodeMetadata(metadata);

            if (s_expectedWorkflowId != bytes32(0) && workflowId != s_expectedWorkflowId) {
                revert InvalidWorkflowId(workflowId, s_expectedWorkflowId);
            }
            if (s_expectedAuthor != address(0) && workflowOwner != s_expectedAuthor) {
                revert InvalidAuthor(workflowOwner, s_expectedAuthor);
            }
            if (s_expectedWorkflowName != bytes10(0)) {
                if (s_expectedAuthor == address(0)) {
                    revert WorkflowNameRequiresAuthorValidation();
                }
                if (workflowName != s_expectedWorkflowName) {
                    revert InvalidWorkflowName(workflowName, s_expectedWorkflowName);
                }
            }
        }

        _processReport(report);
    }

    // ─── Abstract hook: implement business logic here ────────────────

    function _processReport(bytes calldata report) internal virtual;

    // ─── Metadata decoding ───────────────────────────────────────────

    function _decodeMetadata(
        bytes memory metadata
    ) internal pure returns (bytes32 workflowId, bytes10 workflowName, address workflowOwner) {
        // metadata is abi.encodePacked(bytes32, bytes10, address) = 62 bytes
        assembly {
            workflowId := mload(add(metadata, 32))
            workflowName := mload(add(metadata, 64))
            workflowOwner := shr(mul(12, 8), mload(add(metadata, 74)))
        }
        return (workflowId, workflowName, workflowOwner);
    }

    // ─── ERC165 ──────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    // ─── Owner-only setters ──────────────────────────────────────────

    function setForwarderAddress(address _forwarder) external onlyOwner {
        address previous = s_forwarderAddress;
        s_forwarderAddress = _forwarder;
        emit ForwarderAddressUpdated(previous, _forwarder);
    }

    function setExpectedAuthor(address _author) external onlyOwner {
        address previous = s_expectedAuthor;
        s_expectedAuthor = _author;
        emit ExpectedAuthorUpdated(previous, _author);
    }

    function setExpectedWorkflowName(string calldata _name) external onlyOwner {
        bytes10 previous = s_expectedWorkflowName;
        s_expectedWorkflowName = bytes10(bytes(_name));
        emit ExpectedWorkflowNameUpdated(previous, bytes10(bytes(_name)));
    }

    function setExpectedWorkflowId(bytes32 _id) external onlyOwner {
        bytes32 previous = s_expectedWorkflowId;
        s_expectedWorkflowId = _id;
        emit ExpectedWorkflowIdUpdated(previous, _id);
    }

    // ─── View functions ──────────────────────────────────────────────

    function getForwarderAddress() external view returns (address) {
        return s_forwarderAddress;
    }

    function getExpectedAuthor() external view returns (address) {
        return s_expectedAuthor;
    }

    function getExpectedWorkflowName() external view returns (bytes10) {
        return s_expectedWorkflowName;
    }

    function getExpectedWorkflowId() external view returns (bytes32) {
        return s_expectedWorkflowId;
    }
}
