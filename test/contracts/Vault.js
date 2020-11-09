const Vault = artifacts.require("Vault")
const ERC20FixedSupply = artifacts.require("eXRD")
const vectors = require('../_test-vectors')
const BN = require('bignumber.js');
const { assert } = require('chai')
const { assertThrowsAsync } = require('../_utils')

contract('Vault', accounts => {
    const owner = accounts[0]

    const addresses = [
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5]
    ]

    const init = async () => {
        const token = await ERC20FixedSupply.new(owner, 1000000000, { from: owner })
        const vault = await Vault.new(token.address, { from: owner })

        let totalAmount = new BN(0)
        for (let i = 0; i < vectors.amounts.length; i++) {
            totalAmount = totalAmount.plus(vectors.amounts[i])
        }

        await token.increaseAllowance(vault.address, totalAmount, { from: owner })
        await vault.setFundingAccount(owner, { from: owner })

        for (let i = 0; i < vectors.groups.length; i++) {
            await vault.addGroup(`Test group ${i}`, { from: owner })
        }

        await vault.addAllocations(
            addresses,
            vectors.amounts,
            vectors.groups,
            { from: owner }
        )

        return {
            token,
            vault
        }
    }


    describe('addAllocations', () => {
        let allocations = []
        let token
        let vault

        before(async () => {
            ({ token, vault } = await init())

            for (let i = 0; i < addresses.length; i++) {
                const allocation = await vault.getBeneficiaryAllocations(addresses[i], 0)
                allocations.push(allocation)
            }
        })

        it('should register allocations', async () => {
            for (let i = 0; i < allocations.length; i++) {
                assert.equal(allocations[i].amount.toString(), vectors.amounts[i].toFixed())
                assert.equal(allocations[i].released, 0)
                assert.equal(allocations[i].group, vectors.groups[i])
            }
        })
        it('should set beneficiary as registered', async () => {
            for (let i = 0; i < addresses.length; i++) {
                const isRegistered = await vault.getIsRegistered(addresses[i])

                assert.equal(isRegistered, true)
            }
        })

        it('should set nbrOfAllocations', async () => {
            for (let address of addresses) {
                let allocationCount = 0
                for (let _address of addresses) {
                    if (address === _address) {
                        allocationCount++
                    }
                }

                const nbrOfAllocations = await vault.getNbrOfAllocations(address)

                assert.equal(nbrOfAllocations, allocationCount)
            }
        })

        it('should revert if sender is not the owner', async () => {
            await token.increaseAllowance(vault.address, 1000000, { from: owner })
            await assertThrowsAsync(
                async () => await vault.addAllocations(
                    ['0xc783df8a850f42e7F7e57013759C285caa701eB6'],
                    [1000000],
                    [vectors.groups[0]],
                    { from: accounts[1] }
                )
            )
        })

        it('should revert if beneficiary is the zero address', async () => {
            await token.increaseAllowance(vault.address, vectors.amounts[0], { from: owner })
            await assertThrowsAsync(
                async () => await vault.addAllocations(
                    ['0x0'],
                    [vectors.amounts[0]],
                    [vectors.groups[0]],
                    { from: owner })
            )
        })

        it('should revert if group is not registered', async () => {
            await token.increaseAllowance(vault.address, vectors.amounts[0], { from: owner })
            await assertThrowsAsync(
                async () => await vault.addAllocations(
                    [addresses[0]],
                    [vectors.amounts[0]],
                    [vectors.groups.length],
                    { from: owner })
            )
        })
    })

    describe('vest', () => {
        let vault

        before(async () => {
            ({ vault } = await init())
        })

        const assertGroupVested = async (group) => {
            for (let percentage = 1; percentage <= 100; percentage++) {
                await vault.unlock(group, percentage, { from: owner })

                for (let i = 0; i < vectors.groups.length; i++) {
                    const nbrOfAllocations = await vault.getNbrOfAllocations(addresses[i])
                    if (vectors.groups[i] === group) {
                        for (let j = 0; j < nbrOfAllocations; j++) {
                            const allocation = await vault.getBeneficiaryAllocations(addresses[i], j)

                            if (allocation.group === group) {
                                const releasable = await vault.releasableAmount(addresses[i], i)
                                assert.equal(releasable.toString(), new BN(vectors.amounts[i]).div(new BN(100)).times(new BN(percentage)).toFixed())
                            }
                        }

                    }
                }
            }
        }

        it('should vest for group 0', async () => {
            await assertGroupVested(0)
        })

        it('should vest for group 1', async () => {
            await assertGroupVested(1)
        })

        it('should vest for group 2', async () => {
            await assertGroupVested(2)
        })
    })

    describe('release', () => {
        let token
        let vault
        let percentage = 10

        before(async () => {
            ({ token, vault } = await init())
            const groupCount = await vault.getGroupCount()

            for (let i = 0; i < groupCount; i++) {
                await vault.unlock(i, percentage, { from: owner })
            }
        })

        it('should be able to release tokens after vesting', async () => {
            for (let i = 0; i < vectors.groups.length; i++) {
                const nbrOfAllocations = await vault.getNbrOfAllocations(addresses[i])

                for (let j = 0; j < nbrOfAllocations; j++) {
                    await vault.release(j, { from: addresses[i] })
                }

                const amount = await token.balanceOf(addresses[i])

                assert.equal(amount.toString(), vectors.amounts[i] * percentage / 100)
            }
        })

        it('should be able to release all tokens after 100% is vested', async () => {
            for (let i = 0; i < addresses.length; i++) {
                await vault.unlock(i, 100, { from: owner })

                const nbrOfAllocations = await vault.getNbrOfAllocations(addresses[i])

                for (let j = 0; j < nbrOfAllocations; j++) {
                    await vault.release(j, { from: addresses[i] })
                }

                const amount = await token.balanceOf(addresses[i])

                assert.equal(amount.toString(), vectors.amounts[i].toFixed())
            }
        })

        it('should revert if allocation has been revoked', async () => {
            await vault.addGroup(`Group ${vectors.groups.length}`)
            await token.increaseAllowance(vault.address, vectors.amounts[0], { from: owner })
            await vault.addAllocations(
                [addresses[0]],
                [vectors.amounts[0]],
                [vectors.groups.length],
                { from: owner }
            )

            const nbrOfAllocations = await vault.getNbrOfAllocations(addresses[0])

            await vault.unlock(vectors.groups.length, 10, { from: owner })
            await vault.revoke(addresses[0], nbrOfAllocations - 1, { from: owner })

            assertThrowsAsync(
                async () => await vault.release(nbrOfAllocations - 1, { from: addresses[0] })
            )
        })
        
        it('should revert if allocation index is invalid', async () => {
            const nbrOfAllocations = await vault.getNbrOfAllocations(addresses[0])
            assertThrowsAsync(
                async () => await vault.release(nbrOfAllocations, { from: addresses[0] })
            )
        })
    })

    describe('revoke', () => {
        before(async () => {
            ({ token, vault } = await init())
        })

        it('should revoke an allocation', async () => {
            const ownerBalanceBeforeRevoke = await token.balanceOf(owner)
            const allocation = await vault.getBeneficiaryAllocations(addresses[0], 0)

            await vault.revoke(addresses[0], 0, { from: owner })

            const ownerBalanceAfterRevoke = await token.balanceOf(owner)
            assert.equal(ownerBalanceAfterRevoke.sub(ownerBalanceBeforeRevoke), allocation.amount.toString())
        })

        it('should revert if not called by owner', async () => {
            await assertThrowsAsync(
                async () => {
                    await vault.revoke(addresses[1], 0, { from: addresses[1] })
                }
            )
        })
    })

    describe('revokeGroup', () => {
        before(async () => {
            ({ token, vault } = await init())
        })

        it('should revoke a group', async () => {
            const ownerBalanceBeforeRevoke = await token.balanceOf(owner)
            const groupNbr = 0
            const group = await vault.getGroup(groupNbr)
            
            let totalAmount = new BN(0)
            for(let i = 0; i < group.allocationCount; i++) {
                const allocationRef = await vault.getAllocationInGroup(groupNbr, i)
                const allocation = await vault.getBeneficiaryAllocations(allocationRef[0], allocationRef[1].toNumber())
                totalAmount = totalAmount.plus(allocation.amount)
            }

            await vault.revokeGroup(0, { from: owner })

            const ownerBalanceAfterRevoke = await token.balanceOf(owner)
            assert.equal(ownerBalanceAfterRevoke.sub(ownerBalanceBeforeRevoke).toString(), totalAmount.toFixed())
        })

        it('should revert if not called by owner', async () => {
            await assertThrowsAsync(
                async () => {
                    await vault.revokeGroup(0, { from: addresses[1] })
                }
            )
        })
    })
})
