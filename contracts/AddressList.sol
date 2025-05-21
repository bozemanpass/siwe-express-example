// SPDX-License-Identifier: MIT

pragma solidity ^0.8.00;

contract AddressList {
    address public owner;
    mapping(address => bool) private addressList;

    event AddressAdded(address indexed addr);
    event AddressRemoved(address indexed addr);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addAddress(address addr) external onlyOwner {
        require(!addressList[addr], "Address is already in the list");
        addressList[addr] = true;
        emit AddressAdded(addr);
    }

    function removeAddress(address addr) external onlyOwner {
        require(addressList[addr], "Address is not in the list");
        addressList[addr] = false;
        emit AddressRemoved(addr);
    }

    function isAddressInList(address addr) external view returns (bool) {
        return addressList[addr];
    }
}
