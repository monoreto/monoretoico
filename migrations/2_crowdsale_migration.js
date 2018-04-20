//var MonoretoCrowdsale = artifacts.require("./MonoretoCrowdsale.sol");
// var MonoretoToken = artifacts.require("./MonoretoToken.sol");

const duration = {
    seconds: function(val) { return val},
    minutes: function(val) { return val * this.seconds(60) },
    hours:   function(val) { return val * this.minutes(60) },
    days:    function(val) { return val * this.hours(24) },
    weeks:   function(val) { return val * this.days(7) },
    years:   function(val) { return val * this.days(365)}
};

module.exports = function(deployer, network, accounts) {

	var startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + duration.minutes(1);
	var endTime = startTime + duration.minutes(5);
	var rate = new web3.BigNumber(1e15);
	var goal = new web3.BigNumber(web3.toWei("1", "finney"));
	var cap = new web3.BigNumber(web3.toWei("10", "ether"));
	var wallet = accounts[1];

	if (network == "rinkeby") {
		startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + duration.minutes(1);
	  	endTime = startTime + duration.minutes(5);
	  	rate = new web3.BigNumber(1e15);
	  	goal = new web3.BigNumber(web3.toWei("1", "finney"));
	  	cap = new web3.BigNumber(web3.toWei("10", "ether"));
	  	wallet = accounts[1];
 	} else if (network == "live") {
 		startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + duration.minutes(1);
		endTime = startTime + duration.days(30);
		rate = new web3.BigNumber(1e15);
		goal = new web3.BigNumber(web3.toWei("1", "finney"));
		cap = new web3.BigNumber(web3.toWei("10", "ether"));
		wallet = accounts[1];
 	}

  	// deployer.deploy(MonoretoToken, { overwrite: false });
  	/*deployer.deploy(MonoretoCrowdsale, startTime, endTime, rate, goal, cap, wallet).then(function(instance) {
  		// instance.setBonusTimes();
  	});*/
};
