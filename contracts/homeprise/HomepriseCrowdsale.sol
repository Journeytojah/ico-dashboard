pragma solidity ^0.4.19;

import './HomepriseToken.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';

contract HomepriseCrowdsale is CappedCrowdsale, RefundableCrowdsale, MintedCrowdsale {

  // ICO Stage & Rates
  // ============
  uint[3] public stages = [5, 2, 1];  //The rate for each stage such as [stage_index => rate] (eg. [0 => 5, 1 => 2, ...]). 0 is PreICO
  uint public stage = 0; //By default it's Pre Sale
  // =============

  // Token Distribution
  // =============================
  // uint256 public maxTokens = 100000000000000000000; // There will be total 100 Homeprise Tokens
  uint256 public tokensForEcosystem = 20000000000000000000;
  uint256 public tokensForTeam = 10000000000000000000;
  uint256 public tokensForBounty = 10000000000000000000;
  uint256 public totalTokensForSale = 60000000000000000000; // 60 HPTs will be sold in Crowdsale
  uint256 public totalTokensForSaleDuringPreICO = 20000000000000000000; // 20 out of 60 HPTs will be sold during PreICO
  
  uint256 public tokensForTimelock = 10000000000000000000;
  uint256 public timelockReleaseTime = 1525362763;
  // ==============================

  // Amount raised in PreICO
  // ==================
  uint256 public totalWeiRaisedDuringPreICO;
  // ===================


  // Events
  event EthTransferred(string text);
  event EthRefunded(string text);


  // Constructor
  // ============
  function HomepriseCrowdsale(uint256 _startTime, uint256 _endTime, address _wallet, uint256 _goal, uint256 _cap, MintableToken _token)
  		CappedCrowdsale(_cap)
  		FinalizableCrowdsale()
  		TimedCrowdsale(_startTime, _endTime)
  		RefundableCrowdsale(_goal)
  		Crowdsale(stages[stage], _wallet, _token) public {
      require(_goal <= _cap);
  }
  // =============


  // Crowdsale Stage Management
  // =========================================================

  // Change Crowdsale Stage
  function setCrowdsaleStage(uint value) public onlyOwner {
      require(stages.length >= value);

      stage = value;
      setCurrentRate();
  }

  // Change the current rate
  function setCurrentRate() private {
      rate = stages[stage];
  }

  function getCurrentRate() public pure {
    return rate
  }

  // ================ Stage Management Over =====================

  // Token Purchase
  // =========================
  function () external payable {
      uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(rate);
      if ((stage == 0) && (token.totalSupply() + tokensThatWillBeMintedAfterPurchase > totalTokensForSaleDuringPreICO)) {
        msg.sender.transfer(msg.value); // Refund them
        emit EthRefunded("PreICO Limit Hit");
        return;
      }

      buyTokens(msg.sender);

      if (stage == 0) {
          totalWeiRaisedDuringPreICO = totalWeiRaisedDuringPreICO.add(msg.value);
      }
  }

  function _forwardFunds() internal {
      if (stage == 0) {
          Crowdsale._forwardFunds();
          emit EthTransferred("forwarded funds to wallet");
      } else if (stage > 0) {
          RefundableCrowdsale._forwardFunds();
          emit EthTransferred("forwarded funds to refundable vault");
      }
  }
  // ===========================

  // Finish: Mint Extra Tokens as needed before finalizing the Crowdsale.
  // ====================================================================

  function finish(address _teamFund, address _ecosystemFund, address _bountyFund) public onlyOwner {

      require(!isFinalized);
      uint256 alreadyMinted = token.totalSupply();

      uint256 unsoldTokens = totalTokensForSale - alreadyMinted;
      if (unsoldTokens > 0) {
        tokensForEcosystem = tokensForEcosystem + unsoldTokens;
      }

      _deliverTokens(_teamFund, tokensForTeam);
      _deliverTokens(_ecosystemFund, tokensForEcosystem);
      _deliverTokens(_bountyFund, tokensForBounty);
      _deliverTokens(this, tokensForTimelock);
      finalize();
  }
  // ===============================


  /**
   * @notice Transfers tokens held by timelock to beneficiary.
   */
  function releaseTimelock(address _beneficiary) public onlyOwner {
    require(isFinalized);
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= timelockReleaseTime);
    require(tokensForTimelock > 0);

    assert(token.transfer(_beneficiary, tokensForTimelock));
    tokensForTimelock = 0;
  }


  // REMOVE THIS FUNCTION ONCE YOU ARE READY FOR PRODUCTION
  // USEFUL FOR TESTING `finish()` FUNCTION
  function hasClosed() public view returns (bool) {
    return true;
  }
}