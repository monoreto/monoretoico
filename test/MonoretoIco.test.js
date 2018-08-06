import latestTime from './helpers/latestTime';
import advanceBlock from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import ether from './helpers/ether';
import EVMRevert from './helpers/EVMRevert';

const MonoretoCrowdsale = artifacts.require('MonoretoIco');
const MonoretoToken = artifacts.require('MonoretoToken');

// const ReentrancyAttacker = artifacts.require("ReentrancyAttacker");

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const BigNumber = web3.BigNumber;

contract('MonoretoIco', function ([owner, wallet, investor, team, project, bounty]) {

    const USDETH = new BigNumber(528);
    const USDMNR = new BigNumber(5263);
    const SOFTCAP = new BigNumber(web3.toWei(3788, "ether"));
    const HARDCAP = new BigNumber(web3.toWei(28410, "ether"));
    const ONE_HUNDRED_PERCENT = new BigNumber(100);

    const USD_SIGNIFICANT_DIGITS_POW = 100000;
    const TOKEN_CAP = new BigNumber(5 * (10 ** 26));
    const TOKEN_TARGET = HARDCAP.times(USDETH).times(USD_SIGNIFICANT_DIGITS_POW).div(USDMNR).toFixed(0);

    const SINGLE_ETHER = new BigNumber(web3.toWei(1, "ether"));

    before(async function() {
        await advanceBlock();
        BigNumber.config({ DECIMAL_PLACES: 18 });
    });

    beforeEach(async function () {
        this.startTime = latestTime() + duration.hours(1);
        this.endTime = this.startTime + duration.days(30);
        this.afterEndTime = this.endTime + duration.seconds(1);

        this.bonusTimes = [
            duration.days(1),
            duration.days(3),
            duration.days(10),
            duration.days(17),
        ];

        this.bonusTimesPercents = [
            new BigNumber(120), new BigNumber(115), 
            new BigNumber(110), new BigNumber(105)
        ];

        this.token = await MonoretoToken.new(TOKEN_CAP);
        this.crowdsale = await MonoretoCrowdsale.new(
            this.startTime, this.endTime,
            USDETH, USDMNR, 
            SOFTCAP, HARDCAP, 
            TOKEN_TARGET, new BigNumber(1),
            wallet, 
            this.token.address
        );


        this.token = MonoretoToken.at(await this.crowdsale.token());
        this.token.transferOwnership(this.crowdsale.address);
    });

    it("should create crowdsale with correct parameters", async function () {
        this.crowdsale.should.exist;
        this.token.should.exist;

        const startTime = await this.crowdsale.openingTime();
        const endTime = await this.crowdsale.closingTime();
        const usdMnr = await this.crowdsale.usdMnr();
        const usdEth = await this.crowdsale.usdEth();
        const walletAddress = await this.crowdsale.wallet();
        const goal = await this.crowdsale.goal();
        const cap = await this.crowdsale.cap();

        startTime.should.be.bignumber.equal(this.startTime);
        endTime.should.be.bignumber.equal(this.endTime);
        usdMnr.should.be.bignumber.equal(USDMNR);
        usdEth.should.be.bignumber.equal(USDETH);
        walletAddress.should.be.equal(wallet);
        goal.should.be.bignumber.equal(SOFTCAP);
        cap.should.be.bignumber.equal(HARDCAP);
    });

    it("should not create crowdsale if hardcap is less than softcap", async function() {
        await MonoretoCrowdsale.new(
            this.startTime, this.endTime,
            USDETH, USDMNR, 
            HARDCAP, SOFTCAP,
            TOKEN_TARGET, new web3.BigNumber(1),
            wallet,
            this.token.address
        ).should.be.rejectedWith(EVMRevert);
    });

    it("should not create crowdsale if tokenTarget is equal to zero", async function() {
        await MonoretoCrowdsale.new(
            this.startTime, this.endTime,
            USDETH, USDMNR,
            HARDCAP, SOFTCAP,
            0, new web3.BigNumber(1), wallet, this.token.address
        ).should.be.rejectedWith(EVMRevert);
    });

    it("should not create crowdsale if initial USDETH rate is equal to zero", async function() {
        await MonoretoCrowdsale.new(
            this.startTime, this.endTime,
            0, USDMNR,
            HARDCAP, SOFTCAP,
            TOKEN_TARGET, new web3.BigNumber(1), wallet, this.token.address
        ).should.be.rejectedWith(EVMRevert);
    });

    it("should not allow to buy tokens more than a token target", async function() {
        await increaseTimeTo(this.startTime + this.bonusTimes[3] + duration.days(1));
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);
        var hardcapHalf = HARDCAP.div(2);

        await this.crowdsale.sendTransaction({ from: investor, value: hardcapHalf, gasPrice: 0 });
        console.log("AFTER INCREASING TIME");

	await this.crowdsale.setUsdEth(USDETH.mul(2));

        await this.crowdsale.sendTransaction({ from: investor, value: hardcapHalf, gasPrice: 0 })
            .should.be.rejectedWith(EVMRevert);
    });

    it("should not create crowdsale if initial USDMNR rate is equal to zero", async function() {
        await MonoretoCrowdsale.new(
            this.startTime, this.endTime,
            USDETH, 0, 
            HARDCAP, SOFTCAP,
            TOKEN_TARGET, new BigNumber(1), wallet, this.token.address
        ).should.be.rejectedWith(EVMRevert);
    });

    it("should not allow to call finalize before crowdsale end", async function() {
        await increaseTimeTo(this.startTime);
        await this.crowdsale.finalize().should.be.rejectedWith(EVMRevert);
    });

    it("should not allow to send ether before crowdsale beginning and after crowdsale end", async function() {
        await increaseTimeTo(this.startTime);
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER }).should.be.rejectedWith(EVMRevert);
        await increaseTimeTo(this.afterEndTime);
        this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER }).should.be.rejectedWith(EVMRevert);
    });

    it("should allow to call the finalize function after crowdsale end", async function() {
        this.crowdsale.setAdditionalWallets(team, bounty);
        await increaseTimeTo(this.afterEndTime);

        (await this.crowdsale.hasClosed()).should.be.true;
        await this.crowdsale.finalize().should.be.fulfilled;
        (await this.crowdsale.isFinalized()).should.be.true;
    });

    it("should set bonuses only from owner", async function() {
        await increaseTimeTo(this.startTime);
        this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents, { from: investor })
            .should.be.rejectedWith(EVMRevert);
    });

    it("should not set bonuses if length of time array and value array differ", async function() {
        await increaseTimeTo(this.startTime);
        this.bonusTimes.push(this.bonusTimes[3] + 1);

        this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents, { from: owner })
            .should.be.rejectedWith(EVMRevert);
    });

    it("should not set bonuses if time array is not sorted", async function() {
        await increaseTimeTo(this.startTime);
        this.bonusTimes.reverse();

        this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents, { from: owner })
            .should.be.rejectedWith(EVMRevert);
    });

    it("should not allow to set zero project wallet", async function() {
        await increaseTimeTo(this.startTime);

        this.crowdsale.setAdditionalWallets(0, bounty).should.be.rejectedWith(EVMRevert);
    });

    it("should not allow to set zero project wallet", async function() {
        await increaseTimeTo(this.startTime);

        this.crowdsale.setAdditionalWallets(project, 0).should.be.rejectedWith(EVMRevert);
    });

    it("should refund if goal is not reached", async function() {
        await increaseTimeTo(this.startTime);

        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents).should.be.fulfilled;

        await this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER, gasPrice: 0 });

        let balanceBeforeRefund = await web3.eth.getBalance(investor.toString());

        await increaseTimeTo(this.afterEndTime);
        const isGoalReached = await this.crowdsale.goalReached();
        isGoalReached.should.be.false;

        this.crowdsale.setAdditionalWallets(team, bounty);

        await this.crowdsale.finalize();
        await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 });

        let balanceAfterRefund = await web3.eth.getBalance(investor);

        balanceAfterRefund.minus(balanceBeforeRefund).should.be.bignumber.equal(SINGLE_ETHER);
    });

    it("should set empty bonuses (which means no bonuses)", async function() {
        await increaseTimeTo(this.startTime);

        await this.crowdsale.setBonusTimes([],  [], { from: owner }).should.be.fulfilled;

        await this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER });

        var expectedNumberOfTokens = SINGLE_ETHER.times(USDETH).times(100000).div(USDMNR).toFixed(0);
        expectedNumberOfTokens.should.be.bignumber.equal(await this.token.balanceOf(investor));
    });

    it("should not refund if goal is reached", async function() {
        await increaseTimeTo(this.startTime);

        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        await this.crowdsale.send(SOFTCAP, { from: investor });

        await increaseTimeTo(this.afterEndTime);
        this.crowdsale.setAdditionalWallets(team, bounty);
        (await this.crowdsale.goalReached()).should.be.true;

        this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it("should not accept payments less than 0.1 ETH", async function() {
        await increaseTimeTo(this.startTime);
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        await this.crowdsale.sendTransaction({ from: investor, value: new BigNumber(web3.toWei(99, 'finney')) })
            .should.be.rejectedWith(EVMRevert);
    });

    it("should set bonus times and values in percents", async function() {
        await increaseTimeTo(this.startTime);

        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        let bonusTimesSet = await this.crowdsale.getBonusTimes();
        let bonusTimesPercentsSet = await this.crowdsale.getBonusTimesPercents();

        for (var i = 0; i < this.bonusTimes.length; i++) {
            bonusTimesSet[i].should.be.bignumber.equal(this.bonusTimes[i]);
            bonusTimesPercentsSet[i].should.be.bignumber.equal(this.bonusTimesPercents[i]);
        }
    });

    it('should pay bonus that depends on date participated', async function() {
        let timesForRewind = [
            this.startTime + duration.hours(2),
            this.startTime + duration.days(2), 
            this.startTime + duration.days(4),
            this.startTime + duration.days(11),
            this.startTime + duration.days(20)
        ];

        await increaseTimeTo(this.startTime);

        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        const rate = new BigNumber(USDETH.times(100000).div(USDMNR).toFixed(0));

        for (var i = 0; i < timesForRewind.length; i++) {
            await increaseTimeTo(timesForRewind[i]);
            let oldBalance = await this.token.balanceOf(investor);

            await this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER }).should.be.fulfilled;

            var tokenBalanceOfInvestor = await this.token.balanceOf(investor);

            var balance = tokenBalanceOfInvestor.minus(oldBalance);
            var currentBonusPercents = this.bonusTimesPercents[i] || ONE_HUNDRED_PERCENT;
            
            var expectedNumberOfTokens = SINGLE_ETHER.times(USDETH).times(100000)
                .times(currentBonusPercents).div(ONE_HUNDRED_PERCENT).div(USDMNR).toFixed(0);

            balance.should.be.bignumber.equal(expectedNumberOfTokens);
        }
    });

    it('should finish crowdsale as soon as hardcap is collected', async function() {
        await increaseTimeTo(this.startTime + this.bonusTimes[3] + duration.hours(1));
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);
        this.crowdsale.setAdditionalWallets(team, bounty);

        await this.crowdsale.sendTransaction({ from: investor, value: HARDCAP }).should.be.fulfilled;
        (await this.crowdsale.capReached()).should.be.true;

        await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    it("should not refund if crowdsale is in progress", async function() {
        await increaseTimeTo(this.startTime);
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        await this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER });

        this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it("should not accept any payments unless bonuses are set", async function() {
        await increaseTimeTo(this.startTime);
        this.crowdsale.sendTransaction({ from: investor, value: SINGLE_ETHER }).should.be.rejectedWith(EVMRevert);
    });

    it("should not allow to finalize if softcap is collected and team and bounty wallets not set", async function() {
        await increaseTimeTo(this.startTime);
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        await this.crowdsale.sendTransaction({ from: investor, value: SOFTCAP }).should.be.fulfilled;

        await increaseTimeTo(this.afterEndTime);

        this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
    });

    it("should allow to finalize if softcap is not collected and team and bounty wallets not set", async function() {
        await increaseTimeTo(this.afterEndTime);

        this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    it('should mint 23% tokens for project needs, 11% for team and 3% for bounty after the end of crowdsale', async function() {
        await increaseTimeTo(this.startTime);
        await this.crowdsale.setBonusTimes(this.bonusTimes, this.bonusTimesPercents);

        this.crowdsale.setAdditionalWallets(team, bounty);
        // Crowdsale is required to be ended and goal has to be reached
        await this.crowdsale.sendTransaction({ from: investor, value: SOFTCAP }).should.be.fulfilled;
        await increaseTimeTo(this.afterEndTime);

        await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;

        const RATE = USDETH.times(100000).div(USDMNR);
        const TWENTY_THREE_PCT_MULT = new BigNumber(23).div(ONE_HUNDRED_PERCENT);
        const ELEVEN_PCT_MULT = new BigNumber(11).div(ONE_HUNDRED_PERCENT);
        const THREE_PCT_MULT = new BigNumber(3).div(ONE_HUNDRED_PERCENT);
        const BONUS_PCT = this.bonusTimesPercents[0].div(ONE_HUNDRED_PERCENT);

        const TOKEN_CAP = await this.token.cap();

        let expectedProjectTokens = TOKEN_CAP.times(TWENTY_THREE_PCT_MULT);
        let expectedTeamTokens = TOKEN_CAP.times(ELEVEN_PCT_MULT);
        let expectedBountyTokens = TOKEN_CAP.times(THREE_PCT_MULT);

        expectedProjectTokens.should.be.bignumber.equal(await this.token.balanceOf(wallet));
        expectedTeamTokens.should.be.bignumber.equal(await this.token.balanceOf(team));
        expectedBountyTokens.should.be.bignumber.equal(await this.token.balanceOf(bounty));

        (await this.token.mintingFinished()).should.be.true;
        owner.should.be.equal(await this.token.owner());

        await this.token.mint(owner, 1, { from: owner }).should.be.rejectedWith(EVMRevert);
    });

    /* it("should allow to claim refund only once to one investor", async function() {
        increaseTimeTo(this.openTime);

        var attacker = await ReentrancyAttacker.new(this.crowdsale.address);

        var valueLessThanSoftcap = SOFTCAP.div(2);
	await attacker.putEther({ value: valueLessThanSoftcap, from: owner });
	await attacker.putEther({ value: valueLessThanSoftcap.div(2), from: investor });

	increaseTimeTo(this.afterCloseTime);
	await attacker.attack().should.be.rejectedWith(EVMRevert);
    }); */
});

