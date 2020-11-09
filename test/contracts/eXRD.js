const eXRD = artifacts.require("eXRD")
const vectors = require('../_test-vectors')
const BN = require('bn.js')
const { default: BigNumber } = require('bignumber.js')
const { assertThrowsAsync } = require('../_utils')
const { assert } = require('chai')

contract('eXRD', accounts => {
    let token
    let owner = accounts[0]
    let minter = accounts[1]
    let supply = 100000000000

    before(async () => {
        token = await eXRD.new(owner, supply, { from: owner })
        await token.addMinter(minter, { from: owner })
    })

    it('should have the name E-RADIX', async () => {
        const name = await token.name()
        assert.equal(name, 'E-RADIX')
    })

    it('should have 18 decimals', async () => {
        const decimals = await token.decimals()
        assert.equal(decimals, 18)
    })

    it('should mint', async () => {
        const balance = await token.balanceOf(owner)
        assert.isTrue(
            balance.eq(
                new BN(supply).mul(new BN(10).pow(new BN(18)))
            )
        )
    })

    it('should be able to mint more as the owner', async () => {
        const originalBalance = await token.balanceOf(owner)
        await token.mint(owner, 10, { from: owner })
        const newBalance = await token.balanceOf(owner)

        assert.equal(originalBalance.add(new BN(10)).toString(), newBalance.toString())
    })

    it('should be able to mint more as a minter', async () => {
        const originalBalance = await token.balanceOf(minter)
        await token.mint(minter, 10, { from: minter })
        const newBalance = await token.balanceOf(minter)

        assert.equal(originalBalance.add(new BN(10)).toString(), newBalance.toString())
    })

    it('should revert if trying to mint as non-owner/non-minter', async () => {
        await assertThrowsAsync(
            async () => await token.mint(accounts[2], 10, { from: accounts[2] }),
            /.*Caller is not a minter nor an owner.*/ 
        )
    })

    it('should be able to add and remove a minter as the owner', async () => {
        let isMinter = await token.isMinter(accounts[3])

        assert(isMinter === false)

        await token.addMinter(accounts[3], { from: owner })

        isMinter = await token.isMinter(accounts[3])

        assert(isMinter === true)

        await token.removeMinter(accounts[3], { from: owner })

        isMinter = await token.isMinter(accounts[3])

        assert(isMinter === false)
    })

    it('should revert if adding a minter as a non-owner', async () => {
        await assertThrowsAsync(
            async () => await token.addMinter(accounts[2], { from: accounts[1] }),
            /.*OwnerRole: caller does not have the Owner role.*/ 
        )
    })

    it('should be able to remove oneself as a minter', async () => {
        let isMinter = await token.isMinter(minter)

        assert(isMinter === true)

        await token.renounceMinter({ from: minter })

        isMinter = await token.isMinter(minter)

        assert(isMinter === false)

        await token.addMinter(minter, { from: owner })
    })

    it('should be able to burn tokens', async () => {
        await token.transfer(accounts[3], 10, { from: owner })
        const originalBalance = await token.balanceOf(accounts[3])
        await token.burn(10, { from: accounts[3] })
        const newBalance = await token.balanceOf(accounts[3])

        assert.equal(originalBalance.sub(new BN(10)).toString(), newBalance.toString())
    })

    it('should be able to renounce ownership', async () => {
        await token.renoun
    })
})
