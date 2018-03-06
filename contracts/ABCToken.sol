pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';


contract ABCToken is StandardToken {

  string public constant name = "ABC Token";
  string public constant symbol = "ABC";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 50000000;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function ABCToken() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }

}
