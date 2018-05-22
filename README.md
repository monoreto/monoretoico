## MONORETO ICO PROJECT

The project uses:
1. Ethereum blockchain as a base of infrastructure
2. Truffle 4.1.3 for testing
3. OpenZeppelin v1.9.0 contracts as a base of source code

### Token summary
1. Current token address: `0x5f824733d130ad85ec5e180368559cc89d14933d`
2. Token symbol: MNR
3. Token decimals: 18

### Project summary
The project consists of ERC20 app token and crowdsale smart contracts for Pre-ICO and ICO.

`contracts/MonoretoToken.sol` contains MNR token smart contract. MNR is a capped token with an option to adjust its cap only once. The adjustment takes the current token supply and makes it equal to 6% of the cap (`cap = tokenSupply * 100 / 6`). This feature is supposed to be used after the pre-ICO for ratio preserving.

`contracts/BaseMonoretoToken.sol` contains the general functionality of the crowdsale (PreICO and ICO):
* It allows to set the ETHUSD and USDMNR rate (USDMNR can be set with 5 significant digits)
* Any payment less than `ETHER_THRESHOLD` will be rejected
* ETHMNR rate is defined as `ETHUSD / USDMNR`
* After the end of crowdsale the ownership of the token instance will be transferred to original owner.

`contracts/MonoretoPreIco.sol` contains the Pre-ICO smart contract. After the end of Pre-ICO cap of MNR token will be adjusted as described earlier.

`contracts/MonoretoIco.sol` contains the ICO smart contract. It adds the time bonuses feature, after finalization it distributes the tokens for the team, project and bounty and forbids any further token emission.

**IMPORTANT: for the proper work of the crowdsale smart contracts they need to take an ownership of the token instance. Use the** `token.transferOwnership()` **method in order to fulfill this requirement**
