pragma solidity ^0.4.19;


import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "./IndividualLimitsCrowdsale.sol";


contract PixieCrowdsale is CappedCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale, IndividualLimitsCrowdsale, Pausable {

  function PixieCrowdsale(
    uint256 _rate,
    address _wallet,
    StandardToken _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _minContribution,
    uint256 _maxContribution
  )
  public
  Crowdsale(_rate, _wallet, _token)
  CappedCrowdsale(_cap)
  TimedCrowdsale(_openingTime, _closingTime)
  WhitelistedCrowdsale()
  IndividualLimitsCrowdsale(_minContribution, _maxContribution)
  Pausable() {
  }

  /**
     * @dev gets current time
     * @return the current blocktime
     */
  function getNow() public view returns (uint) {
    return now;
  }

  /**
     * @dev Checks whether the period in which the crowdsale is open has elapsed.
     * @return Whether crowdsale period is open
     */
  function isCrowdsaleOpen() public view returns (bool) {
    return now >= openingTime && now <= closingTime;
  }

  /**
  * @dev Extend parent behavior requiring contract to not be paused.
  * @param _beneficiary Token beneficiary
  * @param _weiAmount Amount of wei contributed
  */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    require(!paused);
  }
}
