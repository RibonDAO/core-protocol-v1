// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Pool.sol";

contract PoolFactory {
    address [] public pools;

     event PoolCreated(
        address pool,
        address token
    );

    function createPool(address token, address owner, address nonProfit) external returns(address pool) {
        pool = address(new Pool(token, owner, nonProfit));
        pools.push(pool);
        emit PoolCreated(pool, token);
        return pool;
    }

    function getPools() public view returns(address [] memory) {
        return pools;
    }
}
