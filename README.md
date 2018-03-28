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

### Code Coverage

* Code coverage performed by [solidity-coverage](https://github.com/sc-forks/solidity-coverage)

* To run code coverage `npm run coverage` - this will produce the following:
 * HTML output in `/coverage`
 * JSON output in `/.coverage.json`
 * Terminal output

## Build for production

To build the application for production, use the build command. A production build will be compiled in the `dist` folder.
```bash
npm run build
```

#### History

* Original project based on https://github.com/wespr/truffle-vue
* Base contracts based on https://github.com/OpenZeppelin/zeppelin-solidity

## Crowdsale and Token Properties

### PixieToken

* Is ERC20 compliant
* Responsible for holding all tokens available on the Pixie platform
* In order for someone to use the `transferFrom()` method, they must be `approve()`'d by the creator of the contract 

* The **token** has the following properties
  * Defines a token `name` - `Pixie Token`
  * Defines a token `symbol` - `PXE`
  * Defines the number of `decimals` the token is divisible by - `18`
  * Defines the total supply of tokens, currently set to 100 billion
    * `initialSupply = 100000000000 * (10 ** uint256(decimals))` - 100 billion `PXE` to 18 decimal places
  * Token lockup - prevents a participant from transferring tokens purchased to before ICO closes
    * This is to prevent someone from using a dex (Decentralised exchange) to trade ICO tokens early 

### Crowdsale

* Responsible for managing ICO token sales

* The **crowdsale** has the following properties
  * Ability to specify **min** & **max** contributions per address (accumulative)
  * Ability to specify **softcap** and **hardcap** in ether
  * Different **exchange rates** for private, pre and normal ICO rounds
    * Each round is defined by a start & end date
  * Ability to define a **open and close date** for the full ICO - tokens cannot be bough until the ICO opens
  * Ability to **withdraw** funds only once the soft cap is reached
    * Token participants can refund payments if the ICO is closed and has not reached its softcap
    * Contract owners cannot withdraw funds until the ICO softcap is reached and the crowdsale is finished
  * Ability to define **whitelisted** address for people who are permitted to participate in the crowdsale
    * If not whitelist is found for the contributor, the transaction is rejected
    * A third party solution for performing KYC/AML is required, the contract simply stores a map of approved addresses
  * The crowdsale is **pausable** which can stop any more contributors from participating in case of error, fault etc

### Deployment Order

* Deploy `PixieToken`

* Deploy `PixieCrowdsale`

* Whitelist the crowdsale account so they can receive tokens
  e.g. `token.addAddressToWhitelist(PixieCrowdsale.address)`
  
* Transfer the number of tokens to the Crowdsale contract for the ICO
  e.g. `token.transfer(PixieCrowdsale.address, crowdsaleSupply)`

* Update the whitelists to include some utility accounts
  e.g. `crowdsale.addManyToWhitelist([_creator, _developers]);`


