// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.11;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DonationToken is ERC20 {
    constructor() ERC20("DonationToken", "DTK") {
        _mint(msg.sender, 1000000000000000000000000);
    }
}