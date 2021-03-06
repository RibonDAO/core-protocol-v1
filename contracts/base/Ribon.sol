// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.14;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Ribon {
  using SafeERC20 for IERC20;
  IERC20 immutable public donationToken;

  address public governanceCouncil;
  address public integrationCouncil;
  address public nonProfitCouncil;

  uint256 public donationPoolBalance;

  mapping(address => bool) public nonProfits;
  mapping(address => uint256) public integrations;

  event NonProfitAdded(address nonProfit);
  event NonProfitRemoved(address nonProfit);
  event PoolBalanceIncreased(address promoter, uint256 amount);
  event IntegrationBalanceAdded(address integration, uint256 amount);
  event IntegrationBalanceRemoved(address integration, uint256 amount);
  event DonationAdded(
    bytes32 user,
    address integration,
    address nonProfit,
    uint256 amount
  );

  event NonProfitCouncilChanged(address nonProfitCouncil);
  event IntegrationCouncilChanged(address integrationCouncil);
  event DonationPoolBalanceTransfered(uint256 amount);

  constructor(
    address _donationToken,
    address _governanceCouncil,
    address _integrationCouncil,
    address _nonProfitCouncil
  ) {
    donationToken = IERC20(_donationToken);
    governanceCouncil = _governanceCouncil;
    integrationCouncil = _integrationCouncil;
    nonProfitCouncil = _nonProfitCouncil;
  }

  function addNonProfitToWhitelist(address _nonProfit) external {
    require(msg.sender == nonProfitCouncil, "You are not the nonprofit council");

    nonProfits[_nonProfit] = true;

    emit NonProfitAdded(_nonProfit);
  }

  function removeNonProfitFromWhitelist(address _nonProfit) external {
    require(msg.sender == nonProfitCouncil, "You are not the nonprofit council");

    nonProfits[_nonProfit] = false;

    emit NonProfitRemoved(_nonProfit);
  }

  function addDonationPoolBalance(uint256 _amount) external {
    require(_amount > 0, "Amount must be greater than 0");

    donationToken.safeTransferFrom(msg.sender, address(this), _amount);
    donationPoolBalance += _amount;

    emit PoolBalanceIncreased(msg.sender, _amount);
  }

  function addIntegrationBalance(address _integration, uint256 _amount)
    external
  {
    require(
      msg.sender == integrationCouncil,
      "You are not the integration council"
    );
    require(
      donationPoolBalance >= _amount,
      "Balance must be greater than amount"
    );
    require(_amount > 0, "Amount must be greater than 0");

    donationPoolBalance -= _amount;
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

    donationPoolBalance += _amount;
    integrations[_integration] -= _amount;

    emit IntegrationBalanceRemoved(_integration, _amount);
  }

  function donateThroughIntegration(
    address _nonProfit,
    bytes32 _user,
    uint256 _amount
  ) external {
    require(
      nonProfits[_nonProfit],
      "Not a whitelisted nonprofit"
    );
    require(
      integrations[msg.sender] >= _amount,
      "Balance must greater than amount"
    );
    require(_amount > 0, "Amount must be greater than 0");

    integrations[msg.sender] -= _amount;

    donationToken.safeTransfer(_nonProfit, _amount);

    emit DonationAdded(_user, msg.sender, _nonProfit, _amount);
  }

  function transferDonationPoolBalance() external {
    require(
      msg.sender == governanceCouncil,
      "You are not the governance council"
    );
    uint amount = donationPoolBalance;
    donationPoolBalance = 0;
    donationToken.safeTransfer(msg.sender, amount);
    
    emit DonationPoolBalanceTransfered(amount);
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
}
