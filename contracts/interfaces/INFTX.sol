// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @title NFTX
 */

interface INFTX {
    function mint(
        uint256 vaultId,
        uint256[] memory nftIds,
        uint256 d2Amount
    ) external;
}
