// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

interface IPoolFactory {
    function createPool(address) external returns (address);
    function getPools() external returns (address [] memory);
}
