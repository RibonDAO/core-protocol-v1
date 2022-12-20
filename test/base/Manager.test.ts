import { expect } from "chai"
import { waffle, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { Manager, Pool, TestERC20 } from "../../typechain"
import { Fixture } from 'ethereum-waffle'
import { Address } from "cluster"

describe("Manager", function () {
  const donation_batch = "bafkreibmaeybgubr65dsgrzbyzml34ambyzhystdmfznltlkbqpi4cjdge";

  let governanceCouncil: Wallet;
  let integrationCouncil: Wallet;
  let nonProfitCouncil: Wallet;
  let nonProfit: Wallet;
  let integrationController: Wallet;

  const fixture: Fixture<{
    manager: Manager,
    pool: Pool,
    token: TestERC20,
  }> = async (wallets, provider) => {
    const managerFactory = await ethers.getContractFactory('Manager')
    const manager = (await managerFactory.deploy(wallets[0].address, wallets[1].address, wallets[2].address, 10, 10)) as Manager

    const tokenFactory = await ethers.getContractFactory('TestERC20')
    const token = (await tokenFactory.deploy(100000)) as TestERC20

    const poolFactory = await ethers.getContractFactory('Pool')
    const pool = (await poolFactory.deploy(token.address, manager.address)) as Pool

    return {
      manager,
      pool,
      token,
    }
  }

  let manager: Manager;
  let pool: Pool;
  let token: TestERC20;

  let poolAddress;

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    const wallets = await (ethers as any).getSigners()
    ;[governanceCouncil, integrationCouncil, nonProfitCouncil, integrationController, nonProfit] = wallets
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ manager, pool, token } = await loadFixture(fixture))
  })

  describe("#createPool", () => {
    describe("#createPool", () => {
      describe("when you are the manager", () => {

        beforeEach(async () =>{
          poolAddress = await manager.connect(nonProfitCouncil).createPool(token.address);
        });
  
        it("should increase pools length by 1", async function () {
          const pools = await manager.fetchPools(0, 1);
          expect(pools[0].length).to.equal(1);
        });
  
        it("emits PoolCreated event", async function () {
          await expect(manager.connect(nonProfitCouncil).createPool(token.address))
            .to.emit(manager, "PoolCreated");
        });

        it("should returns the pool created", async function () {
          const pools = await manager.fetchPools(0, 1);
          expect(pools[0].length).to.equal(1);
        });
      });

      describe("when you are multiple pools", () => {
        beforeEach(async () =>{
          await manager.connect(nonProfitCouncil).createPool(token.address);
          await manager.connect(nonProfitCouncil).createPool(token.address);
          await manager.connect(nonProfitCouncil).createPool(token.address);
        });

        it("should increase pools length by 3", async function () {
          const pools = await manager.fetchPools(0, 6);
          expect(pools[0].length).to.equal(3);
        });
      });
  
      describe("when you are not the manager", () => {
        it("reverts the transaction", async function () {
          await expect(manager.connect(nonProfit).createPool(token.address))
            .to.be.revertedWith("You are not the non profit council");
        });
      });
    });
  });

  describe("#addPoolBalance", () => {
    describe("when you feeable is false", () => {
      describe("when you have suficient balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 10);
          await manager.addPoolBalance(pool.address, 10, integrationController.address, false);
        });

        it("should increase contract donation token's balance", async function () {
          const balance = await token.balanceOf(pool.address);
          expect(balance).to.equal(10);
        });

        it("should increase donation pool balance", async function () {
          const balance = await token.balanceOf(pool.address);
          expect(balance).to.equal(10);
        });

        it("emits PoolBalanceIncreased event", async function () {
          await manager.connect(nonProfitCouncil).createPool(token.address);
          const pools = await manager.fetchPools(0,1);
          await token.approve(manager.address, 10);

          await expect(manager.addPoolBalance(pool.address, 10, integrationController.address, false))
            .to.emit(manager, "PoolBalanceIncreased")
            .withArgs(governanceCouncil.address, pool.address, 10);
        });
      });
    });

    describe("when you feeable is true", () => {
      describe("when you have chargableFee is lower than pool balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 20);
          await manager.addPoolBalance(pool.address, 10, integrationController.address, false);
          await manager.addPoolBalance(pool.address, 10, integrationController.address, true);
        });
        
        it("should increase donation pool balance", async function () {
          const balance = await token.balanceOf(pool.address);
          expect(balance).to.equal(19);
        });

        it("should increase referrer balance", async function () {
          const balance = await token.balanceOf(integrationController.address);
          expect(balance).to.equal(1);
        });
      });

      describe("when chargableFee is bigger tha pool balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 2000);
          await manager.addPoolBalance(pool.address, 10, integrationController.address, false);
          await manager.addPoolBalance(pool.address, 1000, integrationController.address, true);
        });
        
        describe("when the pool have suficient balance", () => {
          it("should increase donation pool balance", async function () {
            const balance = await token.balanceOf(pool.address);
            expect(balance).to.equal(1000);
          });
  
          it("should increase referrer balance", async function () {
            const balance = await token.balanceOf(integrationController.address);
            expect(balance).to.equal(10);
          });
        });
      });

      describe("when the pool balance is 0", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 1000);
          await manager.addPoolBalance(pool.address, 1000, integrationController.address, true);
        });
        
        describe("when the pool have suficient balance", () => {
          it("should increase donation pool balance", async function () {
            const balance = await token.balanceOf(pool.address);
            expect(balance).to.equal(1000);
          });
  
          it("should increase referrer balance", async function () {
            const balance = await token.balanceOf(integrationController.address);
            expect(balance).to.equal(0);
          });
        });
      });
    });      

    describe("when you feeable is false", () => {
      beforeEach(async () =>{
        await token.approve(manager.address, 10);
        await manager.addPoolBalance(pool.address, 10, integrationController.address, false);
      });

      it("should increase donation pool balance", async function () {
        const balance = await token.balanceOf(pool.address);
        expect(balance).to.equal(10);
      });
    });

    describe("when amount is 0", () => {
      it("reverts the transaction", async function () {
        await expect(
          manager.addPoolBalance(manager.address, 0, integrationController.address, false)
        ).to.be.revertedWith("Amount must be greater than 0");
      });
    });
  });

  describe("#addNonProfitToWhitelist", () => {
    describe("when you are the non profit council", () => {
      it("adds the non profit to the whitelist", async function () {
        await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
        expect(await pool.nonProfits(nonProfit.address)).to.equal(true);
      });

      it("emits NonProfitAdded event", async function () {
        await expect(await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address))
          .to.emit(pool, "NonProfitAdded")
          .withArgs(nonProfit.address);
      });
    });

    describe("when you are not the non profit council", () => {
      it("reverts the transaction", async function () {
        expect(manager.connect(nonProfit).addNonProfitToWhitelist(pool.address, nonProfit.address))
          .to.be.revertedWith("You are not the non profit council");
      });
    });
  });

  describe("#removeNonProfitFromWhitelist", () => {
    beforeEach(async () =>{
      await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
    });

    describe("when you are the pool manager", () => {
      it("removes the non profit from the whitelist", async function () {
        await manager.connect(nonProfitCouncil).removeNonProfitFromWhitelist(pool.address, nonProfit.address);
        expect(await pool.nonProfits(nonProfit.address)).to.equal(false);
      });
    });

    describe("when you are not the non profit council", () => {
      it("reverts the transaction", async function () {
        expect(manager.connect(nonProfit).removeNonProfitFromWhitelist(pool.address, nonProfit.address))
          .to.be.revertedWith("You are not the non profit council");
      });
    });
  });

  describe('#addIntegrationControllerBalance', () => {
    describe('when the caller is the integration council', () => {
      it('should add the integration balance', async () => {
        await manager.connect(integrationCouncil).addIntegrationControllerBalance(integrationController.address, 100);
        const integrationControllerBalance = await manager.integrationControllers(integrationController.address);
        expect(integrationControllerBalance).to.eq(100);
      });

      it('should emit IntegrationControllerBalanceAdded event', async () => {
        await expect(manager.connect(integrationCouncil).addIntegrationControllerBalance(integrationController.address, 100))
          .to.emit(manager, "IntegrationControllerBalanceAdded")
          .withArgs(integrationController.address, 100);
      });
    });

    describe('when the caller is not the integration council', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationController).addIntegrationControllerBalance(integrationController.address, 100))
          .to.be.revertedWith("You are not the integration council");
      });
    });

    describe('when the amount is 0', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationCouncil).addIntegrationControllerBalance(integrationController.address, 0))
          .to.be.revertedWith("Amount must be greater than 0");
      });
    });
  })

  describe('#removeIntegrationControllerBalance', () => {
    describe('when the caller is the integration council', () => {
      beforeEach(async () => {
        await manager.connect(integrationCouncil).addIntegrationControllerBalance(integrationController.address, 100);
      });

      it('should remove the integration balance', async () => {
        await manager.connect(integrationCouncil).removeIntegrationControllerBalance(integrationController.address, 100);
        const integrationControllerBalance = await manager.integrationControllers(integrationController.address);
        expect(integrationControllerBalance).to.eq(0);
      });

      it('should emit IntegrationControllerBalanceRemoved event', async () => {
        await expect(manager.connect(integrationCouncil).removeIntegrationControllerBalance(integrationController.address, 100))
          .to.emit(manager, "IntegrationControllerBalanceRemoved")
          .withArgs(integrationController.address, 100);
      });
    });

    describe('when the caller is not the integration council', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationController).removeIntegrationControllerBalance(integrationController.address, 100))
          .to.be.revertedWith("You are not the integration council");
      });
    });

    describe('when the amount is 0', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationCouncil).removeIntegrationControllerBalance(integrationController.address, 0))
          .to.be.revertedWith("Amount must be greater than 0");
      });
    });
  });

  describe('#donateThroughIntegration', () => {
    describe('when the balance is greather than amount', () => {
      beforeEach(async () => {
        await manager.connect(integrationCouncil).addIntegrationControllerBalance(integrationController.address, 100);
        await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
        await token.approve(manager.address, 100);
        await manager.addPoolBalance(pool.address, 100, integrationController.address, false);
      });

      it('should remove the integration balance', async () => {
        await manager.connect(integrationController).donateThroughIntegration(pool.address, nonProfit.address, integrationController.address, donation_batch, 100);
        const integrationBalance = await manager.integrationControllers(integrationController.address);
        expect(integrationBalance).to.eq(0);
      });

      it('should add the amount to the non profit balance', async () => {
        await manager.connect(integrationController).donateThroughIntegration(pool.address, nonProfit.address, integrationController.address, donation_batch, 100);
        const nonProfitBalance = await token.balanceOf(nonProfit.address);
        expect(nonProfitBalance).to.eq(100);
      });

      it('should emit DonationAdded event', async () => {
        expect(await manager.connect(integrationController).donateThroughIntegration(pool.address, nonProfit.address, integrationController.address, donation_batch, 100))
          .to.emit(manager, "DonationAdded")
          .withArgs(pool.address, nonProfit.address, integrationController.address, donation_batch, 100);
      });
    });
  });

  describe("#contributeToNonProfit", () => {
    describe("when pool balance is greater than fee", () => {
      describe("when you have suficient balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 20);
          await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
          await manager.addPoolBalance(pool.address, 10, integrationController.address, false);
          await manager.contributeToNonProfit(pool.address, nonProfit.address, 10, integrationController.address);
        });

        it("should increase nonProfit token's balance", async function () {
          const balance = await token.balanceOf(nonProfit.address);
          expect(balance).to.equal(10);
        });

        it("should decrease donation pool balance", async function () {
          const balance = await token.balanceOf(pool.address);
          expect(balance).to.equal(9);
        });

        it("should increase integration balance", async function () {
          const balance = await token.balanceOf(integrationController.address);
          expect(balance).to.equal(1);
        });
      });
    });

    describe("when pool balance is lower than fee", () => {
      describe("when you have suficient balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 2000);
          await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
          await manager.addPoolBalance(pool.address, 10, integrationController.address, false);
          await manager.contributeToNonProfit(pool.address, nonProfit.address, 1000, integrationController.address);
        });

        it("should increase nonProfit token's balance", async function () {
          const balance = await token.balanceOf(nonProfit.address);
          expect(balance).to.equal(1000);
        });

        it("should decrease donation pool balance", async function () {
          const balance = await token.balanceOf(pool.address);
          expect(balance).to.equal(0);
        });

        it("should increase integration balance", async function () {
          const balance = await token.balanceOf(integrationController.address);
          expect(balance).to.equal(10);
        });
      });
    });

    describe("when the balance is 0", () => {
      describe("when you have suficient balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 10);
          await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
          await manager.contributeToNonProfit(pool.address, nonProfit.address, 10, integrationController.address);
        });

        it("should increase nonProfit token's balance", async function () {
          const balance = await token.balanceOf(nonProfit.address);
          expect(balance).to.equal(10);
        });

        it("should decrease donation pool balance", async function () {
          const balance = await token.balanceOf(pool.address);
          expect(balance).to.equal(0);
        });

        it("should increase integration balance", async function () {
          const balance = await token.balanceOf(integrationController.address);
          expect(balance).to.equal(0);
        });
      });
    });

    describe("when the nonprofit is not on the whitelist", () => {
      describe("when you have suficient balance", () => {
        beforeEach(async () =>{
          await token.approve(manager.address, 10);
        });

        it("reverts the transaction", async function () {
          await expect(
            manager.contributeToNonProfit(pool.address, nonProfit.address, 10, integrationController.address)
          ).to.be.revertedWith("Non profit is not whitelisted");
        });
      });
    });

    describe("when amount is 0", () => {
      it("reverts the transaction", async function () {
        await expect(
          manager.addPoolBalance(manager.address, 0, integrationController.address, false)
        ).to.be.revertedWith("Amount must be greater than 0");
      });
    });
  });

  describe('#setNonProfitCouncil', () => {
    describe('when the caller is the governance council', () => {
      it('should set the non profit council', async () => {
        await manager.connect(governanceCouncil).setNonProfitCouncil(governanceCouncil.address);
        expect(await manager.nonProfitCouncil()).to.eq(governanceCouncil.address);
      });
    });

    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(nonProfit).setNonProfitCouncil(governanceCouncil.address))
          .to.be.revertedWith("You are not the governance council");
      });
    });
  });

  describe('#setIntegrationCouncil', () => {
    describe('when the caller is the governance council', () => {
      it('should set the integration council', async () => {
        await manager.connect(governanceCouncil).setIntegrationCouncil(governanceCouncil.address);
        expect(await manager.integrationCouncil()).to.eq(governanceCouncil.address);
      });
    });

    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationCouncil).setIntegrationCouncil(governanceCouncil.address))
          .to.be.revertedWith("You are not the governance council");
      });
    });
  });

  describe('#setGovernanceCouncil', () => {
    describe('when the caller is the governance council', () => {
      it('should set the governance council', async () => {
        await manager.connect(governanceCouncil).setGovernanceCouncil(integrationController.address);
        expect(await manager.governanceCouncil()).to.eq(integrationController.address);
      });
    }),
    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(nonProfitCouncil).setGovernanceCouncil(integrationController.address))
          .to.be.revertedWith("You are not the governance council");
      });
    });
  });

  describe('#transferPoolBalance', () => {
    describe('when the caller is the governance council', () => {
      it('should change balances', async () => {
        await token.approve(manager.address, 100);
        await manager.addPoolBalance(pool.address, 100, integrationController.address, false);
        await manager.connect(governanceCouncil).transferPoolBalance(pool.address, nonProfitCouncil.address);
        expect(await token.balanceOf(pool.address)).to.eq(0);
        expect(await token.balanceOf(nonProfitCouncil.address)).to.eq(100);
      });
    }),
    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(nonProfitCouncil).setGovernanceCouncil(governanceCouncil.address))
          .to.be.revertedWith("You are not the governance council");
      });
    });
  });

  describe('#setPoolIncreaseFee', () => {
    describe('when the caller is the governance council', () => {
      it('should set the pool fee', async () => {
        await manager.connect(governanceCouncil).setPoolIncreaseFee(15);
        expect(await manager.poolIncreaseFee()).to.eq(15);
      });
    }),
    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(nonProfitCouncil).setPoolIncreaseFee(10))
          .to.be.revertedWith("You are not the governance council");
      });
    });
    describe('when fee bigger than 50', () => {
      it('should revert', async () => {
        await expect(manager.connect(governanceCouncil).setPoolIncreaseFee(50))
          .to.be.revertedWith("The fee is too high");
      });
    });
  });

  describe('#setDirectlyContributionFee', () => {
    describe('when the caller is the governance council', () => {
      it('should set the directly contribution fee', async () => {
        await manager.connect(governanceCouncil).setDirectlyContributionFee(15);
        expect(await manager.directlyContributionFee()).to.eq(15);
      });
    }),
    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(nonProfitCouncil).setDirectlyContributionFee(10))
          .to.be.revertedWith("You are not the governance council");
      });
    });
    describe('when fee bigger than 50', () => {
      it('should revert', async () => {
        await expect(manager.connect(governanceCouncil).setDirectlyContributionFee(50))
          .to.be.revertedWith("The fee is too high");
      });
    });
  });
});