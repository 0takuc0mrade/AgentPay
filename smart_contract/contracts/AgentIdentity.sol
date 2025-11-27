// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentIdentity is ERC721URIStorage, Ownable{
  uint256 private _nextTokenId;

  constructor() ERC721("AgentAuth", "AGENT") Ownable(msg.sender){}

  function registerAgent(address creator, string memory metadataURI) public returns (uint256){
    uint256 tokenId = _nextTokenId++;

    _safeMint(creator, tokenId);

    _setTokenURI(tokenId, metadataURI);

    return tokenId;
  }

  function setAgentURI(uint256 tokenID, string memory newURI) public {
    require(ownerOf(tokenID) == msg.sender, "Caller is not the agent owner");
    _setTokenURI(tokenID, newURI);
  }
}
