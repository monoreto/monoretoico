var MonoretoIco = artifacts.require("./MonoretoIco.sol");
var MonoretoPreIco = artifacts.require("./MonoretoPreIco.sol");
var MonoretoToken = artifacts.require("./MonoretoToken.sol");

const duration = {
    seconds: function(val) { return val},
    minutes: function(val) { return val * this.seconds(60) },
    hours:   function(val) { return val * this.minutes(60) },
    days:    function(val) { return val * this.hours(24) },
    weeks:   function(val) { return val * this.days(7) },
    years:   function(val) { return val * this.days(365)}
};

module.exports = function(deployer, network, accounts) {

	const preIcoTokenCap = 5 * 10 ** 26;
	const icoTokenCap = 5 * 10 ** 26;

	const preIcoStartTime = web3.eth.getBlock('latest').timestamp + duration.minutes(1);
	const preIcoEndTime = preIcoStartTime + duration.days(30);
	const preIcoGoal = new web3.BigNumber(web3.toWei("378", "ether"));
	const preIcoCap = new web3.BigNumber(web3.toWei("1516", "ether"));
	const usdeth = new web3.BigNumber(528);
	const preIcoUsdmnr = new web3.BigNumber(2670);
	const wallet = accounts[1];

	const icoStartTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + duration.minutes(1);
	const icoEndTime = preIcoStartTime + duration.minutes(5);
	const icoGoal = new web3.BigNumber(web3.toWei("3788", "ether"));
	const icoCap = new web3.BigNumber(web3.toWei("28410", "ether"));
	const icoUsdmnr = new web3.BigNumber(5263);

  	deployer.deploy(MonoretoToken, preIcoTokenCap, { overwrite: false }).then(function(instance) {
		deployer.deploy(MonoretoPreIco, preIcoStartTime, preIcoEndTime, preIcoGoal, preIcoCap, usdeth, preIcoUsdmnr, new web3.BigNumber(1), preIcoTokenCap, wallet, MonoretoToken.address);

		deployer.deploy(MonoretoIco, icoStartTime, icoEndTime, icoGoal, icoCap, usdeth, icoUsdmnr, icoTokenCap, new web3.BigNumber(1), wallet, MonoretoToken.address);
	});
};
