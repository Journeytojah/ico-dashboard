/* global web3:true */

import contract from 'truffle-contract'

// import artifacts
import icoToken from '../../build/contracts/IcoToken.json'
import icoTokenCrowdsale from '../../build/contracts/IcoTokenCrowdsale.json'

// create contracts
const IcoToken = contract(icoToken);
IcoToken.setProvider(web3.currentProvider);

const IcoTokenCrowdsale = contract(icoTokenCrowdsale);
IcoTokenCrowdsale.setProvider(web3.currentProvider);

export {
  IcoToken,
  IcoTokenCrowdsale
}
