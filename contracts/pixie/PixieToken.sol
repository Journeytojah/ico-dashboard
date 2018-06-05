pragma solidity ^0.4.23;


import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/ownership/Whitelist.sol';


contract PixieToken is StandardToken, Whitelist {

  string public constant name = "Pixie Token";

  string public constant symbol = "PXE";

  uint8 public constant decimals = 18;

  uint256 public constant initialSupply = 100000000000 * (10 ** uint256(decimals)); // 100 Billion PXE ^ decimal

  uint256 public constant unlockTime = now.add(4 weeks);

  uint256 public constant windowClose = unlockTime.add(4 weeks);

  address public bridge;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor() public Whitelist() {
    totalSupply_ = initialSupply;
    balances[msg.sender] = initialSupply;
    emit Transfer(0x0, msg.sender, initialSupply);

    // transfer bridge set to msg sender
    bridge = msg.sender;

    // owner is automatically whitelisted
    addAddressToWhitelist(msg.sender);
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    // lock transfers until after ICO completes unless whitelisted
    require(now > unlockTime || whitelist[msg.sender], "Unable to transfer as unlock time not passed or address not whitelisted");
    require(now > windowClose || _to == bridge, "Outside window transfers must be to the transfer account");

    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    // lock transfers until after ICO completes unless whitelisted
    require(now > unlockTime || whitelist[msg.sender], "Unable to transfer as unlock time not passed or address not whitelisted");

    return super.transferFrom(_from, _to, _value);
  }

  function changeBridge(address _new) onlyOwner public {
    bridge = _new;
  }
}
