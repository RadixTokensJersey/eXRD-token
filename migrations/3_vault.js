const Vault = artifacts.require("Vault")
const Token = artifacts.require('eXRD')
const allocations = require('./allocations')

module.exports = async function (deployer, network, accounts) {
    deployer.then(async () => {
        const owner = accounts[0]

        await deployer.deploy(Vault, Token.address, { from: owner })

        const token = await Token.at(Token.address)
        const vault = await Vault.at(Vault.address)

        let addresses = []

        for (let i = 0; i < 10; i++) {
            addresses.push(accounts[0])
        }

        for (let i = 0; i <= 20; i++) {
            await vault.addGroup(`Group ${i}`, { from: owner })
        }

        const batch1 = allocations[0]

        await token.increaseAllowance(Vault.address, batch1.totalAmount, { from: owner })
        await vault.setFundingAccount(owner, { from: owner })

        await vault.addAllocations(
            addresses,
            batch1.amounts,
            batch1.groups,
            { from: owner }
        )
    })
}