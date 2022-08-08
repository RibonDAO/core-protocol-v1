// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

interface IPool {
    function addBalance(uint256) external;
    function donateThroughIntegration(address,address,bytes32,uint256) external;
    function addNonProfitToWhitelist(address _nonProfit) external;
    function removeNonProfitFromWhitelist(address _nonProfit) external;
}
