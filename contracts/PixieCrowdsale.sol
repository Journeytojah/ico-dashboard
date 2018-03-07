pragma solidity ^0.4.19;


import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

contract PixieCrowdsale is Crowdsale {

  function PixieCrowdsale(uint256 _rate, address _wallet, StandardToken _token) public Crowdsale(_rate, _wallet, _token) {

  }
}
