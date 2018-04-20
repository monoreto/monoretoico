pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";

import "./MonoretoToken.sol";

/**
 * @title Base contract for Monoreto PreICO and ICO
 */
contract BaseMonoretoCrowdsale is CappedCrowdsale, RefundableCrowdsale, MintedCrowdsale {

    uint256 public usdEth;
    uint256 public usdMnr;
    uint256 public tokensPurchased;
    uint256 public tokenTarget;

    /** 
     * @dev USDMNR must be set as actual_value * CENT_DECIMALS
     * @dev example: value 0.2$ per token must be set as 0.2 * CENT_DECIMALS
     */
    uint256 public constant CENT_DECIMALS = 100000;

    // original contract owner, needed for transfering the ownership of token back after the end of crowdsale
    address internal deployer;

    function BaseMonoretoCrowdsale(uint256 _tokenTarget, uint256 _usdEth, uint256 _usdMnr) public
    {
	require(_tokenTarget > 0);
	require(_usdEth > 0);
	require(_usdMnr > 0);

	tokenTarget = _tokenTarget;
	usdEth = _usdEth;
	usdMnr = _usdMnr;

	deployer = msg.sender;
    }

    event UsdEthRateChanged(address indexed changerAddress, uint256 UsdEthRate);
    event UsdMnrRateChanged(address indexed changerAddress, uint256 UsdMnrRate);

    function setUsdEth(uint256 _usdEth) external onlyOwner {
	rate = _usdEth.mul(CENT_DECIMALS).div(usdMnr);
        usdEth = _usdEth;
        UsdEthRateChanged(msg.sender, _usdEth);
    }

    function setUsdMnr(uint256 _usdMnr) external onlyOwner {
	rate = usdEth.mul(CENT_DECIMALS).div(_usdMnr);
        usdMnr = _usdMnr;
        UsdMnrRateChanged(msg.sender, _usdMnr);
    }

    // If amount of wei sent is less than the threshold, revert.
    uint256 private constant THRESHOLD = 100 finney;

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
	require(tokensPurchased + _getTokenAmount(_weiAmount) <= tokenTarget);
	require(_weiAmount >= THRESHOLD);
	super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
	return _weiAmount.mul(usdEth).mul(CENT_DECIMALS).div(usdMnr);
    }

    function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
	super._deliverTokens(_beneficiary, _tokenAmount);
	tokensPurchased = tokensPurchased.add(_tokenAmount);
    }

    function hasClosed() public view returns (bool) {
	return super.hasClosed() || capReached();
    }

    /**
     * @dev overriden template method from FinalizableCrowdsale.
     * Returns the ownership of token to the original owner.
     * The child contract should call super.finalization() 
     * AFTER executing its own finalizing actions.
     */
    function finalization() internal {
	super.finalization();

	MonoretoToken castToken = MonoretoToken(token);
	castToken.transferOwnership(deployer);
    }

}

