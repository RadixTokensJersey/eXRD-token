pragma solidity ^0.6.8;

import "./Roles.sol";

abstract contract MinterRole {
    using Roles for Roles.Role;

    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    uint256 public mintersCount;
    address[] public mintersArray;

    Roles.Role private _minters;

    modifier onlyMinter() {
        require(isMinter(msg.sender), "MinterRole: caller does not have the Minter role");
        _;
    }

    function isMinter(address account) public view returns (bool) {
        return _minters.has(account);
    }

    function renounceMinter() public {
        _removeMinter(msg.sender);
    }

    function _addMinter(address account) internal {
        mintersCount++;
        mintersArray.push(account);
        _minters.add(account);
        emit MinterAdded(account);
    }

    function _removeMinter(address account) internal {
        uint256 index;

        for(uint256 i = 0; i < mintersArray.length; i++) {
            if(mintersArray[i] == account) {
                index = i;
            }
        }

        mintersArray[index] = mintersArray[mintersArray.length - 1];
        mintersArray.pop();

        mintersCount--;
        _minters.remove(account);
        emit MinterRemoved(account);
    }
}