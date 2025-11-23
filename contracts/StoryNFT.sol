// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol"; // Royalty Standard

contract StoryNFT is ERC721URIStorage, AccessControl, ERC2981 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    event NFTMinted(uint256 indexed tokenId, address indexed recipient, string uri, string collectionType);

    constructor(address defaultAdmin) ERC721("IStory Collections", "ISTORY") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        
        // Set default royalty to 5% (500 basis points)
        _setDefaultRoyalty(defaultAdmin, 500);
    }

    // 1. WEEKLY WINNER MINT (Admin Only)
    function mintWeeklyWinner(address winner, string memory uri) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(winner, tokenId);
        _setTokenURI(tokenId, uri);
        emit NFTMinted(tokenId, winner, uri, "WEEKLY_WINNER");
    }

    // 2. BOOK/COLLECTION MINT (Public)
    function mintBook(string memory uri) external {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit NFTMinted(tokenId, msg.sender, uri, "BOOK");
    }

    // Update Royalty settings if needed
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // --- OVERRIDES (Fixed) ---

    // FIX: Removed 'ERC721' from override list. 
    // We only override ERC721URIStorage because it is the direct parent that implements tokenURI.
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // FIX: Removed 'ERC721' from override list here too.
    // We override the specific extensions that modify interface support.
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721URIStorage, AccessControl, ERC2981) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}