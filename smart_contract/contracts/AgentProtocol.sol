// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Permit {
    function transferWithAuthorization(
        address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s
    ) external;
}

contract AgentProtocol is ERC721URIStorage, Ownable {
    using ECDSA for bytes32;

    struct PaymentParams {
        address payer;
        uint256 amount;
        bytes32 paymentNonce;
        uint256 validAfter;
        uint256 validBefore;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    uint256 private _nextTokenId;
    address public immutable usdcToken;

    // --- REVENUE CONFIGURATION ---
    uint256 public registrationFee = 1 * 10**6;
    address public treasury;

    mapping(uint256 => address) public agentWorkers;
    mapping(uint256 => uint256) public agentTxCount;

    event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint8 score, bytes32 indexed tag1, bytes32 tag2, string fileuri, bytes32 paymentNonce);
    event AgentRegistered(uint256 indexed agentId, address indexed creator, string metadataURI);

    // --- LEVEL 3: DISCOVERY ---
    struct Service {
        string name;
        uint256 price;
        bool active;
    }
    mapping(uint256 => Service[]) public agentServices;

    constructor(address _usdcAddress, address _treasury) ERC721("AgentAuth", "AGENT") Ownable(msg.sender) {
        usdcToken = _usdcAddress;
        treasury = _treasury;
    }

    // --- ADMIN ---
    function setRegistrationFee(uint256 _fee) external onlyOwner {
        registrationFee = _fee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    // --- IDENTITY (PAYABLE NOW) ---
    function registerAgent(address creator, string memory metadataURI) public returns (uint256) {
        if (registrationFee > 0) {
            bool success = IERC20(usdcToken).transferFrom(msg.sender, treasury, registrationFee);
            require(success, "Registration Fee Transfer Failed");
        }

        // 2. Mint Identity
        uint256 tokenId = _nextTokenId++;
        _safeMint(creator, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit AgentRegistered(tokenId, creator, metadataURI);
        return tokenId;
    }

    function setWorkerAddress(uint256 agentId, address worker) public {
        require(ownerOf(agentId) == msg.sender, "Caller is not the agent owner");
        agentWorkers[agentId] = worker;
    }

    function setAgentURI(uint256 tokenId, string memory newURI) public {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the agent owner");
        _setTokenURI(tokenId, newURI);
    }

    function addService(uint256 agentId, string memory name, uint256 price) public {
        require(ownerOf(agentId) == msg.sender, "Not the owner");
        agentServices[agentId].push(Service(name, price, true));
    }

    function getServices(uint256 agentId) public view returns (Service[] memory) {
        return agentServices[agentId];
    }

    // --- ATOMIC SETTLEMENT (DIRECT P2P) ---
    function settleAndLog(
        PaymentParams calldata payData,
        uint256 agentId,
        uint8 score,
        bytes memory repSignature,
        bytes32 tag2,
        string memory fileuri
    ) public {
        require(score <= 100, "Invalid score");

        address agentWallet = agentWorkers[agentId];
        require(agentWallet != address(0), "Agent worker not set");

        IERC20Permit(usdcToken).transferWithAuthorization(
            payData.payer,
            agentWallet, // Destination
            payData.amount,
            payData.validAfter,
            payData.validBefore,
            payData.paymentNonce,
            payData.v,
            payData.r,
            payData.s
        );

        // 2. VERIFY REPUTATION
        bytes32 hash = keccak256(abi.encodePacked(agentId, score, payData.paymentNonce));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(hash);
        address signer = ECDSA.recover(ethSignedHash, repSignature);

        require(signer == agentWallet, "Agent did not authorize this review");

        // 3. LOG
        agentTxCount[agentId]++;
        emit NewFeedback(agentId, payData.payer, score, keccak256("x402-verified"), tag2, fileuri, payData.paymentNonce);
    }
}