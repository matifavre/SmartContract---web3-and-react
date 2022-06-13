// waffle > plugin to build smart contract tests
require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity : '0.8.0',
  networks : {
    rinkeby:{
      url : 'http://eth-rinkeby.alchemyapi.io/v2/97LKpa03xojrLVvobQk3PkHxgkvKZA2S',
      accounts: ['7e68298aad0484315675aab14af233c7a62688bc0a1512bde9091e9c0a4de162']
    }
  }
}