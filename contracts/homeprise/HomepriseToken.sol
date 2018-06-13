pragma solidity ^0.4.19;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract HomepriseToken is MintableToken {
    string public name = "Homeprise Token";
    string public symbol = "HPT";
    uint8 public decimals = 18;
}