// SPDX-License-Identifier: UNLICENSED

pragma solidity ˆ0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DonationToken is ERC20 {
    constructor() ERC20("DonationToken", "DTK") {
        _mint(msg.sender, 1000000000000000000000000);
    }
}