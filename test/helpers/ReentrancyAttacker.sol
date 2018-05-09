pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "../../contracts/BaseMonoretoCrowdsale.sol";


contract ReentrancyAttacker {
    BaseMonoretoCrowdsale public underTest;

    function ReentrancyAttacker(BaseMonoretoCrowdsale _underTest) public {
        underTest = _underTest;
    }

    event EtherPut(address indexed sender, uint256 currentBalance);
    event FallbackEvent();
    
    function putEther() public payable {
        EtherPut(msg.sender, address(this).balance);
        underTest.transfer(msg.value);
    }

    function attack() public payable {
        RefundableCrowdsale(underTest).claimRefund();
    }

    uint32 public count = 1;

    function () public payable {
        FallbackEvent();
	count++;
	if (count < 10) {
            RefundableCrowdsale(underTest).claimRefund();
        }
    }
}

