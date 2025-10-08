// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./iStoryToken.sol"; // Points to same-folder file

contract LikeSystem is Ownable, ReentrancyGuard, Pausable {
    iStoryToken public storyToken;
    mapping(uint256 => uint256) public storyLikes; // tokenId => like count
    mapping(address => mapping(uint256 => bool)) public hasLiked; // user => tokenId => liked

    uint256 public constant REWARD_PER_LIKE = 5 * 10**18; // 5 $ISTORY per like

    event StoryLiked(uint256 indexed tokenId, address indexed liker, uint256 totalLikes);
    event RewardDistributed(address indexed liker, uint256 amount);

    constructor(address _storyToken) Ownable(msg.sender) {
        storyToken = iStoryToken(_storyToken);
    }

    function likeStory(uint256 tokenId, address liker) external onlyOwner nonReentrant whenNotPaused {
        require(!hasLiked[liker][tokenId], "Already liked");
        hasLiked[liker][tokenId] = true;
        storyLikes[tokenId]++;
        storyToken.distributeReward(liker, REWARD_PER_LIKE, "Like reward");
        emit StoryLiked(tokenId, liker, storyLikes[tokenId]);
        emit RewardDistributed(liker, REWARD_PER_LIKE);
    }

    function getLikes(uint256 tokenId) external view returns (uint256) {
        return storyLikes[tokenId];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}