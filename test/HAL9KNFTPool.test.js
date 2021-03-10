const chai = require("chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

const { expectRevert, time } = require("@openzeppelin/test-helpers");
const { artifacts } = require("hardhat");

const HAL9kToken = artifacts.require("HAL9K");
const HAL9KLtd = artifacts.require('HAL9KLtd');
const Hal9kVault = artifacts.require("Hal9kVault");
const HAL9KNFTPool = artifacts.require("HAL9KNFTPool");
const WETH9 = artifacts.require("WETH9");
const UniswapV2Pair = artifacts.require("UniswapV2Pair");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const FeeApprover = artifacts.require("FeeApprover");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

contract('HAL9K NFT Pool Test', async (accounts) => {
  const [alice, john, minter, dev, burner, clean, clean2] = accounts

  // alice: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  // john: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  // minter: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  // dev: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
  // burner: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
  // clean: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc

  describe("HAL9K NFT Pool", () => {
    beforeEach(async () => {
      this.hal9kLtd = await HAL9KLtd.new(alice, { from: alice });
      this.hal9kVault = await Hal9kVault.new(alice, { from: alice });
      this.hal9kPool = await HAL9KNFTPool.new(this.hal9kLtd.address, this.hal9kVault.address);
    });
    
    // This has problem.
    it("Should create and mint the nft card correctly", async () => {
      // Should create and mint the nft card correctly
      await this.hal9kLtd.create(100, 10, "https://images.hal9k.ai/1", []);
      this.firstCardId = await this.hal9kLtd.getCurrentTokenID();
      expect(this.firstCardId.toNumber()).to.equal(1);

      await this.hal9kLtd.create(100, 20, "https://images.hal9k.ai/2", []);
      this.secondCardId = await this.hal9kLtd.getCurrentTokenID();
      expect(this.secondCardId.toNumber()).to.equal(2);

      await this.hal9kLtd.create(100, 20, "https://images.hal9k.ai/2", []);
      this.thirdCardId = await this.hal9kLtd.getCurrentTokenID();
      expect(this.thirdCardId.toNumber()).to.equal(3);
    })

    it("Should start hal9k nft card reward", async () => {
      await expect(this.hal9kPool.getDaysPassedAfterStakingStart()).to.eventually.be.rejectedWith("LP token hasn't claimed yet");

      await this.hal9kPool.startHal9KStaking();
      let passedDays = await this.hal9kPool.getDaysPassedAfterStakingStart()
      assert.equal(passedDays, 0);

      await time.increase(60 * 60 * 24 * 7 + 1);
      passedDays = await this.hal9kPool.getDaysPassedAfterStakingStart()
      assert.equal(passedDays, 7);
    })

    it("Should able to move and back one stage", async () => {
      await expect(this.hal9kPool.moveStageBackOrForth(false)).to.eventually.be.rejectedWith("LP token hasn't claimed yet");
      await expect(this.hal9kPool.getCurrentStage()).to.eventually.be.rejectedWith("LP token hasn't claimed yet");
    })

    describe("MoveStageBackOrForth", () => {
      beforeEach(async () => {
        await this.hal9kPool.startHal9KStaking();
      })

      it("Stage should be 0 when stake started", async () => {
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);
      })

      it("Moving Forward: Stage should be 0 after 1 day has passed", async () => {
        await this.hal9kPool.moveStageBackOrForth(false);
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);
      })

      it("Moving Forward: Stage should be 1 after 1 day", async () => {
        // Passed one day
        await time.increase(60 * 60 * 24 * 1);
        await this.hal9kPool.moveStageBackOrForth(false);
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 1);

        // Passed two days
        await time.increase(60 * 60 * 24 * 2);
        await this.hal9kPool.moveStageBackOrForth(false);
        currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 2);
      })

      it("Moving Backward: Stage should be 0", async() => {
        await this.hal9kPool.moveStageBackOrForth(true);
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);

        // Make stage 1
        await time.increase(60 * 60 * 24 * 1);
        await this.hal9kPool.moveStageBackOrForth(false);

        await this.hal9kPool.moveStageBackOrForth(true);
        currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);
      })
    });

    describe("Test Hal9k NFT Card mint and burn", () => {
      before(async() => {
        this.factory = await UniswapV2Factory.new(alice, { from: alice });
        this.weth = await WETH9.new({ from: john });
        // Give alice weth
        await this.weth.deposit({ from: alice, value: "1000000000000000000000" });

        // Create router, hal9k, weth/eth pair
        this.router = await UniswapV2Router02.new(this.factory.address, this.weth.address, { from: alice });
        this.hal9k = await HAL9kToken.new(this.router.address, this.factory.address, { from: alice });
        this.hal9kWETHPair = await UniswapV2Pair.at(await this.factory.getPair(this.weth.address, this.hal9k.address));

        // Let's start LGE and give mentor the lp tokens 
        await this.hal9k.startLiquidityGenerationEventForHAL9K();
        await this.hal9k.addLiquidity(true, { from: minter, value: "1000000000000000000"});
        await time.increase(60 * 60 * 24 * 7 + 1);
        await this.hal9k.addLiquidityToUniswapHAL9KxWETHPair();
        await this.hal9k.claimLPTokens({ from: minter });

        console.log("Weth balance in the pair: ", (await this.weth.balanceOf(this.hal9kWETHPair.address)).valueOf().toString());
        console.log("Hal9k balance in the pair: ", (await this.hal9k.balanceOf(this.hal9kWETHPair.address)).valueOf().toString());
        assert.equal((await this.weth.balanceOf(this.hal9kWETHPair.address)).valueOf().toString(), "1000000000000000000");
        assert.equal((await this.hal9k.balanceOf(this.hal9kWETHPair.address)).valueOf().toString(), 9000e18);
        
        await this.hal9kWETHPair.sync();
        console.log("Hal9k address: ", this.hal9k.address);

        this.feeapprover = await FeeApprover.new({ from: alice });
        await this.feeapprover.initialize(this.hal9k.address, this.weth.address, this.factory.address);
        await this.feeapprover.setPaused(false, { from: alice });
        await this.hal9k.setShouldTransferChecker(this.feeapprover.address, {from: alice});
        await this.router.swapExactETHForTokensSupportingFeeOnTransferTokens("1", [await this.router.WETH(), this.hal9k.address], minter, 10000000000,
          { from: minter, value: "5000000000000000000000" });

        console.log("Balance of minter is ",(await this.hal9k.balanceOf(minter)).valueOf().toString());
        console.log("Balance of sender is ",(await this.weth.balanceOf(alice)).valueOf().toString());
        assert.equal(await this.factory.getPair(this.hal9k.address, this.weth.address), this.hal9kWETHPair.address);
      });

      beforeEach(async() => {
        // Here, clean is super admin address
        await this.hal9kVault.initialize(this.hal9k.address, dev, clean);
        await this.weth.transfer(minter, "10000000000000000000", { from: alice });
        await this.feeapprover.setHal9kVaultAddress(this.hal9kVault.address, {from: alice});

        await this.hal9kLtd.create(100, 0, "https://images.hal9k.ai/1", []);
        this.firstCardId = await this.hal9kLtd.getCurrentTokenID();
        expect(this.firstCardId.toNumber()).to.equal(1);
      })

      it ("Should able to mint and burn cards for user correctly", async () => {
        // Create hal9k/WETH pair and transfer it to minter
        await this.weth.transfer(this.hal9kWETHPair.address, "100000000", {from: minter});
        await this.hal9k.transfer(this.hal9kWETHPair.address, "100000000", {from: minter});
        await this.hal9kWETHPair.mint(minter);
        await this.hal9kWETHPair.transfer(this.hal9kWETHPair.address, "2000000", {from: minter});
  
        // aprove spend of everything
        await this.hal9kWETHPair.approve(this.hal9kVault.address, "10000000000000", { from: minter });
  
        // make pair and give 100 alloc point.
        await this.hal9kVault.add("100", this.hal9kWETHPair.address, true, true, {from: alice});

        // Give clean2 100 from minter's balance and then approve
        await this.hal9kWETHPair.transfer(clean2, "100", { from: minter });
        await this.hal9kWETHPair.approve(this.hal9kVault.address, "10000000000000", { from: clean2 });
        await this.hal9kVault.deposit(0, 100, { from: clean2 });
        console.log("Hal9kPool address: ", this.hal9kPool.address);
        
        // Add pool address as minter of cards
        await this.hal9kLtd.addMinter(this.hal9kPool.address);

        let totalSupply = await this.hal9kLtd.totalSupply(1);
        expect(totalSupply.toNumber()).to.equal(0);

        // Mint 10 cards (type 1)
        await this.hal9kPool.mintCardForUser("0", 100, 1, 10, { from: clean2 });
        totalSupply = await this.hal9kLtd.totalSupply(1);
        expect(totalSupply.toNumber()).to.equal(10);

        // Burn 5 cards (type 1)
        await this.hal9kPool.burnCardForUser("0", 100, 1, 5, { from: clean2 });
        totalSupply = await this.hal9kLtd.totalSupply(1);
        expect(totalSupply.toNumber()).to.equal(5);
      });
    });
  });
})
