pragma solidity 0.4.19;

import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Token for Monoreto ICO
 * @dev Monoreto ICO needs an ERC20 token
 */
contract MonoretoToken is CappedToken {
    using SafeMath for uint256;

    string public constant NAME = "Monoreto Token";
    string public constant SYMBOL = "MNR";
    uint8 public constant DECIMALS = 18;

    function MonoretoToken(uint256 _cap) public
        CappedToken(_cap) {

    }

    bool public capAdjusted = false;

    function adjustCap() public onlyOwner {
        require(!capAdjusted);
        capAdjusted = true;

        uint256 percentToAdjust = 6;
        uint256 oneHundredPercent = 100;
        cap = totalSupply().mul(oneHundredPercent).div(percentToAdjust);
    }
}

