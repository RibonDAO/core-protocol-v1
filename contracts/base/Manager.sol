// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IPool.sol";
import "./Pool.sol";


contract Manager {
    using SafeERC20 for IERC20;
    address public integrationCouncil;
    address public nonProfitCouncil;
    address public governanceCouncil;

    mapping(address => uint256) public integrations;
    address[] public pools;

    event PoolCreated(address pool, address token);
    event PoolBalanceIncreased(address promoter, address pool, uint amount);
    event NonProfitAdded(address pool, address nonProfit);
    event NonProfitRemoved(address pool, address nonProfit);
    event IntegrationBalanceAdded(address integration, uint256 amount);
    event IntegrationBalanceRemoved(address integration, uint256 amount);
    event DonationAdded(
        address pool,
        address nonProfit,
        address integration,
        string _donation_batch,
        uint256 amount
    );

    event NonProfitCouncilChanged(address nonProfitCouncil);
    event IntegrationCouncilChanged(address integrationCouncil);
    event GovernanceCouncilChanged(address governanceCouncil);
    event PoolBalanceTransfered(address pool, address wallet);

    constructor(
        address _governanceCouncil,
        address _integrationCouncil,
        address _nonProfitCouncil
    ) {
        governanceCouncil = _governanceCouncil;
        integrationCouncil = _integrationCouncil;
        nonProfitCouncil = _nonProfitCouncil;
    }

    function createPool(address _token) external returns (address) {
        require(msg.sender == nonProfitCouncil, "You are not the non profit council");
        address pool = address(new Pool(_token, msg.sender));
        pools.push(pool);
        emit PoolCreated(pool, _token);
        return pool;
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

    function addPoolBalance(address _pool, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        

        IPool pool = IPool(_pool);
        IERC20 token = IERC20(pool.token());
        
        token.safeTransferFrom(msg.sender, _pool, _amount);

        emit PoolBalanceIncreased(msg.sender, _pool, _amount);
    }
    
    function addNonProfitToWhitelist(address _pool, address _nonProfit) external {
        require(msg.sender == nonProfitCouncil, "You are not the non profit council");

        IPool pool = IPool(_pool);
        pool.addNonProfitToWhitelist(_nonProfit);

        emit NonProfitAdded(_pool, _nonProfit);
    }

    function removeNonProfitFromWhitelist(address _pool, address _nonProfit) external {
        require(msg.sender == nonProfitCouncil, "You are not the non profit council");

        IPool pool = IPool(_pool);
        pool.removeNonProfitFromWhitelist(_nonProfit);

        emit NonProfitAdded(_pool, _nonProfit);
    }

    function addIntegrationBalance(address _integration, uint256 _amount)
        external
    {
        require(
            msg.sender == integrationCouncil,
            "You are not the integration council"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrations[_integration] += _amount;

        emit IntegrationBalanceAdded(_integration, _amount);
    }

    function removeIntegrationBalance(address _integration, uint256 _amount)
        external
    {
        require(
            msg.sender == integrationCouncil,
            "You are not the integration council"
        );
        require(
            integrations[_integration] >= _amount,
            "Balance must be greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrations[_integration] -= _amount;

        emit IntegrationBalanceRemoved(_integration, _amount);
    }

    function donateThroughIntegration(
        address _pool,
        address _nonProfit,
        address _integration,
        string memory _donation_batch,
        uint256 _amount
    ) external {
        require(
            integrations[msg.sender] >= _amount,
            "Balance must greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrations[msg.sender] -= _amount;

        IPool pool = IPool(_pool);
        pool.donateThroughIntegration(_nonProfit, _integration, _amount);
        
        emit DonationAdded(_pool, _nonProfit, _integration, _donation_batch, _amount);
    }

    function setNonProfitCouncil(address _nonProfitCouncil) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        nonProfitCouncil = _nonProfitCouncil;

        emit NonProfitCouncilChanged(nonProfitCouncil);
    }

    function setIntegrationCouncil(address _integrationCouncil) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        integrationCouncil = _integrationCouncil;

        emit IntegrationCouncilChanged(integrationCouncil);
    }

    function setGovernanceCouncil(address _governanceCouncil) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        governanceCouncil = _governanceCouncil;

        emit GovernanceCouncilChanged(governanceCouncil);
    }

    function transferPoolBalance(address _pool, address _wallet) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        IPool pool = IPool(_pool);
        pool.transferBalance(_wallet);

        emit PoolBalanceTransfered(_pool, _wallet);
    }
}
