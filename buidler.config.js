usePlugin("@nomiclabs/buidler-truffle5")
// usePlugin('buidler-gas-reporter')

module.exports = {
    networks: {
        buidlerevm: {
        },
        rinkeby: {
            url: "",
            accounts: {
                mnemonic
            }
        }
    },
    solc: {
        version: '0.6.8',
    },
};