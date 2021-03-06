import { ethers } from "hardhat";

async function main() {
  const DonationTokenContract = await ethers.getContractFactory(
    "TestERC20"
  );
  const donationToken = await DonationTokenContract.deploy("1000000000000000000000000");
  await donationToken.deployed();

  console.log("Donation Token deployed to:", donationToken.address);

  const [owner] = await ethers.getSigners();

  const RibonContract = await ethers.getContractFactory("Ribon");
  const ribon = await RibonContract.deploy(
    donationToken.address,
    owner.address,
    owner.address,
    owner.address
  );
  await ribon.deployed();

  console.log("Ribon deployed to:", ribon.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});