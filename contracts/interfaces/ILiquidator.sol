// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @title Price Feed
 */

interface ILiquidator {
    function liquidate(uint256 tokenId) external returns (uint256);
}
