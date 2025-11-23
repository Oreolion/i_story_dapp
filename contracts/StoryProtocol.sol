// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; // Best Practice
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StoryProtocol is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20; // Prevents silent failures on transfers

    IERC20 public immutable storyToken;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Events for Backend Indexing
    event TipSent(address indexed from, address indexed to, uint256 amount, uint256 indexed storyId);
    event ContentUnlocked(address indexed payer, address indexed author, uint256 amount, uint256 indexed contentId);

    constructor(address _tokenAddress, address initialAdmin) {
        storyToken = IERC20(_tokenAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    /**
     * @notice Tip a creator. 
     * @dev User must approve this contract to spend ISTORY.
     */
    function tipCreator(address creator, uint256 amount, uint256 storyId) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(creator != address(0), "Invalid creator address");
        
        // Safe transfer from Sender -> Creator
        storyToken.safeTransferFrom(msg.sender, creator, amount);

        emit TipSent(msg.sender, creator, amount, storyId);
    }

    /**
     * @notice Pay to unlock content.
     * @dev Backend listens for 'ContentUnlocked' to update Supabase.
     */
    function payPaywall(address author, uint256 amount, uint256 contentId) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(author != address(0), "Invalid author address");

        // Safe transfer from Payer -> Author
        storyToken.safeTransferFrom(msg.sender, author, amount);

        emit ContentUnlocked(msg.sender, author, amount, contentId);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}