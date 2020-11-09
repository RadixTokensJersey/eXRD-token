const BN = require("bn.js")

let amounts = []
let groups = []

for (let i = 0; i < 10; i++) {
    let randomAmount = Math.round(Math.random() * 1000)
    let randomGroup = Math.round(Math.random() * 20)
    amounts.push(new BN(randomAmount).mul(new BN(10).pow(new BN(18))))
    groups.push(randomGroup)
}

let totalAmount = new BN(0)
for (let i = 0; i < amounts.length; i++) {
    totalAmount = totalAmount.add(amounts[i])
}

module.exports = [
    {
        amounts,
        groups,
        totalAmount
    }
]