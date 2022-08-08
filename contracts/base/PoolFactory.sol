// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Pool.sol";
import "../interfaces/IPoolFactory.sol";

contract PoolFactory is IPoolFactory {
    address public manager;
    address[] public pools;

    event PoolCreated(
        address pool,
        address token
    );
    
    constructor(address _manager) {
        manager = _manager;    
    }

    function createPool(address _token) external returns(address pool) {
        require(msg.sender == manager, "You are not the manager");
        pool = address(new Pool(_token, manager));
        pools.push(pool);
        emit PoolCreated(pool, _token);
    }

    function getPools() public view returns(address [] memory) {
        return pools;
    }
}
