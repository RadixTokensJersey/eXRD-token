const xlsxFile = require('read-excel-file/node')
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

let rows

(async () => {
    rows = await xlsxFile('allocations_GC.xlsx')

    for (let row of rows) {
        if (row[0] === 'Contributor ID') {
            continue
        }

        const address = row[1]
        let totalString = row[2].toString()
        const total = new BigNumber(totalString).multipliedBy(new BigNumber(10).pow(new BigNumber(18)))

        if (!Web3Utils.isAddress(address)) {
            throw new Error(`Address validation failed for ID: ${row[0]} and address ${address}`)
        }

        addresses.push(address)
        amounts.push(total)
        groups.push(0)

        totalAmount = totalAmount.plus(total)
    }

    let addressBatches = []
    let amountBatches = []
    let groupBatches = []

    const batchSize = 50
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

    fs.writeFileSync('allocationOutputFromExcel.txt', output)
})()