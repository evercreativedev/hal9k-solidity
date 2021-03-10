const HAL9kToken = artifacts.require("HAL9K");
const { expectRevert, time } = require("@openzeppelin/test-helpers");
const { inTransaction } = require("@openzeppelin/test-helpers/src/expectEvent");
const Hal9kVault = artifacts.require("Hal9kVault");

const WETH9 = artifacts.require("WETH9");
const UniswapV2Pair = artifacts.require("UniswapV2Pair");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const FeeApprover = artifacts.require("FeeApprover");
const Hal9kRouter = artifacts.require("Hal9kv1Router");
const Hal9kNftPool = artifacts.require("HAL9KNFTPool");
const Hal9kLtd = artifacts.require("HAL9KLtd");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

contract("Hal9kV1Router", () => {
  let alice,
    john,
    minter,
    dev,
    burner,
    clean,
    clean2,
    clean3,
    clean4,
    clean5,
    clean6;

  before(async () => {
    [
      alice,
      john,
      minter,
      dev,
      burner,
      clean,
      clean2,
      clean3,
      clean4,
      clean5,
      clean6,
    ] = await web3.eth.getAccounts();
    this.factory = await UniswapV2Factory.new(alice, { from: alice });
    this.weth = await WETH9.new({ from: john });
    await this.weth.deposit({ from: alice, value: "1000000000000000000000" });
    this.router = await UniswapV2Router02.new(
      this.factory.address,
      this.weth.address,
      { from: alice }
    );
    this.hal9k = await HAL9kToken.new(
      this.router.address,
      this.factory.address,
      { from: alice }
    );
    this.hal9kWETHPair = await UniswapV2Pair.at(
      await this.factory.getPair(this.weth.address, this.hal9k.address)
    );
    await this.hal9k.startLiquidityGenerationEventForHAL9K();
    await this.hal9k.addLiquidity(true, {
      from: minter,
      value: "7000000000000000000",
    });
    await time.increase(60 * 10);
    await this.hal9k.addLiquidityToUniswapHAL9KxWETHPair();
    await this.hal9k.claimLPTokens({ from: minter });

    assert.equal(
      (await this.weth.balanceOf(this.hal9kWETHPair.address))
        .valueOf()
        .toString(),
      "7000000000000000000"
    );

    console.log(
      "hal9k hal9k amount=====>",
      (await this.hal9k.balanceOf(this.hal9k.address)).valueOf().toString()
    );
    assert.equal(
      (await this.hal9k.balanceOf(this.hal9kWETHPair.address))
        .valueOf()
        .toString(),
      9000e18
    );

    //await this.hal9kWETHPair.sync();

    this.feeapprover = await FeeApprover.new({ from: alice });
    await this.feeapprover.initialize(
      this.hal9k.address,
      this.weth.address,
      this.factory.address
    );

    await this.feeapprover.setPaused(false, { from: alice });
    await this.hal9k.setShouldTransferChecker(this.feeapprover.address, {
      from: alice,
    });

    console.log(
      "pair hal9k amount======>",
      (await this.hal9k.balanceOf(this.hal9kWETHPair.address))
        .valueOf()
        .toString()
    );
    console.log(
      "Balance of minter is ",
      (await this.hal9k.balanceOf(minter)).valueOf().toString()
    );
    assert.equal(
      await this.factory.getPair(this.hal9k.address, this.weth.address),
      this.hal9kWETHPair.address
    );
    // await this.factory.createPair(this.weth.address, this.hal9k.address);
  });

  beforeEach(async () => {
    this.hal9kvault = await Hal9kVault.new({ from: alice });
    this.hal9kLtd = await Hal9kLtd.new(
      "0xf57b2c51ded3a29e6891aba85459d600256cf317",
      {
        from: alice,
      }
    );
    this.hal9kNftPool = await Hal9kNftPool.new({ from: alice });
    await this.hal9kvault.initialize(
      this.hal9k.address,
      this.hal9kNftPool.address,
      dev,
      clean
    );
    await this.hal9kNftPool.initialize(
      this.hal9kLtd.address,
      this.hal9kvault.address,
      dev
    );
    await this.hal9kvault.add(100, this.hal9kWETHPair.address, true, true, {
      from: alice,
    });
    //await this.weth.transfer(minter, "10000000000000000000", { from: alice });

    await this.feeapprover.setHal9kVaultAddress(this.hal9kvault.address, {
      from: alice,
    });
    this.hal9kRouter = await Hal9kRouter.new({ from: alice });
    await this.hal9kRouter.initialize(
      this.hal9k.address,
      this.weth.address,
      this.factory.address,
      this.feeapprover.address,
      this.hal9kvault.address
    );
    // Set pair in the uni reert contract
  });
  it("addLiqudityEthOnly should work correctly", async () => {
    await this.hal9kRouter.addLiquidityETHOnly(clean2, false, {
      from: clean2,
      value: "100000000000000000",
    });
    console.log(
      (await this.hal9kWETHPair.balanceOf(clean2)).valueOf().toString()
    );
  });
});
