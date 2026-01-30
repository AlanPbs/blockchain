// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IComplianceRegistry {
    function isVerified(address _account) external view returns (bool);
}

contract AssetNFT is ERC721, Ownable {
    IComplianceRegistry public complianceRegistry;
    uint256 public nextTokenId;

    mapping(uint256 => string) public tokenURIs;
    mapping(string => bool) public mintedURIs;

    constructor(address _complianceRegistry) ERC721("Fine Art Collection", "ART") Ownable(msg.sender) {
        complianceRegistry = IComplianceRegistry(_complianceRegistry);
    }

    // Override _update (OpenZeppelin v5) or _beforeTokenTransfer (v4)
    // Assuming OZ v5 for this modern project
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0)) {
            require(complianceRegistry.isVerified(from), "Sender not verified");
        }
        if (to != address(0)) {
            require(complianceRegistry.isVerified(to), "Receiver not verified");
        }
        
        return from;
    }

    uint256 public constant MINT_PRICE = 0.001 ether;

    function mint(address to, string memory _uri) external onlyOwner {
        require(!mintedURIs[_uri], "NFT already minted");
        _safeMintNFT(to, _uri);
    }

    function buyNFT(string memory _uri) external payable {
        require(msg.value >= MINT_PRICE, "Insufficient ETH sent");
        require(complianceRegistry.isVerified(msg.sender), "Buyer not verified");
        require(!mintedURIs[_uri], "NFT already minted");
        _safeMintNFT(msg.sender, _uri);
    }

    function _safeMintNFT(address to, string memory _uri) internal {
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        tokenURIs[tokenId] = _uri;
        mintedURIs[_uri] = true;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return tokenURIs[tokenId];
    }
}
