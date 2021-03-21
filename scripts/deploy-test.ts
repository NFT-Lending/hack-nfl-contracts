// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import { constants } from "ethers";
import hre from "hardhat";
import { deploySingletonContract } from "../utils/deployment";

async function main(): Promise<void> {
  console.log("Deployment Started.");
  const force = true;
  const priceFeed = await deploySingletonContract(hre, force, "UniswapPriceFeed", [
    "0xfd38565ef22299d491055f0c508f62dd9a669f0f",
  ]);
  await deploySingletonContract(hre, force, "NFL", [
    "0x6b175474e89094c44da98b954eedeac495271d0f",
    "0xc2c747e0f7004f9e8817db2ca4997657a7746928",
    priceFeed.address,
    constants.AddressZero,
  ]);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
