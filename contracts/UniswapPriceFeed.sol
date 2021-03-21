// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IUniswapPair.sol";
import "./interfaces/IPriceFeed.sol";

contract UniswapPriceFeed is IPriceFeed {
    using SafeERC20 for IERC20;
    using Address for address;

    IUniswapPair public pair;

    constructor(IUniswapPair _pair) {
        pair = _pair;
    }

    function spotPrice(uint256 numberOfNfts) external view override returns (uint256 price) {
        (uint112 r0, uint112 r1, ) = pair.getReserves();
        return ((r1 * numberOfNfts) * 1e18) / r0;
    }
}
