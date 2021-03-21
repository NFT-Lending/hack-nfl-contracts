// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ILiquidator.sol";
import "./interfaces/INFTX.sol";

contract NFTXLiquidator is ILiquidator {
    using SafeERC20 for IERC20;
    using Address for address;

    INFTX public nftx;
    uint256 public vaultId;

    constructor(INFTX _nftx, uint256 _vaultId) {
        nftx = _nftx;
        vaultId = _vaultId;
    }

    function liquidate(uint256 tokenId) external override returns (uint256 amount) {
        uint256[] memory tokens;
        tokens[0] = tokenId;
        nftx.mint(vaultId, tokens, 0);
        //2 swap
        //3 send back
        amount = 0;
    }
}
