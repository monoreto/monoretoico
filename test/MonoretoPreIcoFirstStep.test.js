import latestTime from "./helpers/latestTime";
import advanceBlock from "./helpers/advanceToBlock";
import { increaseTimeTo, duration } from "./helpers/increaseTime";
import ether from "./helpers/ether";
import EVMRevert from "./helpers/EVMRevert";

const MonoretoToken = artifacts.require("MonoretoToken");
const MonoretoPreIcoFirstStep = artifacts.require("MonoretoPreIcoFirstStep");
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract("MonoretoPreIcoFirstStep", async function([ owner, wallet, investor ]) {

    const TOKEN_CAP = new BigNumber(5 * (10 ** 26));
    const TOKEN_TARGET = new BigNumber(TOKEN_CAP.times(6).div(100).toFixed(0));

    const GOAL = new BigNumber(web3.toWei(534, "ether"));
    const CAP = new BigNumber(web3.toWei(2137, "ether"));

    const USDETH = new BigNumber(468);
    const USDMNR = new BigNumber("3e18");

    before(async function() {
        await advanceBlock();
        await BigNumber.config({ DECIMAL_PLACES: 18 });
        // this.USDMNR = new BigNumber("3e18");
    });

    beforeEach(async function() {
        this.openTime = latestTime() + duration.hours(1);
        this.closeTime = this.openTime + duration.days(30);
        this.afterCloseTime = this.closeTime + duration.seconds(1);

        this.token = await MonoretoToken.new(TOKEN_CAP);

        this.preIco = await MonoretoPreIcoFirstStep.new(
            this.openTime, this.closeTime, GOAL, CAP, USDETH, 
	    USDMNR, TOKEN_TARGET, new BigNumber(28725), wallet, this.token.address
	);

        this.token = MonoretoToken.at(await this.preIco.token());

        this.token.transferOwnership(this.preIco.address, { from: owner });
    });

    it("should adjust the cap of the token after the end of the pre-ico", async function() {
        increaseTimeTo(this.openTime);
        await this.preIco.sendTransaction({ from: investor, value: GOAL });

        await increaseTimeTo(this.afterCloseTime);
        await this.preIco.finalize({ from: owner }).should.be.fulfilled;

        const currentTokenCap = await this.token.cap();
        const tokensDistributed = await this.preIco.tokensPurchased();

        currentTokenCap.should.be.bignumber.equal(tokensDistributed.times(100).div(6).toFixed(18));
    });
});

