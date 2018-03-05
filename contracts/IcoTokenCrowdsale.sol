pragma solidity ^0.4.19;


import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";


contract IcoTokenCrowdsale is CappedCrowdsale {

  function IcoTokenCrowdsale(uint256 _rate, address _wallet, ERC20 _token, uint256 _cap) public
  Crowdsale(_rate, _wallet, _token)
  CappedCrowdsale(_cap) {}

}
