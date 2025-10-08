// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract iStoryToken is ERC20, ERC20Burnable, ERC20Permit, Ownable, ReentrancyGuard, Pausable {
    event TokensMinted(address indexed to, uint256 amount);
    event TokensDistributed(address indexed from, address indexed to, uint256 amount, string reason);
    event TipSent(address indexed from, address indexed to, uint256 amount, uint256 indexed storyId); // New: For tips
    event PaywallPaid(address indexed from, address indexed creator, uint256 amount, uint256 indexed storyId); // New: For paywalls

    constructor() ERC20("iStoryToken", "$ISTORY") ERC20Permit("iStoryToken") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function distributeReward(address to, uint256 amount, string memory reason) external onlyOwner nonReentrant whenNotPaused {
        _mint(to, amount);
        emit TokensDistributed(msg.sender, to, amount, reason);
    }

    // New: Tip function (direct transfer + event for indexing)
    function tipCreator(address creator, uint256 amount, uint256 storyId) external nonReentrant whenNotPaused {
        require(amount > 0, "Tip amount must be positive");
        _transfer(msg.sender, creator, amount);
        emit TipSent(msg.sender, creator, amount, storyId);
    }

    // New: Paywall payment (transfer to creator + event)
    function payPaywall(address creator, uint256 amount, uint256 storyId) external nonReentrant whenNotPaused {
        require(amount > 0, "Paywall amount must be positive");
        _transfer(msg.sender, creator, amount);
        emit PaywallPaid(msg.sender, creator, amount, storyId);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override(ERC20) whenNotPaused {
        super._update(from, to, value);
    }
}