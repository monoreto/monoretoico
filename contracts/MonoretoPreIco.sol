pragma solidity 0.4.19;

import "./BaseMonoretoCrowdsale.sol";


contract MonoretoPreIco is BaseMonoretoCrowdsale {

    function MonoretoPreIco(uint256 _openTime, uint256 _closeTime, uint256 _goal, uint256 _cap,
    uint256 _centWeiRate, uint256 _centMnrRate, 
    uint256 _tokenTarget, address _ownerWallet, MonoretoToken _token) public
        BaseMonoretoCrowdsale(_tokenTarget, _centWeiRate, _centMnrRate)
        CappedCrowdsale(_cap)
        RefundableCrowdsale(_goal)
        FinalizableCrowdsale()
        TimedCrowdsale(_openTime, _closeTime)
        Crowdsale(_centWeiRate.mul(CENT_DECIMALS).div(_centMnrRate), _ownerWallet, _token)
    {
        require(_goal <= _cap);
    }

    /**
     * @dev Pre-ICO finalization. Cap must be adjusted after pre-ico.
     */
    function finalization() internal {
        MonoretoToken castToken = MonoretoToken(token);
        castToken.adjustCap();

        super.finalization();
    }
}

