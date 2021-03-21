import { expect } from "chai";
import { UniswapPriceFeed } from "../../typechain";
import { deployContract, NFTX_MASK_PAIR, resetFork } from "../utils/integration";

describe("UniswapPriceFeed", function () {
  let contract: UniswapPriceFeed;
  beforeEach(async () => {
    await resetFork();
    contract = (await deployContract("UniswapPriceFeed", [NFTX_MASK_PAIR])) as UniswapPriceFeed;
  });

  describe("Pricing", function () {
    it("returns spot price correctly", async function () {
      const pricePerMask = (await contract.spotPrice(1)).toString();
      expect(pricePerMask).to.be.equal("1210551213933272422");
    });
  });
});
