// SPDX-License-Identifier: <SPDX-License>

import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Ribon", function () {
  let ribon: Contract;
  let donationToken: Contract;

  describe("when the contract is deployed", () => {
    beforeEach(async function () {
      const DonationToken = await ethers.getContractFactory("DonationToken");
      donationToken = await DonationToken.deploy();
      await donationToken.deployed();

      const [owner] = await ethers.getSigners();

      const RibonToken = await ethers.getContractFactory("Ribon");
      ribon = await RibonToken.deploy(
        donationToken.address,
        owner.address,
        owner.address
      );
      await ribon.deployed();
    });

    it("returns the contract with the correct params", async function () {
      const [owner] = await ethers.getSigners();

      expect(await ribon.getIntegrationCouncil()).to.equal(owner.address);
    });

    describe("Integration Council", () => {
      describe("when adding nonProfit to whitelist", () => {
        it("#isNonProfitOnWhitelist", async function () {
          const [nonProfit] = await ethers.getSigners();
          await ribon.addNonProfitToWhitelist(nonProfit.address);

          expect(
            await ribon.isNonProfitOnWhitelist(nonProfit.address)
          ).to.equal(true);
        });

        it("Emits NonProfitAdded event", async function () {
          const [nonProfit] = await ethers.getSigners();

          await expect(ribon.addNonProfitToWhitelist(nonProfit.address))
            .to.emit(ribon, "NonProfitAdded")
            .withArgs(nonProfit.address);
        });
      });

      describe("when removing nonProfit from whitelist", () => {
        it("#isNonProfitOnWhitelist", async function () {
          const [nonProfit] = await ethers.getSigners();
          await ribon.removeNonProfitFromWhitelist(nonProfit.address);

          expect(
            await ribon.isNonProfitOnWhitelist(nonProfit.address)
          ).to.equal(false);
        });

        it("Emits NonProfitRemoved event", async function () {
          const [nonProfit] = await ethers.getSigners();

          await expect(ribon.removeNonProfitFromWhitelist(nonProfit.address))
            .to.emit(ribon, "NonProfitRemoved")
            .withArgs(nonProfit.address);
        });
      });

      describe("when adding pool balance", () => {
        it("#addDonationPoolBalance", async function () {
          await donationToken.approve(ribon.address, 10);
          await ribon.addDonationPoolBalance(10);

          const balance = await donationToken.balanceOf(ribon.address);

          expect(balance).to.equal(10);
        });

        /*  it("returns an error when amount is smaller than 0", async function () {
          await donationToken.approve(ribon.address, -10);
          await ribon.addDonationPoolBalance(-10);

          const balance = await donationToken.balanceOf(ribon.address);

          await expectRevert(balance, "Error: value out-of-bounds");
        }); */
      });
    });
  });
});
