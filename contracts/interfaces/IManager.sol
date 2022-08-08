// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

interface IManager {
    function addIntegrationBalance(address, uint256) external;
    function removeIntegrationBalance(address, uint256) external;
    function setNonProfitCouncil(address) external;
    function setIntegrationCouncil(address) external;
    function donateThroughIntegration(address, address, bytes32, uint256) external;
}
