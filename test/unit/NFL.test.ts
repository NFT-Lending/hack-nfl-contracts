import { expect } from "chai";
import { MockContract } from "ethereum-waffle";
import { waffle } from "hardhat";
import IERC20ABI from "../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import IERC721ABI from "../../artifacts/@openzeppelin/contracts/token/ERC721/IERC721.sol/IERC721.json";
import ILiquidatorABI from "../../artifacts/contracts/interfaces/ILiquidator.sol/ILiquidator.json";
import IPriceFeedABI from "../../artifacts/contracts/interfaces/IPriceFeed.sol/IPriceFeed.json";
import NFLABI from "../../artifacts/contracts/NFL.sol/NFL.json";
import { Nfl } from "../../typechain";
import { stringArray } from "../utils/utils";

describe("NFL", function () {
  let mockErc20: MockContract;
  let mockErc721: MockContract;
  let mockPriceFeed: MockContract;
  let mockLiquidator: MockContract;

  let contract: Nfl;

  const provider = waffle.provider;
  const [deployerWallet] = provider.getWallets();
  const { deployMockContract, deployContract } = waffle;

  beforeEach(async () => {
    mockErc20 = await deployMockContract(deployerWallet, IERC20ABI.abi);
    mockErc721 = await deployMockContract(deployerWallet, IERC721ABI.abi);
    mockPriceFeed = await deployMockContract(deployerWallet, IPriceFeedABI.abi);
    mockLiquidator = await deployMockContract(deployerWallet, ILiquidatorABI.abi);
    contract = (await deployContract(deployerWallet, NFLABI, [
      mockErc20.address,
      mockErc721.address,
      mockPriceFeed.address,
      mockLiquidator.address,
    ])) as Nfl;
  });

  describe("Deposit", async function () {
    it("deposits nft correctly", async function () {
      await mockErc721.mock.transferFrom.returns();
      await contract.depositNFT(666);

      expect(stringArray(await contract.nftsOf(deployerWallet.address))).to.be.deep.equal(["666"]);
    });

    it("deposits erc20 correctly", async function () {
      await mockErc20.mock.transferFrom.returns(true);
      const amount = "1000";
      await contract.deposit(amount);

      expect(await contract.depositByUser(deployerWallet.address)).to.be.equal(amount);
    });
  });

  describe("Withdrawals", async function () {
    it("withdraws nft correctly", async function () {
      await mockErc721.mock.transferFrom.returns();
      await contract.depositNFT(666);
      await contract.withdrawNFT(666);

      expect(stringArray(await contract.nftsOf(deployerWallet.address))).to.be.deep.equal([]);
    });

    it("withdraws erc20 correctly", async function () {
      await mockErc20.mock.transferFrom.returns(true);
      await mockErc20.mock.transfer.returns(true);
      const amount = "1000";
      await contract.deposit(amount);
      await contract.withdraw(amount);

      expect(await contract.depositByUser(deployerWallet.address)).to.be.equal("0");
    });
  });

  describe("Borrow", async function () {
    it("cannot borrow without collateral", async function () {
      await mockPriceFeed.mock.spotPrice.returns(1);
      await mockErc20.mock.transfer.returns(true);
      await expect(contract.borrow(1)).to.be.revertedWith("Collateral not enough");
    });

    it("can borrow with erc20 collateral", async function () {
      await mockPriceFeed.mock.spotPrice.returns(1);
      await mockErc20.mock.transfer.returns(true);
      await mockErc20.mock.transferFrom.returns(true);
      await contract.deposit(3);
      await contract.borrow(1);
      expect(await contract.debtByUser(deployerWallet.address)).to.be.equal("1");
      expect(await contract.totalCollateral(deployerWallet.address)).to.be.equal("3");
    });

    it("can borrow with nft collateral", async function () {
      await mockPriceFeed.mock.spotPrice.returns(3);
      await mockErc20.mock.transfer.returns(true);
      await mockErc721.mock.transferFrom.returns();
      await contract.depositNFT(666);
      await contract.borrow(1);
      expect(await contract.debtByUser(deployerWallet.address)).to.be.equal("1");
      expect(await contract.totalCollateral(deployerWallet.address)).to.be.equal("3");
    });
  });

  // });

  // describe("Setters", async function () {
  //   it("emits event when setting flash loan rate", async function () {
  //     const previousRate = await contract.flashLoanRate();
  //     const newRate = 10;
  //     await expect(contract.setFlashLoanRate(newRate))
  //       .to.emit(contract, "FlashLoanRateUpdated")
  //       .withArgs(previousRate, newRate);

  //     expect((await contract.flashLoanRate()).toNumber()).to.be.equal(newRate);
  //   });

  //   it("emits event when setting treasury", async function () {
  //     const previousTreasury = await contract.treasury();
  //     const newTreasury = await userWallet.getAddress();
  //     await expect(contract.setTreasury(newTreasury))
  //       .to.emit(contract, "TreasuryUpdated")
  //       .withArgs(previousTreasury, newTreasury);
  //     expect(await contract.treasury()).to.be.equal(newTreasury);
  //   });

  //   it("fails when setting treasury with zero address", async function () {
  //     const previousTreasury = await contract.treasury();
  //     await expect(contract.setTreasury(constants.AddressZero)).to.be.revertedWith("FLASH_MINTER:INVALID_TREASURY");
  //     expect(await contract.treasury()).to.be.equal(previousTreasury);
  //   });
  // });

  // describe("Views", async function () {
  //   it("returns max flash loan amount with dola", async function () {
  //     const maxLoan = await contract.maxFlashLoan(mockDola.address);
  //     expect(maxLoan).to.be.equal(BigNumber.from(2).pow(112).sub(1));
  //   });

  //   it("returns max flash loan amount with non dola", async function () {
  //     const maxLoan = await contract.maxFlashLoan(contract.address);
  //     expect(maxLoan).to.be.equal(constants.Zero);
  //   });

  //   it("calculates flash loan fee", async function () {
  //     const rate = await contract.flashLoanRate();
  //     const loanAmount = ETH("100");
  //     const fee = await contract.flashFee(mockDola.address, loanAmount);
  //     expect(fee).to.be.equal(loanAmount.mul(rate).div(constants.WeiPerEther));
  //   });

  //   it("fails to calculate flash loan fee when not dola", async function () {
  //     const loanAmount = ETH("100");
  //     await expect(contract.flashFee(contract.address, loanAmount)).to.be.revertedWith("FLASH_MINTER:NOT_DOLA");
  //   });
  // });
  // describe("ACL", async function () {
  //   it("forbids non owner to set flash loan rate", async function () {
  //     await expect(contractAsUser.setFlashLoanRate(10)).to.be.revertedWith("Ownable: caller is not the owner");
  //   });

  //   it("forbids non owner to set treasury", async function () {
  //     await expect(contractAsUser.setTreasury(userWallet.address)).to.be.revertedWith(
  //       "Ownable: caller is not the owner",
  //     );
  //   });
  // });
});
