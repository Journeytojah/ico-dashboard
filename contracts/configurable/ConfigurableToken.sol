pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';


contract ConfigurableToken is StandardToken {

  string public constant name = "Coinfest Token";
  string public constant symbol = "CFT";

  uint8 public decimals;
  uint256 public initialSupply;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function ConfigurableToken(uint256 _initialSupply, uint8 _decimals) public {
    decimals = _decimals;
    initialSupply = _initialSupply * (10 ** uint256(decimals));
    totalSupply_ = initialSupply;
    balances[msg.sender] = initialSupply;
    Transfer(0x0, msg.sender, initialSupply);
  }
}
