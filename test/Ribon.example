import { expect } from "chai"
import { waffle, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { Ribon, TestERC20 } from "../typechain"
import { Fixture } from 'ethereum-waffle'

describe("Ribon", function () {
  const user = "0xd229e8696a794bb2669821b444690c05f1faa8337ffba5053914b66c99dd39e0";
  const crypto_user = "0x0000000000000000000000000000000000000000000000000000000000000000";
  let governanceCouncil: Wallet;
  let nonProfitCouncil: Wallet;
  let integrationCouncil: Wallet;
  let nonProfit: Wallet;
  let integration: Wallet;
  let promoter: Wallet;

  const fixture: Fixture<{
    donationToken: TestERC20
    ribon: Ribon
  }> = async (wallets, provider) => {
    const donationTokenFactory = await ethers.getContractFactory('TestERC20')
    const donationToken = (await donationTokenFactory.deploy(100000)) as TestERC20

    const ribonFactory = await ethers.getContractFactory('Ribon')
    const ribon = (await ribonFactory.deploy(donationToken.address, wallets[1].address, wallets[2].address, wallets[3].address)) as Ribon

    return {
      donationToken,
      ribon,
    }
  }

  let donationToken: TestERC20;
  let ribon: Ribon;

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    const wallets = await (ethers as any).getSigners()
    ;[promoter, governanceCouncil, integrationCouncil, nonProfitCouncil, nonProfit, integration] = wallets
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ donationToken, ribon } = await loadFixture(fixture))
  })

  describe("when the contract is deployed", () => {
    it("returns the contract with the correct params", async function () {
      expect(await ribon.donationToken()).to.equal(donationToken.address);
      expect(await ribon.nonProfitCouncil()).to.equal(nonProfitCouncil.address);
      expect(await ribon.integrationCouncil()).to.equal(integrationCouncil.address);
    });
  });

  describe("Non Profit Council", () => {
    describe("#addNonProfitOnWhitelist", () => {
      describe("when you are nonProfit council", () => {
        beforeEach(async () =>{
          await ribon.connect(nonProfitCouncil).addNonProfitToWhitelist(nonProfit.address);
        });

        it("returns true when check if non profit is on whitelist", async function () {
          expect(
            await ribon.nonProfits(nonProfit.address)
          ).to.equal(true);
        });

        it("emits NonProfitAdded event", async function () {
          await expect(ribon.connect(nonProfitCouncil).addNonProfitToWhitelist(nonProfit.address))
            .to.emit(ribon, "NonProfitAdded")
            .withArgs(nonProfit.address);
        });
      });
        
      describe("when you are not the nonprofit council", () => {
        it("transaction is reverted with error", async function () {
          await expect(
            ribon.connect(integrationCouncil).addNonProfitToWhitelist(nonProfit.address)
          ).to.be.revertedWith("You are not the nonprofit council");

          expect(
            await ribon.nonProfits(nonProfit.address)
          ).to.equal(false);
        });
      });
    });

    describe("#removeNonProfitFromWhitelist", () => {
      describe("when you are the nonprofit council", () => {
        beforeEach(async () =>{
          await ribon.connect(nonProfitCouncil).addNonProfitToWhitelist(nonProfit.address);
          await ribon.connect(nonProfitCouncil).removeNonProfitFromWhitelist(nonProfit.address);
        });

        it("should remove non profit from whitelist", async function () {
          expect(
            await ribon.nonProfits(nonProfit.address)
          ).to.equal(false);
        });

        it("emits NonProfitRemoved event", async function () {
          await expect(ribon.connect(nonProfitCouncil).removeNonProfitFromWhitelist(nonProfit.address))
            .to.emit(ribon, "NonProfitRemoved")
            .withArgs(nonProfit.address);
        });
      });

      describe("when you are not the nonprofit council", () => {
        it("transaction is reverted with error", async function () {
          await expect(
            ribon.connect(integrationCouncil).removeNonProfitFromWhitelist(nonProfit.address)
          ).to.be.revertedWith("You are not the nonprofit council");

          expect(
            await ribon.nonProfits(nonProfit.address)
          ).to.equal(false);
        });
      });
    });
  });

  describe("Promoter", () => {
    describe("#addDonationPoolBalance", () => {
      describe("when you have suficient balance", () => {
        beforeEach(async () =>{
          const value = 123
          await donationToken.approve(ribon.address, 10);
          await ribon.addDonationPoolBalance(10, crypto_user);
        });

        it("should increase contract donation token's balance", async function () {
          const balance = await donationToken.balanceOf(ribon.address);
          expect(balance).to.equal(10);
        });

        it("should increase donation pool balance", async function () {
          const balance = await ribon.donationPoolBalance();
          expect(balance).to.equal(10);
        });
  
        it("emits PoolBalanceIncreased event", async function () {
          await donationToken.approve(ribon.address, 10);
  
          await expect(ribon.connect(promoter).addDonationPoolBalance(10, crypto_user))
            .to.emit(ribon, "PoolBalanceIncreased")
            .withArgs(promoter.address, crypto_user, 10);
        });
      });

      describe("when is a normal user", () => {
        it("emits PoolBalanceIncreased event", async function () {
          await donationToken.approve(ribon.address, 10);
  
          await expect(ribon.connect(promoter).addDonationPoolBalance(10, user))
            .to.emit(ribon, "PoolBalanceIncreased")
            .withArgs(promoter.address, user, 10);
        });
      });
      
      describe("when amount is 0", () => {
        it("reverts the transaction", async function () {
          await expect(
            ribon.addDonationPoolBalance(0, crypto_user)
          ).to.be.revertedWith("Amount must be greater than 0");
        });
      });

      describe("when have insuficient allowance", () => {
        it("reverts the transaction", async function () {
          await expect(
            ribon.connect(promoter).addDonationPoolBalance(10, crypto_user)
          ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });
      });

      describe("when have insuficient funds", () => {
        it("reverts the transaction", async function () {
          await donationToken.connect(nonProfitCouncil).approve(ribon.address, 20);
          await expect(
            ribon.connect(nonProfitCouncil).addDonationPoolBalance(10, crypto_user)
          ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
      });
    });
  });
  
  describe("Integration council", () => {
    describe("#addIntegrationBalance", () => {
      describe("when you are the integration council", () => {
        describe("when you have enough balance", () => {
          beforeEach(async () =>{
            await donationToken.approve(ribon.address, 10);
            await ribon.addDonationPoolBalance(10, crypto_user);
          });

          it("increasses the integration balance", async function () {
            await ribon.connect(integrationCouncil).addIntegrationBalance(integration.address, 10);
            expect(
              await ribon.integrations(integration.address)
            ).to.equal(10);
          });
    
          it("emits IntegrationBalanceAdded event", async function () {
            await expect(ribon.connect(integrationCouncil).addIntegrationBalance(integration.address, 10))
              .to.emit(ribon, "IntegrationBalanceAdded")
              .withArgs(integration.address, 10);
          });

          describe("when amount is 0", () => {
            it("reverts the transaction", async function () {
              await expect(
                ribon.connect(integrationCouncil).addIntegrationBalance(integration.address, 0)
              ).to.be.revertedWith("Amount must be greater than 0");
            });
          });
        });

        describe("when you do not have enough balance", () => {
          it("reverts the transaction", async function () {
            await expect(
              ribon.connect(integrationCouncil).addIntegrationBalance(integration.address, 10)
            ).to.be.revertedWith("Balance must be greater than amount");
          });
        });
      });

      describe("when you are not the integration council", () => {
        it("reverts the transaction", async function () { 
          await expect(
            ribon.connect(nonProfitCouncil).addIntegrationBalance(integration.address, 10)
          ).to.be.revertedWith("You are not the integration council");
        });
      });
    });

    describe("#removeIntegrationBalance", () => {
      describe("when you are the integration council", () => {
        beforeEach(async () =>{
          await donationToken.approve(ribon.address, 10);
          await ribon.connect(promoter).addDonationPoolBalance(10, crypto_user);
          await ribon.connect(integrationCouncil).addIntegrationBalance(integration.address, 10);
        });
        
        describe("when the integration have enough balance", () => {      
          it("decreasses the integration balance", async function () {
            await ribon.connect(integrationCouncil).removeIntegrationBalance(integration.address, 10);
    
            expect(
              await ribon.integrations(integration.address)
            ).to.equal(0);
          });
    
          it("emits IntegrationBalanceUpdated event", async function () {
            await expect(ribon.connect(integrationCouncil).removeIntegrationBalance(integration.address, 10))
              .to.emit(ribon, "IntegrationBalanceRemoved")
              .withArgs(integration.address, 10);
          });
        });

        describe("when the integration have enough balance", () => {
          it("reverts the transaction", async function () {
            await expect(
              ribon.connect(integrationCouncil).removeIntegrationBalance(integration.address, 100)
            ).to.be.revertedWith("Balance must be greater than amount");
          });
        });

        describe("when the amount is 0", () => {
          it("reverts the transaction", async function () {
            await expect(
              ribon.connect(integrationCouncil).removeIntegrationBalance(integration.address, 0)
            ).to.be.revertedWith("Amount must be greater than 0");
          });
        });
      });

      describe("when you are not the integration council", () => {
        it("reverts the transaction", async function () {
          await expect(
            ribon.connect(integration).removeIntegrationBalance(integration.address, 10)
          ).to.be.revertedWith("You are not the integration council");
        });
      });
    });
  });

  describe("Integration", () => {
    describe("#donateThroughIntegration", () => {
      beforeEach(async () =>{
        await donationToken.approve(ribon.address, 10);
        await ribon.addDonationPoolBalance(10, crypto_user);
        await ribon.connect(nonProfitCouncil).addNonProfitToWhitelist(nonProfit.address);
        await ribon.connect(integrationCouncil).addIntegrationBalance(integration.address, 10);
      });

      describe("when the non profit is on whitelist", () => {
        describe("when the integration have enough balance", () => {
          it("decreases the integration balance", async function () {
            await ribon.connect(integration).donateThroughIntegration(
              nonProfit.address,
              user,
              10
            );

            expect(await donationToken.balanceOf(nonProfit.address)).to.equal(10);
          });

          it("emits DonationAdded event", async function () {

            await expect(
              ribon.connect(integration).donateThroughIntegration(nonProfit.address, user, 10)
            )
              .to.emit(ribon, "DonationAdded")
              .withArgs(user, integration.address, nonProfit.address, 10);
          });
        });

        describe("when the integration don't have enough balance", () => {
          it("reverts the transaction", async function () {
            await expect(
              ribon.connect(integration).donateThroughIntegration(nonProfit.address, user, 100)
            ).to.be.revertedWith("Balance must greater than amount");
          });
        });

        describe("when the amount is 0", () => {
          it("reverts the transaction", async function () {
            await expect(
              ribon.connect(integration).donateThroughIntegration(nonProfit.address, user, 0)
            ).to.be.revertedWith("Amount must be greater than 0");
          });
        });
      });
    });
    
    describe("when non profit is not on whitelist", () => {
      it("reverts the transaction", async function () { 
        await expect(
          ribon.connect(integration).donateThroughIntegration(
            integration.address,
            user,
            10
          )
        ).to.be.revertedWith("Not a whitelisted nonprofit");
      });
    });
  });

  describe("Governance Council", () => {
    describe("#transferDonationPoolBalance", () => {
      describe("when you are the governance council", () => {
        beforeEach(async () =>{
          await donationToken.approve(ribon.address, 10);
          await ribon.addDonationPoolBalance(10, crypto_user);
          await ribon.connect(governanceCouncil).transferDonationPoolBalance();
        });

        it("should transfer donation tokens to governance wallet", async function () {
          expect(await donationToken.balanceOf(governanceCouncil.address)).to.equal(10);
        });

        it("should set donation balance as 0", async function () {
          expect(await ribon.donationPoolBalance()).to.equal(0);
        });
      });

      describe("when you are not the governance council", () => {
        it("reverts the transaction", async function () {
          await expect(
            ribon.connect(integration).transferDonationPoolBalance()
          ).to.be.revertedWith("You are not the governance council");
        });
      });
    });

    describe("#setNonProfitCouncil", () => {
      describe("when you are the governance council", () => {
        beforeEach(async () =>{
          await ribon.connect(governanceCouncil).setNonProfitCouncil(governanceCouncil.address);
        });

        it("should set the non profit council", async function () {
          expect(await ribon.nonProfitCouncil()).to.equal(governanceCouncil.address);
        });
      });

      describe("when you are not the governance council", () => {
        it("reverts the transaction", async function () {
          await expect(
            ribon.connect(nonProfitCouncil).setNonProfitCouncil(governanceCouncil.address)
          ).to.be.revertedWith("You are not the governance council");
        });
      });
    });

    describe("#setIntegrationCouncil", () => {
      describe("when you are the governance council", () => {
        beforeEach(async () =>{
          await ribon.connect(governanceCouncil).setIntegrationCouncil(governanceCouncil.address);
        });

        it("should set the integration council", async function () {
          expect(await ribon.integrationCouncil()).to.equal(governanceCouncil.address);
        });
      });

      describe("when you are not the governance council", () => {
        it("reverts the transaction", async function () {
          await expect(
            ribon.connect(integrationCouncil).setIntegrationCouncil(governanceCouncil.address)
          ).to.be.revertedWith("You are not the governance council");
        });
      });
    });
  });
});