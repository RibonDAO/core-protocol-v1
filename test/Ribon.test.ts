// SPDX-License-Identifier: <SPDX-License>

import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";

describe("Ribon", function () {
  let ribon: Contract;
  let donationToken: Contract;
  const user = "0xd229e8696a794bb2669821b444690c05f1faa8337ffba5053914b66c99dd39e0";

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

      expect(await ribon.getNonProfitCouncil()).to.equal(owner.address);
      expect(await ribon.getIntegrationCouncil()).to.equal(owner.address);
    });

    describe("Non Profit Council", () => {
      describe("when adding nonProfit to whitelist", () => {
        it("#addNonProfitOnWhitelist", async function () {
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
        it("#removeNonProfitFromWhitelist", async function () {
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

      describe("when add integration balance", () => {

        beforeEach(async () =>{
          await donationToken.approve(ribon.address, 10);
          await ribon.addDonationPoolBalance(10);
        });

        it("increases the integration balance", async function () {
          const [integration] = await ethers.getSigners();
          

          await ribon.addIntegrationBalance(integration.address, 10);

          expect(
            await ribon.getIntegrationBalance(integration.address)
          ).to.equal(10);
        });

        it("emits IntegrationBalanceUpdated event", async function () {
          const [integration] = await ethers.getSigners();

          await expect(ribon.addIntegrationBalance(integration.address, 10))
            .to.emit(ribon, "IntegrationBalanceAdded")
            .withArgs(integration.address, 10);
        });
      });
      
      describe("when remove integration balance", () => {
        beforeEach(async () =>{
          const [integration] = await ethers.getSigners();
          await donationToken.approve(ribon.address, 10);
          await ribon.addDonationPoolBalance(10);
          await ribon.addIntegrationBalance(integration.address, 10);
        });

        it("decreasses the integration balance", async function () {
          const [integration] = await ethers.getSigners();
          await ribon.removeIntegrationBalance(integration.address, 10);

          expect(
            await ribon.getIntegrationBalance(integration.address)
          ).to.equal(0);
        });

        it("emits IntegrationBalanceUpdated event", async function () {
          const [integration] = await ethers.getSigners();

          await expect(ribon.removeIntegrationBalance(integration.address, 10))
            .to.emit(ribon, "IntegrationBalanceRemoved")
            .withArgs(integration.address, 10);
        });
      });

      describe("when donating through integration", () => {
        beforeEach(async () =>{
          const [integration, nonProfit] = await ethers.getSigners();
          await donationToken.approve(ribon.address, 10);
          await ribon.addDonationPoolBalance(10);
          await ribon.addNonProfitToWhitelist(nonProfit.address);
          await ribon.addIntegrationBalance(integration.address, 10);
        });

        it("decreases the integration balance", async function () {
          const [integration, nonProfit] = await ethers.getSigners();

          await ribon.donateThroughIntegration(
            nonProfit.address,
            user,
            10
          );

          expect(await donationToken.balanceOf(nonProfit.address)).to.equal(10);
        });

        it("emits DonationAdded event", async function () {
          const [integration, nonProfit] = await ethers.getSigners();

          await expect(
            ribon.donateThroughIntegration(nonProfit.address, user, 10)
          )
            .to.emit(ribon, "DonationAdded")
            .withArgs(user, integration.address, nonProfit.address, 10);
        });
      });
    });
  });
});
