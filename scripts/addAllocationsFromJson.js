const allocations = require('./allocations.json')
const { default: BigNumber } = require('bignumber.js')
const Contract = require('web3-eth-contract')
const vaultInterface = require('../build/contracts/Vault.json')
const Web3Utils = require('web3-utils')
const fs = require('fs')

const vault = new Contract(vaultInterface.abi);

let totalAmount = new BigNumber(0)

const addresses = []
const amounts = []
const groups = []

for (let allocation of allocations) {
    const address = allocation.address
    const amount = new BigNumber(allocation.amount)
    const group = allocation.group

    
    if(!Web3Utils.isAddress(address)) {
        throw new Error(`Address validation failed for ID: ${row[0]} and address ${address}`)
    }

    addresses.push(address)
    amounts.push(amount)
    groups.push(group)

    totalAmount = totalAmount.plus(amount)
}

let addressBatches = []
let amountBatches = []
let groupBatches = []

const batchSize = 100
const count = addresses.length
const nbrOfBatches = Math.ceil(count / batchSize)

let allocationNbr = 0

let output = ''

for (let batchNbr = 0; batchNbr < nbrOfBatches; batchNbr++) {
    addressBatches[batchNbr] = []
    amountBatches[batchNbr] = []
    groupBatches[batchNbr] = []

    for (
        let _allocationNbr = allocationNbr;
        batchSize * (batchNbr + 1) < count ? _allocationNbr < (batchSize * (batchNbr + 1)) : _allocationNbr < count;
        _allocationNbr++
    ) {
        addressBatches[batchNbr].push(addresses[_allocationNbr])
        amountBatches[batchNbr].push(amounts[_allocationNbr])
        groupBatches[batchNbr].push(groups[_allocationNbr])
        allocationNbr++
    }
    /*
    console.log(`--------- TRANSACTION ${batchNbr} --------------`)
    console.log(vault.methods.addAllocations(
        addressBatches[batchNbr],
        amountBatches[batchNbr],
        groupBatches[batchNbr]
    ).encodeABI())
    */
    output += `--------- TRANSACTION ${batchNbr} -------------- \n \n`
    output += `[\n ${addressBatches[batchNbr].map(address => `\n\t "${address}"`)} \n] \n`
    output += `[\n ${amountBatches[batchNbr].map(nbr => `\n\t "${nbr.toFixed().toString()}"`)} \n] \n`
    output += `[${groupBatches[batchNbr]}] \n \n`
}

fs.writeFileSync('allocationOutputFromJson.txt', output)
