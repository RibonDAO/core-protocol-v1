// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/IManager.sol";
import "../interfaces/IPool.sol";

contract Manager is IManager {
    address public integrationCouncil;
    address public nonProfitCouncil;
    address public governanceCouncil;

    mapping(address => uint256) public integrations;
    event NonProfitAdded(address nonProfit);
    event NonProfitRemoved(address nonProfit);
    event IntegrationBalanceAdded(address integration, uint256 amount);
    event IntegrationBalanceRemoved(address integration, uint256 amount);
    event DonationAdded(
        address pool,
        bytes32 user,
        address integration,
        address nonProfit,
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

    function addNonProfitToWhitelist(address _pool, address _nonProfit) external {
        require(msg.sender == nonProfitCouncil, "You are not the non profit council");

        IPool pool = IPool(_pool);
        pool.addNonProfitToWhitelist(_nonProfit);

        emit NonProfitAdded(_nonProfit);
    }

    function removeNonProfitFromWhitelist(address _pool, address _nonProfit) external {
        require(msg.sender == nonProfitCouncil, "You are not the non profit council");

        IPool pool = IPool(_pool);
        pool.removeNonProfitFromWhitelist(_nonProfit);

        emit NonProfitAdded(_nonProfit);
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
        bytes32 _user,
        uint256 _amount
    ) external {
        require(
            integrations[msg.sender] >= _amount,
            "Balance must greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrations[msg.sender] -= _amount;

        IPool pool = IPool(_pool);
        pool.donateThroughIntegration(_nonProfit, msg.sender, _user, _amount);

        emit DonationAdded(_pool, _user, msg.sender, _nonProfit, _amount);
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

    function setGovernanceCouncil(address _integrationCouncil) external {
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
