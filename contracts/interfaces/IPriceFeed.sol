// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @title Price Feed
 */

interface IPriceFeed {
    function spotPrice(uint256 numberOfNfts) external view returns (uint256);
}
