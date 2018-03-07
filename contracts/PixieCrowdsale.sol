pragma solidity ^0.4.19;


import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";


contract PixieCrowdsale is CappedCrowdsale {

  function PixieCrowdsale(uint256 _rate, address _wallet, StandardToken _token, uint256 _cap)
  public
  Crowdsale(_rate, _wallet, _token)
  CappedCrowdsale(_cap) {
  }
}
