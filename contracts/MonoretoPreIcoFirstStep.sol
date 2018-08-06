pragma solidity 0.4.23;

import "./MonoretoPreIcoStep.sol";


/**
 * @title The first step of Monoreto Pre-ICO. Changes the token cap.
 */
contract MonoretoPreIcoFirstStep is MonoretoPreIcoStep {

    function MonoretoPreIcoFirstStep(uint256 _openTime, uint256 _closeTime, uint256 _goal, uint256 _cap,
        uint256 _centWeiRate, uint256 _centMnrRate, 
        uint256 _tokenTarget, uint256 _initialRate, address _ownerWallet, MonoretoToken _token) public
        MonoretoPreIcoStep(_openTime, _closeTime, _goal, _cap, _centWeiRate,
            _centMnrRate, _tokenTarget, _initialRate, _ownerWallet, _token)
    {
        require(_goal <= _cap);
    }

    /**
     * @dev Pre-ICO finalization.
     */
    function finalization() internal {
        MonoretoToken castToken = MonoretoToken(token);
        castToken.adjustCap();

        super.finalization();
    }
}

