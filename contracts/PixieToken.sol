pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';


contract PixieToken is StandardToken {

  string public constant name = "Pixie Token";
  string public constant symbol = "PIX";
  uint8 public constant decimals = 0;

  uint256 public initialSupply;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function PixieToken(uint256 _initialSupply) public {
    initialSupply = _initialSupply;
    totalSupply_ = initialSupply;
    balances[msg.sender] = initialSupply;
    Transfer(0x0, msg.sender, initialSupply);
  }
}
