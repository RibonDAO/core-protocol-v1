// SPDX-License-Identifier: GNU
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IPool.sol";

contract Pool is IPool {
    using SafeERC20 for IERC20;
    IERC20 immutable public token;

    address immutable public manager;

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

    event BalanceTransfered(address wallet, uint amount);

    constructor(address _token, address _manager) {
        token = IERC20(_token);
        manager = _manager;
    }

    function addNonProfitToWhitelist(address _nonProfit) external {
        require(msg.sender == manager, "You are not the manager");

        nonProfits[_nonProfit] = true;

        emit NonProfitAdded(_nonProfit);
    }

    function removeNonProfitFromWhitelist(address _nonProfit) external {
        require(msg.sender == manager, "You are not the manager");

        nonProfits[_nonProfit] = false;

        emit NonProfitRemoved(_nonProfit);
    }

    function addBalance(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), _amount);
        _amount = token.balanceOf(address(this)) - before;

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
        
        uint256 before = token.balanceOf(address(this));
        token.safeTransfer(_nonProfit, _amount); 
        _amount = before - token.balanceOf(address(this)); 

        emit DonationAdded(_user, _integration, _nonProfit, _amount);
    }

    function transferBalance(address _wallet) external {
        require(
            msg.sender == manager,
            "You are not the manager"
        );
        
        uint _amount = token.balanceOf(address(this));
        token.safeTransfer(_wallet, _amount);

        emit BalanceTransfered(_wallet, _amount);
    }
}
