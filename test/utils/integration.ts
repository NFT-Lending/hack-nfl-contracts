import { config as dotenvConfig } from "dotenv";
import { BigNumber, Contract, ContractFactory, Signer, utils } from "ethers";
import hre, { ethers } from "hardhat";
import { resolve } from "path";
import ERC20ABI from "../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { Ierc20 } from "../../typechain";
dotenvConfig({ path: resolve(__dirname, "./.env") });

const SAFE_CHECKPOINT = 12081700;
export const NFTX_MASK_PAIR = "0xfd38565ef22299d491055f0c508f62dd9a669f0f";

export async function sudo_TransferToken(
  token: string,
  owner: string,
  amount: BigNumber,
  recipient: string,
): Promise<void> {
  return sudo(owner, (signer: Signer) => {
    const tokenContract = new Contract(token, ERC20ABI.abi, signer) as Ierc20;
    return tokenContract.transfer(recipient, amount);
  });
}

async function sudo(sudoUser: string, block: (signer: Signer) => Promise<unknown>) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [sudoUser],
  });
  const signer = await ethers.provider.getSigner(sudoUser);
  await block(signer);
}

export async function sentEth(to: string, amount: string, wallet: Signer): Promise<void> {
  const tx = {
    to,
    value: utils.parseEther(amount),
  };

  await wallet.sendTransaction(tx);
}

export async function resetFork(): Promise<void> {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_TOKEN}`,
          blockNumber: SAFE_CHECKPOINT,
        },
      },
    ],
  });
}

export async function deployContract<T extends Contract>(contractName: string, args: Array<unknown> = []): Promise<T> {
  const contractFactory: ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contract: Contract = await contractFactory.deploy(...args);
  await contract.deployed();
  return contract as T;
}
