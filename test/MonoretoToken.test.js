import advanceBlock from "./helpers/advanceToBlock";
import EVMRevert from "./helpers/EVMRevert";

const MonoretoToken = artifacts.require("MonoretoToken");

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const BigNumber = web3.BigNumber;

contract("MonoretoToken", async function([ owner, wallet, investor ]) {
    const TOKEN_DECIMALS = 18;

    // CAP must be equal to 500 million tokens
    const CAP = new BigNumber(5 * (10 ** (TOKEN_DECIMALS + 8)));
    const SINGLE_TOKEN = new BigNumber(10 ** TOKEN_DECIMALS);

    before(async function() {
        await advanceBlock();
    });

    beforeEach(async function() {
        this.token = await MonoretoToken.new(CAP, { from: owner });
    });

    it("should create monoreto token with correct params", async function() {
        this.token.should.exist;

        CAP.should.be.bignumber.equal(await this.token.cap());
    });

    it("should allow to mint no more than the cap", async function() {
        this.token.mint(investor, CAP).should.be.fulfilled;
        this.token.mint(investor, 1).should.be.rejectedWith(EVMRevert);
    });

    it("should allow to adjust the cap", async function() {
        this.token.mint(investor, SINGLE_TOKEN).should.be.fulfilled;

        await this.token.adjustCap({ from: owner });
        (await this.token.cap()).should.be.bignumber.equal(SINGLE_TOKEN.times(100).div(6).toFixed(0));
    });

    it("should allow to adjust the cap only to owner", async function() {
        await this.token.adjustCap({ from: investor }).should.be.rejectedWith(EVMRevert);
        await this.token.adjustCap({ from: owner }).should.be.fulfilled;
    });

    it("should allow to adjust the cap only once", async function() {
        await this.token.adjustCap({ from: owner }).should.be.fulfilled;
        await this.token.adjustCap({ from: owner }).should.be.rejectedWith(EVMRevert);
    });
});

