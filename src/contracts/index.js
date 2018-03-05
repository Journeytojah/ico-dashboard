/* global web3:true */

import contract from 'truffle-contract'

// import artifacts
import icoToken from '../../build/contracts/IcoToken.json'

// create contracts
const IcoToken = contract(icoToken);
IcoToken.setProvider(web3.currentProvider);

export {
  IcoToken
}
