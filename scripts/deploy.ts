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
    "0x21A72dc641c8e5f13717a7e087d6D63B4f9A3574",
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