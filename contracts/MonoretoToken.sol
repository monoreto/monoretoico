pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";

/**
 * @title Token for Monoreto ICO
 * @dev Monoreto ICO needs an ERC20 token
 */
contract MonoretoToken is CappedToken {
    string public constant name = "Monoreto Token";
    string public constant symbol = "MNR";
    uint8 public constant decimals = 18;

    uint8 private constant percentToAdjust = 6;
    uint8 private constant oneHundredPercent = 100;

    function MonoretoToken(uint256 _cap) public
        CappedToken(_cap) {

    }

    bool public capAdjusted = false;

    function adjustCap() public onlyOwner {
	require(!capAdjusted);
	cap = totalSupply().mul(oneHundredPercent).div(percentToAdjust);

	capAdjusted = true;
    }
}

