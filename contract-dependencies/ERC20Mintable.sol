pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MinterRole.sol";
import "./OwnerRole.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
abstract contract ERC20Mintable is ERC20, MinterRole, OwnerRole {
    /**
     * @dev See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the {MinterRole}.
     */
    modifier onlyMinterOrOwner() {
        require(
            isMinter(msg.sender) || isOwner(msg.sender),
            "Caller is not a minter nor an owner."
        );
        _;
    }

    function removeMinter(address account) external onlyOwner {
        _removeMinter(account);
    }

    function addMinter(address account) external onlyOwner {
        _addMinter(account);
    }

    function mint(address account, uint256 amount)
        external
        onlyMinterOrOwner
        returns (bool)
    {
        _mint(account, amount);
        return true;
    }
}
