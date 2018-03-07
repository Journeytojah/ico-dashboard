# ICO Dashboard


## Installation

1. Install [Truffle](http://truffleframework.com) and an Ganache [Ganache Testsuite](https://github.com/trufflesuite/ganache).
	```
	npm install -g truffle
	```

2. Compile and migrate the contracts.
	```
	truffle compile
	truffle migrate
	```
	* use `npm run clean` to clean the build directory

3. Run the webpack server for front-end hot reloading. Smart contract changes do not support hot reloading for now.
	```
	npm run start
	```
    
## Tests
To run tests use the following commands

1. Unit tests: `npm run unit` 

2. Running tuffle smart contract tests `npm run test/truffle`.

3. Alternatively you can tham all in one command. `npm run test`

*Tests start there own instance of `testrpc` on port `8546`*

## Build for production
To build the application for production, use the build command. A production build will be compiled in the `dist` folder.
```bash
npm run build
```

#### History

* Original project based on https://github.com/wespr/truffle-vue
* Contracts based on https://github.com/OpenZeppelin/zeppelin-solidity
