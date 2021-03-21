// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./interfaces/IPriceFeed.sol";
import "./interfaces/ILiquidator.sol";
import "hardhat/console.sol";

contract NFL {
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;
    using Address for address;

    IERC20 public token;
    IERC721 public nft;
    IPriceFeed public priceFeed;
    ILiquidator public liquidator;

    mapping(address => EnumerableSet.UintSet) private _nftsByUser;
    mapping(address => uint256) public debtByUser;
    mapping(address => uint256) public depositByUser;

    constructor(
        IERC20 _token,
        IERC721 _nft,
        IPriceFeed _priceFeed,
        ILiquidator _liquidator
    ) {
        token = _token;
        nft = _nft;
        priceFeed = _priceFeed;
        liquidator = _liquidator;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Deposit must be greater than 0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        _deposit(amount);
    }

    function _deposit(uint256 amount) internal {
        uint256 depositAmount = _repay(amount);
        if (depositAmount > 0) {
            depositByUser[msg.sender] = depositByUser[msg.sender] + depositAmount;
        }
    }

    function _repay(uint256 amount) internal returns (uint256 leftover) {
        uint256 outstandingDebt = debtByUser[msg.sender];
        leftover = 0;
        if (outstandingDebt > amount) {
            debtByUser[msg.sender] = outstandingDebt - amount;
        } else {
            debtByUser[msg.sender] = 0;
            leftover = amount - outstandingDebt;
        }
    }

    function depositNFT(uint256 tokenId) external {
        nft.transferFrom(msg.sender, address(this), tokenId);
        _nftsByUser[msg.sender].add(tokenId);
    }

    function withdrawNFT(uint256 tokenId) external {
        if (_nftsByUser[msg.sender].remove(tokenId)) {
            nft.transferFrom(address(this), msg.sender, tokenId);
        }
        require(collateralizationRatio(msg.sender) > 2, "Collateral not enough");
    }

    function borrow(uint256 amount) external {
        debtByUser[msg.sender] = debtByUser[msg.sender] + amount;
        token.safeTransfer(msg.sender, amount);
        require(collateralizationRatio(msg.sender) > 2, "Collateral not enough");
    }

    function liquidate() external {
        require(collateralizationRatio(msg.sender) < 2, "Cannot liquidate healthy position");
        EnumerableSet.UintSet storage nfts = _nftsByUser[msg.sender];
        uint256 numberOfNfts = nfts.length();
        require(numberOfNfts > 0, "Cannot liquidate empty position");
        for (uint256 i = numberOfNfts - 1; i >= 0 && collateralizationRatio(msg.sender) < 2; i--) {
            uint256 tokenId = nfts.at(i);
            uint256 amountLiquidated = liquidator.liquidate(tokenId);
            _deposit(amountLiquidated);
        }
    }

    function totalCollateral(address user) public view returns (uint256 balance) {
        uint256 numberOfNfts = _nftsByUser[user].length();
        if (numberOfNfts > 0) {
            balance = priceFeed.spotPrice(numberOfNfts);
        }
        balance = balance + depositByUser[user];
    }

    function collateralizationRatio(address user) public view returns (uint256) {
        uint256 debt = debtByUser[msg.sender];
        if (debt == 0) return type(uint256).max;
        uint256 collateral = totalCollateral(user);
        return collateral / debt;
    }

    function nftsOf(address user) public view returns (uint256[] memory) {
        EnumerableSet.UintSet storage nfts = _nftsByUser[user];
        uint256 numberOfNfts = nfts.length();
        uint256[] memory nftView = new uint256[](numberOfNfts);
        for (uint256 i = 0; i < numberOfNfts; i++) {
            nftView[i] = nfts.at(i);
        }
        return nftView;
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw must be greater than 0");
        depositByUser[msg.sender] = depositByUser[msg.sender] - amount;
        require(collateralizationRatio(msg.sender) > 2, "Collateral not enough");
        token.safeTransfer(msg.sender, amount);
    }

    function setLiquidator(address _liquidator) external {
        liquidator = ILiquidator(_liquidator);
    }
}
