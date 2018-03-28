pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import './Whitelist.sol';


contract PixieToken is StandardToken, Whitelist {

  string public constant name = "Pixie Token";

  string public constant symbol = "PXE";

  uint8 public constant decimals = 18;

  uint256 public constant initialSupply = 100000000000 * (10 ** uint256(decimals)); // 100 Billion PXE to 18 decimal places

  uint256 public constant openingTime = now.add(1 minutes);
  uint256 public constant closingTime = openingTime.add(4 weeks);

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function PixieToken() public Whitelist() {
    totalSupply_ = initialSupply;
    balances[msg.sender] = initialSupply;
    Transfer(0x0, msg.sender, initialSupply);

    // owner is automatically whitelisted
    addAddressToWhitelist(msg.sender);
  }

//  function transfer(address _to, uint256 _value) public returns (bool) {
//    // lock transfers until after ICO completes unless whitelisted
//    require(now > closingTime || whitelist[msg.sender]);
//
//    return super.transfer(_to, _value);
//  }
//
//  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
//    // lock transfers until after ICO completes unless whitelisted
//    require(now > closingTime || whitelist[msg.sender]);
//
//    return super.transferFrom(_from, _to, _value);
//  }
}
