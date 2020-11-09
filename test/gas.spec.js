
const Vault = artifacts.require("Vault")
const ERC20FixedSupply = artifacts.require("eXRD")
const BN = require('bignumber.js');

contract('Vault', accounts => {
    const owner = accounts[0]
    describe('Gas tests', () => {
        describe('adding allocations', () => {
            let token
            let vault

            let beneficiary = accounts[1]
            let amount = new BN(300).times(new BN(10).pow(new BN(18)))
            let group = 0

            it('should add a lot of allocations', async () => {
                token = await ERC20FixedSupply.new(owner, 1000000000, { from: owner })
                vault = await Vault.new(token.address, { from: owner })

                await vault.addGroup(`Group 0`, { from: owner })

                let beneficiaries = []
                let amounts = []
                let groups = []
                let totalAmount = 0

                for (let i = 0; i < 110; i++) {
                    beneficiaries.push(beneficiary)
                    amounts.push(amount)
                    groups.push(group)
                    totalAmount += amount
                }

                await token.increaseAllowance(vault.address, totalAmount, { from: owner })
                await vault.setFundingAccount(owner, { from: owner })
                await vault.addAllocations(
                    beneficiaries,
                    amounts,
                    groups
                )
            })
        })
    })
})
