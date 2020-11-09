/*
const Vault = artifacts.require("Vault")
const ERC20FixedSupply = artifacts.require("ERC20FixedSupply")
const BN = require('bignumber.js');
const { assert } = require('chai')
const { assertThrowsAsync } = require('./_utils')

contract('Vault', accounts => {
    const owner = accounts[0]

    describe('Use cases', () => {
        describe('Add allocation, vest 10%, release, vest 20%, release, revoke', () => {
            let token
            let vault

            let beneficiary = accounts[1]
            let amount = new BN(300).times(new BN(10).pow(new BN(18)))
            let group = 0

            before(async () => {
                token = await ERC20FixedSupply.new(owner, 1000000000, { from: owner })
                vault = await Vault.new(token.address, { from: owner })

                await vault.setFundingAccount(owner, { from: owner })
                await token.increaseAllowance(vault.address, amount, { from: owner })

                await vault.addGroup(`Group 0`, { from: owner })
            })

            it('should add allocation', async () => {
                await vault.addAllocations(
                    [beneficiary],
                    [amount],
                    [group]
                )

                const nbrOfAllocations = await vault.nbrOfAllocations(beneficiary)

                assert.equal(nbrOfAllocations.toNumber(), 1)

                const allocation = await vault.beneficiaryAllocations(beneficiary, 0)

                assert.equal(allocation.amount.toString(), amount)
                assert.equal(allocation.group.toNumber(), group)
                assert.equal(allocation.released.toNumber(), 0)
            })

            it('should be impossible to release any tokens', async () => {
                assertThrowsAsync(async () => await vault.release(0, { from: beneficiary }))
            })

            it('should vest 10%', async () => {
                await vault.unlock(group, 10, { from: owner })
                const vested = await vault.unlockedPercentages(group)

                assert.equal(vested.toNumber(), 10)
            })

            it('should be possible to release tokens after vesting', async () => {
                await vault.release(0, { from: beneficiary })
                const allocation = await vault.beneficiaryAllocations(beneficiary, 0)
                const balance = await token.balanceOf(beneficiary)

                assert.equal(allocation.released.toString(), amount.div(100).times(10).toString())
                assert.equal(balance.toString(), amount.div(100).times(10).toString())
            })

            it('should be impossible to release again', async () => {
                assertThrowsAsync(async () => await vault.release(0, { from: beneficiary }))
            })

            it('should vest 20%', async () => {
                await vault.unlock(group, 20, { from: owner })
                const vested = await vault.unlockedPercentages(group)

                assert.equal(vested.toNumber(), 20)
            })

            it('should be possible to release tokens after vesting again', async () => {
                await vault.release(0, { from: beneficiary })
                const allocation = await vault.beneficiaryAllocations(beneficiary, 0)
                const balance = await token.balanceOf(beneficiary)

                assert.equal(allocation.released.toString(), amount.div(100).times(20).toString())
                assert.equal(balance.toString(), amount.div(100).times(20).toString())
            })

            it('should revoke', async () => {
                const ownerBalanceBeforeRevoke = await token.balanceOf(owner)

                await vault.revoke(beneficiary, 0, { from: owner })

                const vaultBalance = await token.balanceOf(vault.address)
                const ownerBalanceAfterRevoke = await token.balanceOf(owner)
                const tokensNotReleased = amount.minus(amount.div(100).times(20)).toString()

                assert.equal(vaultBalance, 0)
                assert.equal(ownerBalanceAfterRevoke.sub(ownerBalanceBeforeRevoke).toString(), tokensNotReleased)
            }) 
        })
    })
})

*/