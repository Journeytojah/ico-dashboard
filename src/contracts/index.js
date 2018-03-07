/* global web3:true */

import contract from 'truffle-contract';

// import artifacts
import abcToken from '../../build/contracts/ABCToken.json';
import abcTokenCrowdsale from '../../build/contracts/ABCTokenCrowdsale.json';

// create contracts
const ABCToken = contract(abcToken);
ABCToken.setProvider(web3.currentProvider);

const ABCTokenCrowdsale = contract(abcTokenCrowdsale);
ABCTokenCrowdsale.setProvider(web3.currentProvider);

export {
  ABCToken,
  ABCTokenCrowdsale
};
