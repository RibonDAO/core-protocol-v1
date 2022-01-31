// SPDX-License-Identifier: <SPDX-License>

import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Ribon", function () {
  let ribon: Contract;

  describe("when the contract is deployed", () => {
    beforeEach(async function () {
      const DonationToken = await ethers.getContractFactory("DonationToken");
      const dt = await DonationToken.deploy();
      await dt.deployed();

      const [owner] = await ethers.getSigners();

      const RibonToken = await ethers.getContractFactory("Ribon");
      ribon = await RibonToken.deploy(dt.address, owner.address, owner.address);
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
      });

      describe("when removing nonProfit from whitelist", () => {
        it("#isNonProfitOnWhitelist", async function () {
          const [nonProfit] = await ethers.getSigners();
          await ribon.removeNonProfitFromWhitelist(nonProfit.address);

          expect(
            await ribon.isNonProfitOnWhitelist(nonProfit.address)
          ).to.equal(false);
        });
      });
    });
  });
});
