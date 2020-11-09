## XRD Smart Contracts

This project hosts the smart contracts for the Radix ERC20 token, and the unlocking mechanism that
is used to gradually release the tokens over time.


### Get started

1. Clone the repo and enter the project folder.

2. `yarn`

3. `yarn test`



### Technical overview

The Vault is initialized with the address of the ERC20 token.

Token holders are registered in the Vault contract using `allocations`. An address maps to a list of allocations, each containing an `amount`, how many tokens have been `released`, which `group` the allocation belongs to and whether or not the allocation has been `revoked`.

The purpose of `groups` is to be able to separate allocations, so that we can unlock for a specific set of allocations at once.

Before adding allocations, the account that holds the ERC20 tokens has to call `increaseAllowance()` on the token contract. This allows the Vault contract to automatically send tokens to itself that will be eventually be sent to token holders when they release unlocked tokens. The account that holds the tokens also has to be added to the Vault as the `fundingAccount`, so that the Vault knows which account it can get tokens from.

Groups have to be added manually by the Vault contract owner.

When unlocking, a percentage of tokens for every allocation in a specific group gets unlocked. After unlocking a certain amount, tokens can be `released` and sent to the token holder.
