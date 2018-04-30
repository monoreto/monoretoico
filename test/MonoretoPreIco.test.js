import latestTime from "./helpers/latestTime";
import advanceBlock from "./helpers/advanceToBlock";
import { increaseTimeTo, duration } from "./helpers/increaseTime";
import ether from "./helpers/ether";
import EVMRevert from "./helpers/EVMRevert";

const MonoretoToken = artifacts.require("MonoretoToken");
const MonoretoPreIco = artifacts.require("MonoretoPreIco");

const ReentrancyAttacker = artifacts.require("ReentrancyAttacker");

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract("MonoretoPreIco", async function([ owner, wallet, investor ]) {

    const TOKEN_CAP = new BigNumber(5 * (10 ** 26));
    const TOKEN_TARGET = new BigNumber(TOKEN_CAP.times(6).div(100).toFixed(0));

    const GOAL = ether(378);
    const CAP = ether(1516);

    const USDETH = new BigNumber(528);
    const USDMNR = new BigNumber(2670);

    before(async function() {
	await advanceBlock();
    });

    beforeEach(async function() {
        this.openTime = latestTime() + duration.hours(1);
	this.closeTime = this.openTime + duration.days(30);
	this.afterCloseTime = this.closeTime + duration.seconds(1);

	this.token = await MonoretoToken.new(TOKEN_CAP);

	this.preIco = await MonoretoPreIco.new(this.openTime, this.closeTime, GOAL, CAP, USDETH, USDMNR, TOKEN_TARGET, wallet, this.token.address);

	this.token = MonoretoToken.at(await this.preIco.token());

	this.token.transferOwnership(this.preIco.address, { from: owner });
    });

    it("should create pre-ico with correct parameters", async function() {
	this.preIco.should.exist;
	this.token.should.exist;

        const openTime = await this.preIco.openingTime();
	const closeTime = await this.preIco.closingTime();
	const goal = await this.preIco.goal();
	const cap = await this.preIco.cap();
	const tokenTarget = await this.preIco.tokenTarget();
	const ownerWallet = await this.preIco.wallet();

	openTime.should.be.bignumber.equal(this.openTime);
	closeTime.should.be.bignumber.equal(this.closeTime);
	goal.should.be.bignumber.equal(GOAL);
	cap.should.be.bignumber.equal(CAP);
	tokenTarget.should.be.bignumber.equal(TOKEN_TARGET);
	ownerWallet.should.be.equal(wallet);
    });

    it("should not create pre-ico if hardcap is less than softcap", async function() {
        await MonoretoPreIco.new(
            this.openTime, this.closeTime, CAP, GOAL, 
            USDETH, USDMNR, TOKEN_TARGET, wallet, this.token.address
        ).should.be.rejectedWith(EVMRevert);
    });

    it("should adjust the rate with respect to the new USDETH rate", async function() {
	const oldUsdEthRate = await this.preIco.usdEth();
	const oldRate = await this.preIco.rate();

	this.preIco.setUsdEth(oldUsdEthRate.times(2), { from: owner }).should.be.fulfilled;

	const newRate = await this.preIco.rate();

	newRate.should.be.bignumber.equal(oldRate.times(2));
    });

    it("should adjust the rate with respect to the new USDMNR rate", async function() {
	const oldUsdMnrRate = await this.preIco.usdMnr();
	const oldRate = await this.preIco.rate();

	this.preIco.setUsdMnr(oldUsdMnrRate.times(2), { from: owner }).should.be.fulfilled;

	const newRate = await this.preIco.rate();

	newRate.should.be.bignumber.equal(oldRate.div(2).toFixed(0));
    });

    it("should return certain amount of tokens per 1 ETH", async function() {
	await increaseTimeTo(this.openTime);
        await this.preIco.sendTransaction({ from: investor, value: web3.toWei("1", "ether") }).should.be.fulfilled;

	const tokensOfInvestor = await this.token.balanceOf(investor);
	const decimals = await this.token.DECIMALS();

	const decimalsInUsdMnr = 100000;

	tokensOfInvestor.should.be.bignumber.equal(
	    new BigNumber(USDETH.times(decimalsInUsdMnr).div(USDMNR)).times(new BigNumber(10 ** decimals)).toFixed(0)
	);
    });

    it("should allow to adjust the rate with respect to the new USDETH rate only to owner", async function() {
	this.preIco.setUsdEth(new BigNumber(1), { from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it("should allow to adjust the rate with respect to the new USDMNR rate only to owner", async function() {
	this.preIco.setUsdMnr(new BigNumber(1), { from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it("should refund in case the crowdsale fails to collect the softcap", async function() {
        await increaseTimeTo(this.openTime);
	const investorBalance = await web3.eth.getBalance(investor);
	await this.preIco.sendTransaction({ from: investor, value: GOAL.div(2), gasPrice: 0 }).should.be.fulfilled;

	await increaseTimeTo(this.afterCloseTime);
	await this.preIco.finalize({ from: owner }).should.be.fulfilled;

        (await this.preIco.goalReached()).should.be.false;
	await this.preIco.claimRefund({ from: investor, gasPrice: 0 }).should.be.fulfilled;

	investorBalance.should.be.bignumber.equal(await web3.eth.getBalance(investor));
    });

    it("should not refund in case the crowdsale collects the softcap", async function() {
        await increaseTimeTo(this.openTime);
	await this.preIco.sendTransaction({ from: investor, value: GOAL }).should.be.fulfilled;

	await increaseTimeTo(this.afterCloseTime);
	await this.preIco.finalize({ from: owner }).should.be.fulfilled;

	await this.preIco.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it("should not accept payment less than 0.1 ETH", async function() {
	await increaseTimeTo(this.openTime);

	// 1 finney = 0.001 ETH
	await this.preIco.sendTransaction({ from: investor, value: new BigNumber(web3.fromWei(99, "finney")) }).should.be.rejectedWith(EVMRevert);
    });

    it("should adjust the cap of the token after the end of the pre-ico", async function() {
        increaseTimeTo(this.openTime);
	await this.preIco.sendTransaction({ from: investor, value: GOAL });

	await increaseTimeTo(this.afterCloseTime);
	await this.preIco.finalize({ from: owner }).should.be.fulfilled;

	const currentTokenCap = await this.token.cap();
	const tokensDistributed = await this.preIco.tokensPurchased();

	currentTokenCap.should.be.bignumber.equal(tokensDistributed.times(100).div(6));
    });

    it("should return the ownership to the team's wallet after the end of crowdsale", async function() {
	increaseTimeTo(this.afterCloseTime);

	await this.preIco.finalize({ from: owner }).should.be.fulfilled;

	owner.should.be.equal(await this.token.owner());
    });

    it("should allow to claim refund only once to one investor", async function() {
        increaseTimeTo(this.openTime);

        var attacker = await ReentrancyAttacker.new(this.preIco.address);

        var valueLessThanSoftcap = GOAL.div(2);
	await attacker.putEther({ value: valueLessThanSoftcap, from: owner });
	await attacker.putEther({ value: valueLessThanSoftcap.div(2), from: investor });

	increaseTimeTo(this.afterCloseTime);
	await attacker.attack().should.be.rejectedWith(EVMRevert);
    });
});

