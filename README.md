# ICO Dashboard

An Dapp that simulates a crowdsale - build using `VueJs`, `Web3Js`, and `Truffle` using contracts written in `Solidity` 


## Installation

1. Install [Truffle](http://truffleframework.com) and an Ganache [Ganache Testsuite](https://github.com/trufflesuite/ganache).
	```
	npm install -g truffle
	```

2. Clean, compile and migrate the contracts - use `./clean_compile.sh` 
	```
	npm run clean
	truffle compile
	truffle migrate
	```
	* use `npm run clean` to clean the build directory

3. Run the webpack server for front-end hot reloading. - use `./run_server.sh`

 Smart contract changes do not support hot reloading for now.
	
	```
	npm run start
	```
    
## Tests
To run tests use the following commands

1. Truffle test: `npm run test`

*Tests start their own instance of `testrpc` on port `8546`*

## Build for production

To build the application for production, use the build command. A production build will be compiled in the `dist` folder.
```bash
npm run build
```

#### History

* Original project based on https://github.com/wespr/truffle-vue
* Base contracts based on https://github.com/OpenZeppelin/zeppelin-solidity
