import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const ManagerContract = await ethers.getContractFactory("Manager");
  const manager = await ManagerContract.deploy(
    owner.address,
    owner.address,
    owner.address
  );
  await manager.deployed();

  const PoolFactoryContract = await ethers.getContractFactory("PoolFactory");
  const poolFactory = await PoolFactoryContract.deploy(
    owner.address
  );
  await poolFactory.deployed();

  console.log("PoolFactory deployed to:", poolFactory.address);

  const PoolFactoryContract = await ethers.getContractFactory("PoolFactory");
  const poolFactory = await PoolFactoryContract.deploy(
    owner.address
  );
  await poolFactory.deployed();

  console.log("PoolFactory deployed to:", poolFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});