import { expect } from "chai"
import { waffle, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { Pool, PoolFactory, TestERC20 } from "../../typechain"
import { Fixture } from 'ethereum-waffle'

describe("PoolFactory", function () {
  let nonProfit: Wallet;
  let manager: Wallet;

  const fixture: Fixture<{
    token: TestERC20
    poolFactory: PoolFactory
  }> = async (wallets, provider) => {
    const tokenFactory = await ethers.getContractFactory('TestERC20')
    const token = (await tokenFactory.deploy(100000)) as TestERC20

    const poolFactoryFactory = await ethers.getContractFactory('PoolFactory')
    const poolFactory= (await poolFactoryFactory.deploy(wallets[0].address)) as PoolFactory

    return {
      token,
      poolFactory,
    }
  }

  let token: TestERC20;
  let poolFactory: PoolFactory;

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    const wallets = await (ethers as any).getSigners()
    ;[manager, nonProfit] = wallets
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ token, poolFactory } = await loadFixture(fixture))
  })

  describe("#createPool", () => {
    describe("when you create pool sucessfully", () => {
      beforeEach(async () =>{
        await poolFactory.createPool(token.address);
      });

      it("should increase pools length by 1", async function () {
        const pools = await poolFactory.getPools();
        expect(pools.length).to.equal(1);
      });

      it("emits PoolCreated event", async function () {
        await expect(poolFactory.createPool(token.address))
          .to.emit(poolFactory, "PoolCreated");
      });

      it("Create Pool add Add balance", async function () {
        
      });
    });
  });

  describe("#createPool then #addBalance", () => {
    describe("when you create pool sucessfully", () => {
      beforeEach(async () =>{
        await poolFactory.createPool(token.address);
      });

      it("should increase pools length by 1", async function () {
        const pools = await poolFactory.getPools();
        const poolContract = await ethers.getContractFactory('Pool')
        const pool = await new ethers.Contract(pools[0], poolContract.interface)
        await token.approve(pool.address, 10);
        await pool.connect(manager).addBalance(10);
        const balance = await token.balanceOf(pool.address);
        expect(balance).to.equal(10);
      })
    });
  });
});