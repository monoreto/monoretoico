pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Token for Monoreto ICO
 * @dev Monoreto ICO needs an ERC20 token
 */
contract MonoretoToken is CappedToken {
    using SafeMath for uint256;

    string public constant name = "Monoreto Token";
    string public constant symbol = "MNR";
    uint8 public constant decimals = 18;

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

