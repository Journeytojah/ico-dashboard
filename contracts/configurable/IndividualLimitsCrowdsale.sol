pragma solidity ^0.4.23;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";


/**
 * @title IndividualLimitsCrowdsale
 * @dev Crowdsale with a min and max limit for individuals.
 */
contract IndividualLimitsCrowdsale is Crowdsale {
  using SafeMath for uint256;

  mapping(address => uint256) public contributions;

  uint256 public min;

  uint256 public max;

  /**
   * @dev Constructor - set the required limits
   * @param _min Min amount of wei that must be contributed
   * @param _max Max amount of wei that can be contributed per individual address
   */
  constructor(uint256 _min, uint256 _max) public {
    require(_min > 0);
    require(_max > 0);
    min = _min;
    max = _max;
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the user's funding cap.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);

    require(_weiAmount >= min);
    require(contributions[_beneficiary].add(_weiAmount) <= max);
  }

  /**
   * @dev Extend parent behavior to update user contributions so far
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    super._updatePurchasingState(_beneficiary, _weiAmount);
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount);
  }
}
