pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';


contract ABCToken is MintableToken {
  string public name = "ABC Token";

  string public symbol = "ABC";

  uint8 public decimals = 18;

  function ABCToken() public {}
}