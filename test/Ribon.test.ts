// SPDX-License-Identifier: <SPDX-License>

import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";

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

    describe("Non Profit Council", () => {
      describe("when adding nonProfit to whitelist", () => {
        it("#isNonProfitOnWhitelist", async function () {
          const [nonProfit] = await ethers.getSigners();
          await ribon.addNonProfitToWhitelist(nonProfit.address);

          expect(
            await ribon.isNonProfitOnWhitelist(nonProfit.address)
          ).to.equal(true);
        });

        it("emits NonProfitAdded event", async function () {
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

        it("emits NonProfitRemoved event", async function () {
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

        it("emits PoolBalanceIncreased event", async function () {
          const [nonProfit] = await ethers.getSigners();
          await donationToken.approve(ribon.address, 10);

          await expect(ribon.addDonationPoolBalance(10))
            .to.emit(ribon, "PoolBalanceIncreased")
            .withArgs(nonProfit.address, 10);
        });

        it("returns an error when amount is smaller than 0", async function () {
          await expect(
            ribon.addDonationPoolBalance(ethers.BigNumber.from("-10"))
          ).to.be.reverted;
        });
      });

      describe("when updating integration balance", () => {
        it("can increase the integration balance", async function () {
          const [integration] = await ethers.getSigners();

          await ribon.updateIntegrationBalance(integration.address, 13);

          expect(
            await ribon.getIntegrationBalance(integration.address)
          ).to.equal(13);
        });

        it("emits IntegrationBalanceUpdated event", async function () {
          const [integration] = await ethers.getSigners();

          await expect(ribon.updateIntegrationBalance(integration.address, 10))
            .to.emit(ribon, "IntegrationBalanceUpdated")
            .withArgs(integration.address, 10);
        });
      });

      describe("when donating through integration", () => {
        it("increases the integration balance", async function () {
          const [_, nonProfit, user] = await ethers.getSigners();

          await ribon.addNonProfitToWhitelist(nonProfit.address);

          await donationToken.approve(ribon.address, 10);

          await donationToken.transfer(ribon.address, 10);

          await ribon.donateThroughIntegration(
            nonProfit.address,
            user.address,
            10
          );

          expect(await donationToken.balanceOf(nonProfit.address)).to.equal(10);
        });

        it("emits DonationAdded event", async function () {
          const [integration, nonProfit, user] = await ethers.getSigners();

          await ribon.addNonProfitToWhitelist(nonProfit.address);

          await donationToken.approve(ribon.address, 10);

          await donationToken.transfer(ribon.address, 10);

          await expect(
            ribon.donateThroughIntegration(nonProfit.address, user.address, 10)
          )
            .to.emit(ribon, "DonationAdded")
            .withArgs(user.address, integration.address, nonProfit.address, 10);
        });
      });
    });
  });
});
