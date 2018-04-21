pragma solidity ^0.4.19;

import "./BaseMonoretoCrowdsale.sol";

contract MonoretoIco is BaseMonoretoCrowdsale {

    address public bountyWallet;
    address public teamWallet;

    function MonoretoIco(uint256 _openTime, uint256 _closeTime, uint256 _usdEth, uint256 _usdMnr, uint256 _goal, uint256 _cap, uint256 _tokensTarget, address _ownerWallet, MonoretoToken _token) public
        BaseMonoretoCrowdsale(_tokensTarget, _usdEth, _usdMnr)
	CappedCrowdsale(_cap)
	RefundableCrowdsale(_goal)
	FinalizableCrowdsale()
        TimedCrowdsale(_openTime, _closeTime)
	Crowdsale(1, _ownerWallet, _token) {
	    require(_goal <= _cap);
	    rate = _usdEth.mul(CENT_DECIMALS).div(_usdMnr);
    }

    uint256[] public bonusTimes;
    uint256[] public bonusTimesPercents;

    function getBonusTimes() external view returns(uint256[]) {
        return bonusTimes;
    }

    function getBonusTimesPercents() external view returns(uint256[]) {
        return bonusTimesPercents;
    }

    function setAdditionalWallets(address _teamWallet, address _bountyWallet) public onlyOwner {
	require(_teamWallet != address(0));
	require(_bountyWallet != address(0));

	teamWallet = _teamWallet;
	bountyWallet = _bountyWallet;
    }

    bool private bonusesSet = false;

    function setBonusTimes(uint256[] times, uint256[] values) external onlyOwner onlyWhileOpen {
        require(times.length == values.length);

        for (uint256 i = 0; i < times.length - 1; i++) {
            require(times[i] < times[i + 1]);
        }

        bonusTimes = times;
        bonusTimesPercents = values;

        bonusesSet = true;
    }

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
	super._preValidatePurchase(_beneficiary, _weiAmount);
	require(bonusesSet);
    }

    uint256 private oneHundredPercent = 100;

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
	return _weiAmount.mul(usdEth).mul(CENT_DECIMALS).mul(computeBonusValueInPercents()).div(oneHundredPercent).div(usdMnr);
    }

    /**
     * @dev computes the bonus percent corresponding the current time
     * bonuses must be set, of course.
     */
    function computeBonusValueInPercents() private constant returns(uint256) {
        for (uint i = 0; i < bonusTimes.length; i++) {
            if (now.sub(openingTime) <= bonusTimes[i]) return bonusTimesPercents[i];
        }

        return 100;
    }

    /**
     * @dev ICO finalization function.
     * After the end of ICO token must not be minted again
     * Tokens for project, team and bounty will be distributed
     */
    function finalization() internal {
	require(teamWallet != address(0));
	require(bountyWallet != address(0));

	MonoretoToken castToken = MonoretoToken(token);

	if (goalReached()) {
            uint256 tokenSupply = castToken.cap();

            uint256 projectTokenPercents = 23;
	    uint256 teamTokenPercents = 11;
	    uint256 bountyTokenPercents = 3;

            castToken.mint(wallet, tokenSupply.mul(projectTokenPercents).div(oneHundredPercent));
            castToken.mint(teamWallet, tokenSupply.mul(teamTokenPercents).div(oneHundredPercent));
            castToken.mint(bountyWallet, tokenSupply.mul(bountyTokenPercents).div(oneHundredPercent));
	}

	castToken.finishMinting();

	super.finalization();
    }
}

