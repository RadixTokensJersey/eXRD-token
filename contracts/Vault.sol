pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./eXRD.sol";

/*
    Stores a record of all allocations, and keeps track of unlocked amounts for different allocation groups.
    
    An allocation consists of a number of total tokens, the amount of already released tokens and an assignment to a group. 
    Allocations are created and funded (sending in tokens) in the same step. A group is a set of allocations that 
    all unlock in the same manner.

    The primary function of the vault contract is to allow the owner of the vault contract to set
    (increase only) the % unlocked (by group), making that % of each individual allocation within the group
    available for release. Releases are initiated by beneficiaries, sending tokens to their ethereum address.

    The owner of the contract also has the ability to revoke individual allocations, causing the
    associated funds to be withdrawn to the owner.
*/

contract Vault is Ownable {
    using SafeMath for uint256;

    eXRD public token;

    event AllocationRegistered(
        address indexed beneficiary,
        uint256 amount,
        uint256 group
    );
    event AllocationFullyReleased(address indexed beneficiary, uint256 allocationIndex);
    event Unlocked(uint256 indexed group, uint256 percentage);
    event Revoked(address indexed beneficiary, uint256 allocationIndex);
    event GroupAdded(string indexed name, uint256 indexed id);
    event Released(address indexed beneficiary, uint256 allocationIndex);
    event FundingAccountSet(address indexed account);

    struct Allocation {
        uint256 amount;
        uint256 released;
        uint256 group;
        bool revoked;
    }

    struct AllocationReference {
        address beneficiary;
        uint256 index;
    }

    struct Group {
        string name;
        bool active;
        uint256 allocationCount;
        mapping(uint256 => AllocationReference) allocations;
    }

    mapping(address => Allocation[]) private beneficiaryAllocations;
    mapping(address => uint256) private nbrOfAllocations;

    address[] private registeredBeneficiaries;
    mapping(address => bool) private isRegistered;

    mapping(uint256 => uint256) private unlockedPercentages;

    mapping(uint256 => Group) private groups;

    uint256 private groupCount;

    address private fundingAccount;

    bool releasesPaused;

    constructor(eXRD token_) public {
        token = token_;
    }

    /*
        Unlock a certain amount of tokens to a group.

        Unlocking happens incrementally using percentages. Every allocation
        for that group will have a percentage of its amount unlocked and ready to be released.
    */
    function unlock(uint256 group_, uint256 percentage_) external onlyOwner {
        require(
            group_ < groupCount,
            "Group does not exist."
        );

        require(
            percentage_ > 0 && percentage_ <= 100,
            "Percentage parameter invalid. Need to be > 0 and <= 100."
        );

        require(
            percentage_ > unlockedPercentages[group_],
            "Percentage has to be increasing."
        );

        unlockedPercentages[group_] = percentage_;

        if (percentage_ == 100) {
            groups[group_].active = false;
        }

        emit Unlocked(group_, percentage_);
    }

    function setFundingAccount(address account_) external onlyOwner {
        require(
            account_ != address(0),
            "Cannot set funding account to the zero address."
        );

        fundingAccount = account_;
        emit FundingAccountSet(account_);
    }

    /*
        Revoke an allocation for a beneficiary.

        This sets the revoke flag in the allocation, preventing more releases.
    */
    function revoke(address beneficiary_, uint256 allocationIndex_)
        external
        onlyOwner
    {
        require(
            beneficiary_ != address(0),
            "Cannot revoke for the zero address."
        );

        require(
            isRegistered[beneficiary_] == true,
            "Beneficiary is not registered."
        );

        require(
            nbrOfAllocations[beneficiary_] > allocationIndex_,
            "Allocation does not exist"
        );

        Allocation storage allocation = beneficiaryAllocations[beneficiary_][allocationIndex_];

        require(
            allocation.revoked == false,
            "Allocation already revoked"
        );

        allocation.revoked = true;
        uint256 toBeReleased = allocation.amount.sub(allocation.released);
        token.transfer(fundingAccount, toBeReleased);

        emit Revoked(beneficiary_, allocationIndex_);
    }

    /*
        Revoke allocations for a set of beneficiaries belonging to a specific group.
    */
    function revokeBeneficiariesInGroup(
        address[] calldata beneficiaries_,
        uint256 group_
    ) external onlyOwner {
        require(
            group_ < groupCount,
            "Group not registered in contract."
        );

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < beneficiaries_.length; i++) {
            address beneficiary = beneficiaries_[i];

            require(
                beneficiary != address(0),
                "Cannot revoke for the zero address."
            );

            require(
                isRegistered[beneficiary] == true,
                "Beneficiary is not registered."
            );

            uint256 allocationCount = nbrOfAllocations[beneficiary];

            for (
                uint256 allocationIndex = 0;
                allocationIndex < allocationCount;
                allocationIndex++
            ) {

                Allocation storage allocation = beneficiaryAllocations[beneficiary][allocationIndex];

                require(
                    allocation.revoked == false,
                    "Allocation already revoked"
                );

                if (allocation.group == group_) {
                    allocation.revoked = true;
                    uint256 toBeReleased = allocation.amount.sub(
                        allocation.released
                    );

                    totalAmount += toBeReleased;

                    emit Revoked(beneficiary, allocationIndex);
                }
            }
        }

        token.transfer(fundingAccount, totalAmount);
    }

    /*
        Revoke all allocations for a specific group.
    */
    function revokeGroup(uint256 group_) external onlyOwner {
        require(
            group_ < groupCount,
            "Group not registered in contract."
        );

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < groups[group_].allocationCount; i++) {
            AllocationReference memory allocationRef = groups[group_].allocations[i];
            Allocation storage allocation = beneficiaryAllocations[allocationRef.beneficiary][allocationRef.index];

            if(allocation.revoked == false) {
                allocation.revoked = true;
                uint256 toBeReleased = allocation.amount.sub(
                    allocation.released
                );

                totalAmount += toBeReleased;

                emit Revoked(allocationRef.beneficiary, allocationRef.index);
            }            
        }

        token.transfer(fundingAccount, totalAmount);
    }

    /*
        Adds a group and increments the group count.
    */  
    function addGroup(string calldata name_) external onlyOwner {
        groups[groupCount] = Group(name_, true, 0);

        emit GroupAdded(name_, groupCount);

        groupCount++;
    }

    /*
        Disable a group, preventing further allocations to be made in that group.
    */
    function disableGroup(uint256 group_) external onlyOwner {
        require(
            group_ < groupCount,
            "Group not registered in contract."
        );

        groups[group_].active = false;
    }

    /*
        Enable a group.
    */
    function enableGroup(uint256 group_) external onlyOwner {
        require(
            group_ < groupCount,
            "Group not registered in contract."
        );

        require(
            unlockedPercentages[group_] < 100,
            "Group has been fully unlocked."
        );

        groups[group_].active = true;
    }

    /*
        Adds a number of allocations.

        Pushes a new allocations to the allocation array for each beneficiary,
        sets the beneficiary as registered, increments nbrOfAllocations for the beneficiary,
        and transfers enough tokens to this contracts to be unlocked.
    */
    function addAllocations(
        address[] calldata beneficiaries_,
        uint256[] calldata amounts_,
        uint256[] calldata groups_
    ) external onlyOwner {
        require(
            beneficiaries_.length == amounts_.length &&
                beneficiaries_.length == groups_.length,
            "Length of input arrays do not match."
        );

        require(
            fundingAccount != address(0),
            "Funding account has to be set before allocating."
        );

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < beneficiaries_.length; i++) {
            require(
                beneficiaries_[i] != address(0),
                "Beneficiary cannot be 0 address."
            );

            require(
                amounts_[i] > 0,
                "Cannot allocate zero amount."
            );

            Group memory registeredGroup = groups[groups_[i]];

            require(
                groups_[i] < groupCount,
                "Group not registered in contract."
            );

            require(registeredGroup.active == true, "Group is not active.");

            // Add new allocation to beneficiary
            beneficiaryAllocations[beneficiaries_[i]].push(Allocation(
                amounts_[i],
                0,
                groups_[i],
                false
            ));
            nbrOfAllocations[beneficiaries_[i]]++;

            // Add reference to the allocation to group allocation array
            groups[groups_[i]].allocations[groups[groups_[i]].allocationCount] = AllocationReference(
                beneficiaries_[i],
                beneficiaryAllocations[beneficiaries_[i]].length - 1
            );
            groups[groups_[i]].allocationCount++;
            
            if(!isRegistered[beneficiaries_[i]]) {
                registeredBeneficiaries.push(beneficiaries_[i]);
            }

            isRegistered[beneficiaries_[i]] = true;

            totalAmount += amounts_[i];

            emit AllocationRegistered(beneficiaries_[i], amounts_[i], groups_[i]);
        }
        
        token.transferFrom(fundingAccount, address(this), totalAmount);
    }

    /*
        Calculates the amount of tokens that can be released for an allocation.
    */
    function releasableAmount(address beneficiary_, uint256 allocationIndex_)
        public
        view
        returns (uint256)
    {
        require(
            isRegistered[beneficiary_] == true,
            "You have to be a registered address in order to release tokens."
        );
        
        require(
            allocationIndex_ < nbrOfAllocations[beneficiary_],
            "No allocation found."
        );

        require(
            beneficiaryAllocations[beneficiary_][allocationIndex_].revoked == false,
            "Allocation has been revoked."
        );

        uint256 amount = beneficiaryAllocations[beneficiary_][allocationIndex_].amount;
        uint256 released = beneficiaryAllocations[beneficiary_][allocationIndex_].released;
        uint256 group = beneficiaryAllocations[beneficiary_][allocationIndex_].group;
        uint256 unlocked = unlockedPercentages[group];

        uint256 amountUnlocked = amount.mul(unlocked).div(100);
        uint256 releasable = amountUnlocked.sub(released);

        return releasable;
    }

    /*
        Sends the tokens that have been unlocked for an allocation to the beneficiary.
    */
    function release(uint256 allocationIndex_) public {
        require(
            isRegistered[msg.sender] == true,
            "You have to be a registered address in order to release tokens."
        );

        require(releasesPaused == false, "Releases have been paused.");

        require(
            allocationIndex_ < nbrOfAllocations[msg.sender],
            "No allocation found."
        );

        Allocation storage allocation = beneficiaryAllocations[msg.sender][allocationIndex_];

        require(allocation.revoked == false, "Allocation has been revoked.");

        require(
            unlockedPercentages[allocation.group] > 0,
            "Group has not has any unlocked tokens yet."
        );

        uint256 releasable = releasableAmount(msg.sender, allocationIndex_);
        
        require(releasable > 0, "Nothing to release");

        allocation.released = allocation.released.add(releasable);

        emit Released(msg.sender, allocationIndex_);

        if (allocation.released == allocation.amount) {
            emit AllocationFullyReleased(msg.sender, allocationIndex_);
        }

        token.transfer(msg.sender, releasable);
    }

    function pauseReleases() external onlyOwner {
        releasesPaused = true;
    }

    function unpauseReleases() external onlyOwner {
        releasesPaused = false;
    }

    function getAllocationInGroup(uint256 group_, uint256 index_) public view returns (
        address,
        uint256
    ) {
        AllocationReference memory allocationRef = groups[group_].allocations[index_];
        return (
            allocationRef.beneficiary,
            allocationRef.index
        );
    }

    function getBeneficiaryAllocations(address beneficiary_, uint256 index_) public view returns (
        uint256 amount,
        uint256 released,
        uint256 group,
        bool revoked
    ) {
        Allocation memory allocation = beneficiaryAllocations[beneficiary_][index_];
        return (
            allocation.amount,
            allocation.released,
            allocation.group,
            allocation.revoked
        );
    }

    function getNbrOfAllocations(address beneficiary_) public view returns (uint256) {
        return nbrOfAllocations[beneficiary_];
    }

    function getRegisteredBeneficiaries(uint256 index_) public view returns (address) {
        return registeredBeneficiaries[index_];
    }

    function getIsRegistered(address beneficiary_) public view returns (bool) {
        return isRegistered[beneficiary_];
    }

    function getUnlockedPercentages(uint256 group_) public view returns (uint256) {
        return unlockedPercentages[group_];
    }

    function getGroup(uint256 group_) public view returns (
        string memory name,
        bool active,
        uint256 allocationCount
    ) {
        Group memory group = groups[group_];
        return (
            group.name,
            group.active,
            group.allocationCount
        );
    }

    function getGroupCount() public view returns (uint256) {
        return groupCount;
    }

    function getFundingAccount() public view returns (address) {
        return fundingAccount;
    }
}
