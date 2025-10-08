// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract StorybookNFT is
    ERC721Pausable,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    IERC2981
{
    uint256 private _nextTokenId;
    uint96 private _royaltyBps = 1000; // 10%
    address private _royaltyReceiver;

    mapping(uint256 => uint256) public paywallAmounts;
    mapping(address => bool) public whitelistedContracts;

    event JournalMinted(uint256 indexed tokenId, address indexed owner, string uri, uint256 paywallAmount);
    event RoyaltyUpdated(address indexed receiver, uint96 bps);
    event PaywallSet(uint256 indexed tokenId, uint256 amount);
    event WhitelistUpdated(address indexed contractAddress, bool allowed);

    constructor(address royaltyReceiver) ERC721("StorybookNFT", "SBNFT") Ownable(msg.sender) {
        _royaltyReceiver = royaltyReceiver;
    }

    // 🔒 Add system contract whitelist
    function setWhitelist(address contractAddress, bool allowed) external onlyOwner {
        whitelistedContracts[contractAddress] = allowed;
        emit WhitelistUpdated(contractAddress, allowed);
    }

    modifier onlyWhitelistedOrOwner() {
        require(
            msg.sender == owner() || whitelistedContracts[msg.sender],
            "Not authorized to mint"
        );
        _;
    }

    // 🟢 Minting — now restricted to owner or whitelisted system contracts
    function mintJournal(address to, string memory uri, uint256 paywallAmount)
        external
        onlyWhitelistedOrOwner
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        paywallAmounts[tokenId] = paywallAmount;

        emit JournalMinted(tokenId, to, uri, paywallAmount);
        emit PaywallSet(tokenId, paywallAmount);

        return tokenId;
    }

    // 🟡 Paywall Control
    function setPaywall(uint256 tokenId, uint256 amount) external onlyOwner whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        paywallAmounts[tokenId] = amount;
        emit PaywallSet(tokenId, amount);
    }

    function getPaywall(uint256 tokenId) external view returns (uint256) {
        return paywallAmounts[tokenId];
    }

    // 💰 Royalty support (ERC2981)
    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (_royaltyReceiver, (salePrice * _royaltyBps) / 10000);
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        _royaltyReceiver = receiver;
        _royaltyBps = bps;
        emit RoyaltyUpdated(receiver, bps);
    }

    // ⚙️ Overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
