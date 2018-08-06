pragma solidity 0.4.23;

import "./BaseMonoretoCrowdsale.sol";


contract MonoretoPreIcoStep is BaseMonoretoCrowdsale {

    function MonoretoPreIcoStep(uint256 _openTime, uint256 _closeTime, uint256 _goal, uint256 _cap,
        uint256 _centWeiRate, uint256 _centMnrRate, 
        uint256 _tokenTarget, uint256 _initialRate, address _ownerWallet, MonoretoToken _token) public
        BaseMonoretoCrowdsale(_tokenTarget, _centWeiRate, _centMnrRate)
        CappedCrowdsale(_cap)
        RefundableCrowdsale(_goal)
        FinalizableCrowdsale()
        TimedCrowdsale(_openTime, _closeTime)
        Crowdsale(_initialRate, _ownerWallet, _token)
    {
        require(_goal <= _cap);
    }

    /**
     * @dev Pre-ICO finalization.
     */
    function finalization() internal {
        super.finalization();
    }
}

