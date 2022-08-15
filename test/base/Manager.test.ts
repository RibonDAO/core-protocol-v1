import { expect } from "chai"
import { waffle, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { Manager, Pool, TestERC20 } from "../../typechain"
import { Fixture } from 'ethereum-waffle'

describe("Manager", function () {
  const user = "0xd229e8696a794bb2669821b444690c05f1faa8337ffba5053914b66c99dd39e0";

  let governanceCouncil: Wallet;
  let integrationCouncil: Wallet;
  let nonProfitCouncil: Wallet;
  let nonProfit: Wallet;
  let integration: Wallet;

  const fixture: Fixture<{
    manager: Manager,
    pool: Pool,
    token: TestERC20,
  }> = async (wallets, provider) => {
    const managerFactory = await ethers.getContractFactory('Manager')
    const manager = (await managerFactory.deploy(wallets[0].address, wallets[1].address, wallets[2].address)) as Manager

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

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    const wallets = await (ethers as any).getSigners()
    ;[governanceCouncil, integrationCouncil, nonProfitCouncil, integration, nonProfit] = wallets
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ manager, pool, token } = await loadFixture(fixture))
  })

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

  describe('#addIntegrationBalance', () => {
    describe('when the caller is the integration council', () => {
      it('should add the integration balance', async () => {
        await manager.connect(integrationCouncil).addIntegrationBalance(integration.address, 100);
        const integrationBalance = await manager.integrations(integration.address);
        expect(integrationBalance).to.eq(100);
      });

      it('should emit IntegrationBalanceAdded event', async () => {
        await expect(manager.connect(integrationCouncil).addIntegrationBalance(integration.address, 100))
          .to.emit(manager, "IntegrationBalanceAdded")
          .withArgs(integration.address, 100);
      });
    });

    describe('when the caller is not the integration council', () => {
      it('should revert', async () => {
        await expect(manager.connect(integration).addIntegrationBalance(integration.address, 100))
          .to.be.revertedWith("You are not the integration council");
      });
    });

    describe('when the amount is 0', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationCouncil).addIntegrationBalance(integration.address, 0))
          .to.be.revertedWith("Amount must be greater than 0");
      });
    });
  })

  describe('#removeIntegrationBalance', () => {
    describe('when the caller is the integration council', () => {
      beforeEach(async () => {
        await manager.connect(integrationCouncil).addIntegrationBalance(integration.address, 100);
      });

      it('should remove the integration balance', async () => {
        await manager.connect(integrationCouncil).removeIntegrationBalance(integration.address, 100);
        const integrationBalance = await manager.integrations(integration.address);
        expect(integrationBalance).to.eq(0);
      });

      it('should emit IntegrationBalanceRemoved event', async () => {
        await expect(manager.connect(integrationCouncil).removeIntegrationBalance(integration.address, 100))
          .to.emit(manager, "IntegrationBalanceRemoved")
          .withArgs(integration.address, 100);
      });
    });

    describe('when the caller is not the integration council', () => {
      it('should revert', async () => {
        await expect(manager.connect(integration).removeIntegrationBalance(integration.address, 100))
          .to.be.revertedWith("You are not the integration council");
      });
    });

    describe('when the amount is 0', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationCouncil).removeIntegrationBalance(integration.address, 0))
          .to.be.revertedWith("Amount must be greater than 0");
      });
    });
  });

  describe('#donateThroughIntegration', () => {
    describe('when the balance is greather than amount', () => {
      beforeEach(async () => {
        await manager.connect(integrationCouncil).addIntegrationBalance(integration.address, 100);
        await manager.connect(nonProfitCouncil).addNonProfitToWhitelist(pool.address, nonProfit.address);
        await token.approve(pool.address, 100);
        await pool.addBalance(100);
      });

      it('should remove the integration balance', async () => {
        await manager.connect(integration).donateThroughIntegration(pool.address, nonProfit.address, user, 100);
        const integrationBalance = await manager.integrations(integration.address);
        expect(integrationBalance).to.eq(0);
      });

      it('should add the amount to the non profit balance', async () => {
        await manager.connect(integration).donateThroughIntegration(pool.address, nonProfit.address, user, 100);
        const nonProfitBalance = await token.balanceOf(nonProfit.address);
        expect(nonProfitBalance).to.eq(100);
      });

      it('should emit DonationAdded event', async () => {
        expect(await manager.connect(integration).donateThroughIntegration(pool.address, nonProfit.address, user, 100))
          .to.emit(manager, "DonationAdded")
          .withArgs(pool.address, user, integration.address, nonProfit.address, 100);
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
        await manager.connect(governanceCouncil).setIntegrationCouncil(integrationCouncil.address);
        expect(await manager.integrationCouncil()).to.eq(integrationCouncil.address);
      });
    });

    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(integrationCouncil).setIntegrationCouncil(integrationCouncil.address))
          .to.be.revertedWith("You are not the governance council");
      });
    });
  });

  describe('#setGovernanceCouncil', () => {
    describe('when the caller is the governance council', () => {
      it('should set the governance council', async () => {
        await manager.connect(governanceCouncil).setGovernanceCouncil(governanceCouncil.address);
        expect(await manager.governanceCouncil()).to.eq(governanceCouncil.address);
      });
    }),
    describe('when the caller is not the governance council', () => {
      it('should revert', async () => {
        await expect(manager.connect(nonProfitCouncil).setGovernanceCouncil(governanceCouncil.address))
          .to.be.revertedWith("You are not the governance council");
      });
    });
  });
});