// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Pool.sol";
import "../interfaces/IPoolFactory.sol";

contract PoolFactory is IPoolFactory {
    address immutable public manager;
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
    
    function fetchPools(uint256 _index, uint256 _length) external view returns (address[] memory _pools, uint256 _newIndex) {
        if (_length > pools.length - _index) {
            _length = pools.length - _index;
        }

        _pools = new address[](_length);
        for (uint256 i = 0; i < _length; i++) {
            _pools[i] = pools[_index + i];
        }

        return (_pools, _index + _length);
    }
}
