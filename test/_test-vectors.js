const BN = require('bignumber.js');

module.exports = {
    amounts: [
        new BN(300).times(new BN(10).pow(new BN(18))),
        new BN(34.444444444237472347).times(new BN(10).pow(new BN(18))),
        new BN('154111087111233455695939300'),
        new BN(90000000.4).times(new BN(10).pow(new BN(18))),
        new BN(200).times(new BN(10).pow(new BN(18))),
    ],
    groups: [
        0,
        1,
        0,
        2,
        1,
    ],
}
