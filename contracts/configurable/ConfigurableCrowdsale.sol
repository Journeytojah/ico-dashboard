pragma solidity ^0.4.19;


import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "./WhitelistedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "./IndividualLimitsCrowdsale.sol";


contract ConfigurableCrowdsale is CappedCrowdsale, WhitelistedCrowdsale, IndividualLimitsCrowdsale, RefundableCrowdsale, Pausable {

  function ConfigurableCrowdsale(
    uint256 _rate,
    address _wallet,
    StandardToken _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _minContribution,
    uint256 _maxContribution,
    uint256 _goal
  )
  public
  Crowdsale(_rate, _wallet, _token)
  CappedCrowdsale(_cap)
  TimedCrowdsale(_openingTime, _closingTime)
  WhitelistedCrowdsale()
  IndividualLimitsCrowdsale(_minContribution, _maxContribution)
  Pausable()
  RefundableCrowdsale(_goal) {
  }

  uint256 public privateSaleCloseTime;

  uint256 public privateSaleRate;

  uint256 public preSaleCloseTime;

  uint256 public preSaleRate;

  /**
   * @dev sets the private & pre sale close times and rates
   */
  function setPrivatePreSaleRates(uint256 _privateSaleCloseTime, uint256 _privateRate, uint256 _preSaleCloseTime, uint256 _preSaleRate)
  public
  onlyOwner {
    // validate private sale
    require(_privateRate > 0);
    require(_privateSaleCloseTime > 0);
    require(_privateSaleCloseTime > openingTime);
    require(_privateSaleCloseTime <= closingTime);

    // validate pre sale
    require(_preSaleRate > 0);
    require(_preSaleCloseTime > 0);
    require(_preSaleCloseTime > privateSaleCloseTime);
    require(_preSaleCloseTime <= closingTime);

    privateSaleRate = _privateRate;
    privateSaleCloseTime = _privateSaleCloseTime;

    preSaleRate = _preSaleRate;
    preSaleCloseTime = _preSaleCloseTime;
  }

  /**
   * @dev Overridden method used to allow different rates for private/pre sale
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    if (now < privateSaleCloseTime) {
      return _weiAmount.mul(privateSaleRate);
    }

    if (now < preSaleCloseTime) {
      return _weiAmount.mul(preSaleRate);
    }

    return _weiAmount.mul(rate);
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

    // enforce private/pre sale rates & times to be set
    require(privateSaleRate != 0);
    require(privateSaleCloseTime != 0);
    require(preSaleRate != 0);
    require(preSaleCloseTime != 0);

    // restrict purchases if paused
    require(!paused);
  }
}
