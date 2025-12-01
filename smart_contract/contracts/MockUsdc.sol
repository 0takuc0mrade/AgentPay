// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MockUSDC
 * @dev A simple ERC20 token to simulate USDC for testing.
 * It includes a `mint` function and overrides `decimals` to return 6.
 * It also includes a mock implementation of EIP-3009 for `transferWithAuthorization`.
 */
contract MockUSDC is ERC20, EIP712 {
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH =
        keccak256("TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)");
    mapping(bytes32 => bool) private _nonces;

    constructor() ERC20("Mock USDC", "mUSDC") EIP712("Mock USDC", "1") {
        // Mint some initial tokens to the deployer just in case
        _mint(msg.sender, 1_000_000 * (10**6));
    }

    /**
     * @dev Public function to create new tokens for any address.
     * Only for testing purposes.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * @dev Overrides the default ERC20 decimals (18) to match USDC (6).
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev See {IERC3009-transferWithAuthorization}.
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(block.timestamp > validAfter, "Authorization not yet valid");
        require(block.timestamp < validBefore, "Authorization expired");
        require(!_nonces[nonce], "Authorization already used");

        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                from,
                to,
                value,
                validAfter,
                validBefore,
                nonce
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);

        require(signer == from, "Invalid signature");
        _nonces[nonce] = true;
        _transfer(from, to, value);
    }
}
