const Promise = require('bluebird');

function estimateGas(web3, data) {
  let estimateGasPromisfy = Promise.promisify(web3.eth.estimateGas);
  return estimateGasPromisfy({data: data});
}

function getGasLimit(web3) {
  let getBlockPromsify = Promise.promisify(web3.eth.getBlock);
  return getBlockPromsify('latest').then((block) => block.gasLimit);
}

module.exports = {
  estimateGas: estimateGas,
  getGasLimit: getGasLimit
};
