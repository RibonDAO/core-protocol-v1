// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IPool.sol";

contract Pool is IPool {
    using SafeERC20 for IERC20;
    IERC20 public token;

    address public manager;
    address public nonProfitCouncil;

    mapping(address => bool) public nonProfits;
    
    event NonProfitAdded(address nonProfit);
    event NonProfitRemoved(address nonProfit);
    event BalanceIncreased(address promoter, uint256 amount);
    event DonationAdded(
        bytes32 user,
        address integration,
        address nonProfit,
        uint256 amount
    );

    constructor(address _token, address _manager) {
        token = IERC20(_token);
        manager = _manager;
    }

    function addNonProfitToWhitelist(address _nonProfit) public {
        require(msg.sender == manager, "You are not the manager");

        nonProfits[_nonProfit] = true;

        emit NonProfitAdded(_nonProfit);
    }

    function removeNonProfitFromWhitelist(address _nonProfit) public {
        require(msg.sender == manager, "You are not the manager");

        nonProfits[_nonProfit] = false;

        emit NonProfitRemoved(_nonProfit);
    }

    function addBalance(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");

        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit BalanceIncreased(msg.sender, _amount);
    }

    function donateThroughIntegration(
        address _nonProfit,
        address _integration,
        bytes32 _user,
        uint256 _amount
    ) external {
        require(
            msg.sender == manager,
            "You are not the manager"
        );
        require(
            nonProfits[_nonProfit],
            "Not a whitelisted nonprofit"
        );
        require(_amount > 0, "Amount must be greater than 0");

        token.safeTransfer(_nonProfit, _amount);

        emit DonationAdded(_user, _integration, _nonProfit, _amount);
    }
}
