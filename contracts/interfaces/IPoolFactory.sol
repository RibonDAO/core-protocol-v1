// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

interface IPoolFactory {
    function createPool(address) external returns (address);
    function getPools() external returns (address [] memory);
    function fetchPools(uint256, uint256) external returns(address [] memory, uint256);
}
