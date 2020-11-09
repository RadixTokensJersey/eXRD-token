const Token = artifacts.require("eXRD")

module.exports = async function (deployer, network, accounts) {
    deployer.then(async () => {
        const owner = accounts[0]

        await deployer.deploy(Token, owner, 10000000000, { from: owner })
    })
}