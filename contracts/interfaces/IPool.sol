// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPool {
    function token() external view returns(IERC20);
    function donateThroughIntegration(address,address,uint256) external;
    function addNonProfitToWhitelist(address) external;
    function removeNonProfitFromWhitelist(address) external;
    function transferBalance(address) external;
    function payFee(address, uint) external;
}
