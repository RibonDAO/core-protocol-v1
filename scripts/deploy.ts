import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const ManagerContract = await ethers.getContractFactory("Manager");
  const manager = await ManagerContract.deploy(
    owner.address,
    owner.address,
    owner.address,
    10,
    10
  );
  await manager.deployed();

  console.log("Manager deployed to:", manager.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});