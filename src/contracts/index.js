/* global web3:true */

import contract from 'truffle-contract';

// import artifacts
import pixieToken from '../../build/contracts/PixieToken.json';
import pixieCrowdsale from '../../build/contracts/PixieCrowdsale.json';

// create contracts
const PixieToken = contract(pixieToken);
PixieToken.setProvider(web3.currentProvider);

const PixieCrowdsale = contract(pixieCrowdsale);
PixieCrowdsale.setProvider(web3.currentProvider);

export {
  PixieToken,
  PixieCrowdsale
};
