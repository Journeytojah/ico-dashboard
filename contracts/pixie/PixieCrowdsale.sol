pragma solidity ^0.4.23;

import "./PixieToken.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/utils/RefundVault.sol";

contract PixieCrowdsale is Crowdsale, Pausable {

  event Finalized();

  mapping(address => bool) public whitelist;

  mapping(address => uint256) public contributions;

  bool public isFinalized = false;

  // price per token (no discount)
  uint256 public rate = 453944;

  // FIXME arbitrarily set to one minute until until know start
  uint256 public openingTime = now.add(1 minutes);

  // FIXME - date
  uint256 public closingTime = openingTime.add(4 weeks);

  // FIXME - date
  uint256 public privateSaleCloseTime = openingTime.add(1 weeks);

  // 25% discount
  uint256 public privateSaleRate = 567430;

  // FIXME - date
  uint256 public preSaleCloseTime = openingTime.add(2 weeks);

  // 12.5% discount
  uint256 public preSaleRate = 510687;

  // at a rate of $567.43 per eth - soft cap of 4m (approx)
  uint256 public softCap = 7049 ether;

  // at a rate of $567.43 per eth - soft cap of 50m (approx)
  uint256 public hardCap = 88116 ether;

  // Min contribution of 1 ETH
  uint256 public minimumContribution = 1 ether;

  // FIXME - disable this
  // N.B arbitrarily high for now until we know what
  uint256 public maximumContribution = 50000 ether;

  // refund vault used to hold funds while crowdsale is running
  RefundVault public vault;

  /**
   * @dev Constructs the Crowdsale contract with pre-defined parameter plus params
   *
   * @param _wallet Address where collected funds will be forwarded to
   * @param _token Address of the token being sold
   */
  constructor(address _wallet, PixieToken _token) public Crowdsale(rate, _wallet, _token) {
    vault = new RefundVault(wallet);
  }

  /**
   * @dev Investors can claim refunds here if crowdsale is unsuccessful
   */
  function claimRefund() public {
    require(isFinalized, "Crowdsale not finalised");
    require(!goalReached(), "Crowdsale goal not reached");

    vault.refund(msg.sender);
  }

  /**
   * @dev Checks whether funding goal was reached.
   * @return Whether funding goal was reached
   */
  function goalReached() public view returns (bool) {
    return weiRaised >= softCap;
  }

  /**
   * @dev vault finalization task, called when owner calls finalize()
   */
  function finalization() internal {
    if (goalReached()) {
      vault.close();
    } else {
      vault.enableRefunds();
    }
  }

  /**
   * @dev Overrides Crowdsale fund forwarding, sending funds to vault.
   */
  function _forwardFunds() internal {
    vault.deposit.value(msg.value)(msg.sender);
  }

  /**
   * @dev Must be called after crowdsale ends, to do some extra finalization
   * work. Calls the contract's finalization function.
   */
  function finalize() onlyOwner public {
    require(!isFinalized, "Crowdsale already finalised");
    require(hasClosed(), "Crowdsale already closed");

    finalization();
    emit Finalized();

    isFinalized = true;
  }

  /**
   * @dev Adds single address to whitelist.
   * @param _beneficiary Address to be added to the whitelist
   */
  function addToWhitelist(address _beneficiary) external onlyOwner {
    whitelist[_beneficiary] = true;
  }

  /**
   * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing.
   * @param _beneficiaries Addresses to be added to the whitelist
   */
  function addManyToWhitelist(address[] _beneficiaries) external onlyOwner {
    for (uint256 i = 0; i < _beneficiaries.length; i++) {
      whitelist[_beneficiaries[i]] = true;
    }
  }

  /**
   * @dev Removes single address from whitelist.
   * @param _beneficiary Address to be removed to the whitelist
   */
  function removeFromWhitelist(address _beneficiary) external onlyOwner {
    whitelist[_beneficiary] = false;
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

  /**
   * @dev Checks whether the hard cap has been reached.
   * @return Whether the cap was reached
   */
  function capReached() public view returns (bool) {
    return weiRaised >= hardCap;
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has already elapsed.
   * @return Whether crowdsale period has elapsed
   */
  function hasClosed() public view returns (bool) {
    return now > closingTime;
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
   * @dev Returns current time (from the chain)
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

    require(now >= openingTime && now <= closingTime, "Crowdsale not open");

    require(weiRaised.add(_weiAmount) <= hardCap, "Exceed maximum cap");

    require(_weiAmount >= minimumContribution, "Beneficiary minimum amount not reached");

    require(contributions[_beneficiary].add(_weiAmount) <= maximumContribution, "Beneficiary maximum contribution reached");

    require(whitelist[_beneficiary], "Beneficiary not whitelisted");

    require(!paused, "Contract paused");
  }
}
