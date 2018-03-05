pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';


contract IcoToken is MintableToken {
  string public name = "Ico Token";

  string public symbol = "ICOT";

  uint8 public decimals = 18;

  function IcoToken() public {
  }
}
