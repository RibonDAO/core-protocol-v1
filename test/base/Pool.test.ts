import { expect } from "chai"
import { waffle, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { Pool, TestERC20 } from "../../typechain"
import { Fixture } from 'ethereum-waffle'

describe("Pool", function () {
  let nonProfitCouncil: Wallet;
  let nonProfit: Wallet;
  let integration: Wallet;
  let manager: Wallet;

  const fixture: Fixture<{
    token: TestERC20
    pool: Pool
  }> = async (wallets, provider) => {
    const tokenFactory = await ethers.getContractFactory('TestERC20')
    const token = (await tokenFactory.deploy(100000)) as TestERC20

    const poolFactory = await ethers.getContractFactory('Pool')
    const pool = (await poolFactory.deploy(token.address, wallets[0].address)) as Pool

    return {
      token,
      pool,
    }
  }

  let token: TestERC20;
  let pool: Pool;

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    const wallets = await (ethers as any).getSigners()
    ;[manager, nonProfit, nonProfitCouncil, integration] = wallets
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ token, pool } = await loadFixture(fixture))
  })

  describe("#addNonProfitToWhitelist", () => {
    describe("when you are the pool manager", () => {
      it("adds the non profit to the whitelist", async function () {
        await pool.addNonProfitToWhitelist(nonProfit.address);
        expect(await pool.nonProfits(nonProfit.address)).to.equal(true);
      });

      it("emits NonProfitAdded event", async function () {
        await expect(pool.addNonProfitToWhitelist(nonProfit.address))
          .to.emit(pool, "NonProfitAdded")
          .withArgs(nonProfit.address);
      });
    });

    describe("when you are not the pool manager", () => {
      it("reverts the transaction", async function () {
        await expect(pool.connect(nonProfit).addNonProfitToWhitelist(nonProfit.address))
          .to.be.revertedWith("You are not the manager");
      });
    });
  });

  describe("#removeNonProfitFromWhitelist", () => {
    beforeEach(async () =>{
      await pool.addNonProfitToWhitelist(nonProfit.address);
    });

    describe("when you are the pool manager", () => {
      it("removes the non profit from the whitelist", async function () {
        await pool.removeNonProfitFromWhitelist(nonProfit.address);
        expect(await pool.nonProfits(nonProfit.address)).to.equal(false);
      });
    });

    describe("when you are not the pool manager", () => {
      it("reverts the transaction", async function () {
        await expect(pool.connect(nonProfit).removeNonProfitFromWhitelist(nonProfit.address))
          .to.be.revertedWith("You are not the manager");
      });
    });
  });

  describe("#donateThroughIntegration", () => {
    beforeEach(async () =>{
      await pool.addNonProfitToWhitelist(nonProfit.address);
      await token.approve(manager.address, 10);
      await token.transferFrom(manager.address, pool.address, 10);
    });

    describe("when the non profit is on whitelist", () => {
      describe("when the pool have enough balance", () => {
        it("decreases the pool balance", async function () {
          expect(await token.balanceOf(pool.address)).to.equal(10);
          await pool.connect(manager).donateThroughIntegration(
            nonProfit.address,
            integration.address,
            10
          );

          expect(await token.balanceOf(pool.address)).to.equal(0);
        });

        it("emits DonationAdded event", async function () {

          await expect(
            pool.connect(manager).donateThroughIntegration(nonProfit.address, integration.address, 10)
          )
            .to.emit(pool, "DonationAdded")
            .withArgs(integration.address, nonProfit.address, 10);
        });
      });

      describe("when the pool don't have enough balance", () => {
        it("reverts the transaction", async function () {
          await expect(
            pool.connect(manager).donateThroughIntegration(nonProfit.address,integration.address, 100)
          ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
      });

      describe("when the amount is 0", () => {
        it("reverts the transaction", async function () {
          await expect(
            pool.connect(manager).donateThroughIntegration(nonProfit.address,integration.address, 0)
          ).to.be.revertedWith("Amount must be greater than 0");
        });
      });
    });

    describe("when non profit is not on whitelist", () => {
      it("reverts the transaction", async function () { 
        await expect(
          pool.connect(manager).donateThroughIntegration(
            nonProfitCouncil.address,
            integration.address,
            10
          )
        ).to.be.revertedWith("Not a whitelisted nonprofit");
      });
    });

    describe("when you are not the manager", () => {
      it("reverts the transaction", async function () {
        await expect(
          pool.connect(nonProfit).donateThroughIntegration(nonProfit.address, integration.address, 10)
        ).to.be.revertedWith("You are not the manager");
      });
    });

    describe("when the amount is 0", () => {
      it("reverts the transaction", async function () {
        await expect(
          pool.connect(manager).donateThroughIntegration(nonProfit.address, integration.address, 0)
        ).to.be.revertedWith("Amount must be greater than 0");
      });
    });
  });
});