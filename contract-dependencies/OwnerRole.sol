pragma solidity ^0.6.8;

import "./Roles.sol";

abstract contract OwnerRole {
    using Roles for Roles.Role;

    event OwnerAdded(address indexed account);
    event OwnerRemoved(address indexed account);

    uint256 public ownersCount;
    address[] public ownersArray;

    Roles.Role private _owners;

    modifier onlyOwner() {
        require(isOwner(msg.sender), "OwnerRole: caller does not have the Owner role");
        _;
    }

    function isOwner(address account) public view returns (bool) {
        return _owners.has(account);
    }

    function addOwner(address account) public onlyOwner {
        _addOwner(account);
    }

    function renounceOwner() public {
        _removeOwner(msg.sender);
    }

    function _addOwner(address account) internal {
        ownersCount++;
        ownersArray.push(account);
        _owners.add(account);
        emit OwnerAdded(account);
    }

    function _removeOwner(address account) internal {
        ownersCount--;

        uint256 index;

        for(uint256 i = 0; i < ownersArray.length; i++) {
            if(ownersArray[i] == account) {
                index = i;
            }
        }

        ownersArray[index] = ownersArray[ownersArray.length - 1];
        ownersArray.pop();

        _owners.remove(account);
        emit OwnerRemoved(account);
    }
}