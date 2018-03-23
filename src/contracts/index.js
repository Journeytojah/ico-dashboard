/* global web3:true */

import contract from 'truffle-contract';

// PXE Token and Crowdsale

// // import artifacts
// import pixieToken from '../../build/contracts/PixieToken.json';
// import pixieCrowdsale from '../../build/contracts/PixieCrowdsale.json';
//
// // create contracts
// const PixieToken = contract(pixieToken);
// PixieToken.setProvider(web3.currentProvider);
//
// const PixieCrowdsale = contract(pixieCrowdsale);
// PixieCrowdsale.setProvider(web3.currentProvider);
//
// export {
//   PixieToken,
//   PixieCrowdsale
// };

// CON Token and Crowdsale

// import artifacts
import configurableToken from '../../build/contracts/ConfigurableToken.json';
import configurableCrowdsale from '../../build/contracts/ConfigurableCrowdsale.json';

// create contracts
const ConfigurableToken = contract(configurableToken);
ConfigurableToken.setProvider(web3.currentProvider);

const ConfigurableCrowdsale = contract(configurableCrowdsale);
ConfigurableCrowdsale.setProvider(web3.currentProvider);

export {
  ConfigurableToken,
  ConfigurableCrowdsale
};
