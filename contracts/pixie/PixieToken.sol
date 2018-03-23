pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';


contract PixieToken is StandardToken {

  string public constant name = "Pixie Token";

  string public constant symbol = "PXE";

  uint8 public constant decimals = 18;

  uint256 public constant initialSupply = 100000000000 * (10 ** uint256(decimals)); // 100 Billion PXE to 18 decimal places

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function PixieToken() public {
    totalSupply_ = initialSupply;
    balances[msg.sender] = initialSupply;
    Transfer(0x0, msg.sender, initialSupply);
  }
}
