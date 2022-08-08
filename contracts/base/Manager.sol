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
    event IntegrationBalanceAdded(address integration, uint256 amount);
    event IntegrationBalanceRemoved(address integration, uint256 amount);
    event DonationAdded(
        address pool,
        bytes32 user,
        address integration,
        address nonProfit,
        uint256 amount
    );

    constructor(
        address _governanceCouncil,
        address _integrationCouncil,
        address _nonProfitCouncil
    ) {
        governanceCouncil = _governanceCouncil;
        integrationCouncil = _integrationCouncil;
        nonProfitCouncil = _nonProfitCouncil;
    }

    function addIntegrationBalance(address _integration, uint256 _amount)
        public
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
        public
    {
        require(
        msg.sender == integrationCouncil,
        "You are not the integration council"
        );
        unchecked{
        require(
            integrations[_integration] >= _amount,
            "Balance must be greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        integrations[_integration] -= _amount;
        }

        emit IntegrationBalanceRemoved(_integration, _amount);
    }

    function donateThroughIntegration(
        address _pool,
        address _nonProfit,
        bytes32 _user,
        uint256 _amount
    ) public {
        require(
            integrations[msg.sender] >= _amount,
            "Balance must greater than amount"
        );
        require(_amount > 0, "Amount must be greater than 0");

        IPool pool = IPool(_pool);
        pool.donateThroughIntegration(_nonProfit, msg.sender, _user, _amount);

        emit DonationAdded(_pool, _user, msg.sender, _nonProfit, _amount);
    }

    function setNonProfitCouncil(address _nonProfitCouncil) public {
        require(
            msg.sender == nonProfitCouncil,
            "You are not the non profit council"
        );

        nonProfitCouncil = _nonProfitCouncil;
    }

    function setIntegrationCouncil(address _integrationCouncil) public {
        require(
            msg.sender == integrationCouncil,
            "You are not the integration council"
        );

        integrationCouncil = _integrationCouncil;
    }

    function setGovernanceCouncil(address _integrationCouncil) public {
        require(
            msg.sender == governanceCouncil,
            "You are not the governance council"
        );

        integrationCouncil = _integrationCouncil;
    }
}
