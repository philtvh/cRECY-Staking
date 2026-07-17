import hre from "hardhat";

async function main() {
  // Replace with actual deployed Celo addresses
  const CRECY_TOKEN = "0x34C11A932853Ae24E845Ad4B633E3cEf91afE583"; 
  const CELO_POSITION_MANAGER = "0x3d79EdAaBC0EaB6F08ED885C05Fc0B014290D95A"; // Uniswap V3 Celo
  const CELO_SWAP_ROUTER = "0x5615CDAb10dc425a742d643d949a7F474C01abc4"; // Uniswap V3 Celo

  const CRECYStaking = await hre.ethers.getContractFactory("CRECYStaking");
  const staking = await CRECYStaking.deploy(CRECY_TOKEN, CELO_POSITION_MANAGER, CELO_SWAP_ROUTER);

  await staking.waitForDeployment();
  console.log(`Staking Contract deployed to: ${await staking.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});