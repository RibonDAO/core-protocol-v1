// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IPool.sol";
import "./Pool.sol";
import "hardhat/console.sol";

contract Manager {
    using SafeERC20 for IERC20;
    address public integrationCouncil;
    address public nonProfitCouncil;
    address public governanceCouncil;
    uint public poolIncreaseFee;
    uint public directlyContributionFee;

    mapping(address => uint256) public integrationControllers;
    address[] public pools;

    event PoolCreated(address pool, address token);
    event PoolBalanceIncreased(address promoter, address pool, uint amount);
    event NonProfitAdded(address pool, address nonProfit);
    event NonProfitRemoved(address pool, address nonProfit);
    event IntegrationControllerBalanceAdded(address integrationController, uint256 amount);
    event IntegrationControllerBalanceRemoved(address integrationController, uint256 amount);
    event DonationAdded(
        address pool,
        address nonProfit,
        address integrationController,
        string donationBatch,
        uint256 amount
    );

    event NonProfitCouncilChanged(address nonProfitCouncil);
    event IntegrationCouncilChanged(address integrationCouncil);
    event GovernanceCouncilChanged(address governanceCouncil);
    event PoolBalanceTransfered(address pool, address wallet);

    event PoolIncreaseFeeChanged(uint poolIncreaseFee);
    event DirectlyContributionFeeChanged(uint directlyContributionFee);

    constructor(
        address _governanceCouncil,
        address _integrationCouncil,
        address _nonProfitCouncil,
        uint _poolIncreaseFee,
        uint _directlyContributionFee
    ) {
        governanceCouncil = _governanceCouncil;
        integrationCouncil = _integrationCouncil;
        nonProfitCouncil = _nonProfitCouncil;
        poolIncreaseFee = _poolIncreaseFee;
        directlyContributionFee = _directlyContributionFee;
    }

    function createPool(address _token) external returns (address) {
        require(msg.sender == nonProfitCouncil, "You are not the non profit council");
        address pool = address(new Pool(_token, address(this)));
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

    function addPoolBalance(address _pool, uint256 _amount, address _referrer, bool feeable) external {
        require(_amount > 0, "Amount must be greater than 0");
        
        IPool pool = IPool(_pool);
        IERC20 token = IERC20(pool.token());
        uint feeAmount = 0;
        uint poolBalance = token.balanceOf(_pool);

        if(feeable && poolBalance > 0) {        
            uint chargableFee = (_amount * (poolIncreaseFee * 100)) / 10000;
            if (chargableFee > poolBalance) {
                feeAmount = poolBalance;
            } else {
                feeAmount = chargableFee;
            }
            pool.payFee(_referrer, feeAmount);
        }
        
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

    function addIntegrationControllerBalance(address _integrationController, uint256 _amount)
        external
    {
        require(
            msg.sender == integrationCouncil,
            "You are not the integration council"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrationControllers[_integrationController] += _amount;

        emit IntegrationControllerBalanceAdded(_integrationController, _amount);
    }

    function removeIntegrationControllerBalance(address _integrationController, uint256 _amount)
        external
    {
        require(
            msg.sender == integrationCouncil,
            "You are not the integration council"
        );
        require(
            integrationControllers[_integrationController] >= _amount,
            "Balance must be greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrationControllers[_integrationController] -= _amount;

        emit IntegrationControllerBalanceRemoved(_integrationController, _amount);
    }

    function donateThroughIntegration(
        address _pool,
        address _nonProfit,
        address _integrationController,
        string memory _donation_batch,
        uint256 _amount
    ) external {
        require(
            integrationControllers[msg.sender] >= _amount,
            "Balance must greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrationControllers[msg.sender] -= _amount;

        IPool pool = IPool(_pool);
        pool.donateThroughIntegration(_nonProfit, _integrationController, _amount);
        
        emit DonationAdded(_pool, _nonProfit, _integrationController, _donation_batch, _amount);
    }

    function setNonProfitCouncil(address _nonProfitCouncil) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        nonProfitCouncil = _nonProfitCouncil;

        emit NonProfitCouncilChanged(nonProfitCouncil);
    }

    function contributeToNonProfit(
        address _pool,
        address _nonProfit,
        uint256 _amount,
        address _referrer
    ) external {
        require(_amount > 0, "Amount must be greater than 0");
        
        IPool pool = IPool(_pool);
        IERC20 token = IERC20(pool.token());
        uint poolBalance = token.balanceOf(_pool);

        if(poolBalance > 0) {
            uint feeAmount = 0;
            uint chargableFee = (_amount * (directlyContributionFee * 100)) / 10000;
            
            if (chargableFee > poolBalance) {
                feeAmount = poolBalance;
            } else {
                feeAmount = chargableFee;
            }

            pool.payFee(_referrer, feeAmount);
        }

        if (pool.nonProfits(_nonProfit)) {
            token.safeTransferFrom(msg.sender, _nonProfit, _amount);
        } else {
            revert ("Non profit is not whitelisted");
        }
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

    function setPoolIncreaseFee(uint _poolIncreaseFee) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        poolIncreaseFee = _poolIncreaseFee;

        emit PoolIncreaseFeeChanged(poolIncreaseFee);
    }

    function setDirectlyContributionFee(uint _directlyContributionFee) external {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        directlyContributionFee = _directlyContributionFee;

        emit DirectlyContributionFeeChanged(directlyContributionFee);
    }
}
