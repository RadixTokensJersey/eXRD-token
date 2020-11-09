const Token = artifacts.require("eXRD")

const eXRD_RESERVE = ''
const SUPPLY = 0

module.exports = async function (deployer, network, accounts) {
    deployer.then(async () => {
        console.log(accounts)
        const owner = accounts[1]

        console.log(owner)

        await deployer.deploy(Token, eXRD_RESERVE, SUPPLY, { from: owner })
    })
}