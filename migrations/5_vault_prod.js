const Vault = artifacts.require("Vault")
const TOKEN_ADDRESS = ''

module.exports = async function (deployer, network, accounts) {
    console.log(accounts)
    const owner = accounts[2]

    console.log(owner)

    deployer.then(async () => {
        await deployer.deploy(Vault, TOKEN_ADDRESS, { from: owner })
    })
}