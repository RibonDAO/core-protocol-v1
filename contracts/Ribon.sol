// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.11;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Ribon {
  using SafeERC20 for IERC20;
  IERC20 public donationToken;

  address public integrationCouncil;
  address public nonProfitCouncil;

  uint256 public donationPoolBalance;

  mapping(address => bool) public nonProfits;
  mapping(address => uint256) public integrations;

  event NonProfitAdded(address nonProfit);
  event NonProfitRemoved(address nonProfit);
  event PoolBalanceIncreased(address promoter, uint256 amount);
  event IntegrationBalanceUpdated(address integration, uint256 amount);
  event DonationAdded(
    bytes32 user,
    address integration,
    address nonProfit,
    uint256 amount
  );

  constructor(
    address _donationToken,
    address _integrationCouncil,
    address _nonProfitCouncil
  ) {
    donationToken = IERC20(_donationToken);
    integrationCouncil = _integrationCouncil;
    nonProfitCouncil = _nonProfitCouncil;
  }

  function addNonProfitToWhitelist(address _nonProfit) public {
    require(msg.sender == nonProfitCouncil, "You are not non profit council.");

    nonProfits[_nonProfit] = true;

    emit NonProfitAdded(_nonProfit);
  }

  function removeNonProfitFromWhitelist(address _nonProfit) public {
    require(msg.sender == nonProfitCouncil, "You are not non profit council.");

    nonProfits[_nonProfit] = false;

    emit NonProfitRemoved(_nonProfit);
  }

  function addDonationPoolBalance(uint256 _amount) public payable {
    require(_amount > 0, "Amount should be bigger than 0");

    donationToken.safeTransferFrom(msg.sender, address(this), _amount);

    emit PoolBalanceIncreased(msg.sender, _amount);
  }

  // TODO: create an ownerOff function to validate if is integrationCouncil
  function updateIntegrationBalance(address _integration, uint256 _amount)
    public
  {
    unchecked {
      require(
        donationPoolBalance - _amount >= 0,
        "Donation pool balance should be bigger than 0"
      );
    }
    require(
      msg.sender == integrationCouncil,
      "You are not on the integration council."
    );

    unchecked {
      donationPoolBalance -= _amount;
    }

    integrations[_integration] += _amount;

    emit IntegrationBalanceUpdated(_integration, _amount);
  }

  function donateThroughIntegration(
    address _nonProfit,
    bytes32 _user,
    uint256 _amount
  ) public payable {
    require(
      nonProfits[_nonProfit] == true,
      "Destination is not on non profit whitelist"
    );
    require(
        integrations[msg.sender] >= _amount,
        "Integration balance should be bigger than amount"
    );
    require(_amount > 0, "Amount should be bigger than 0");

    integrations[msg.sender] -= _amount;

    donationToken.safeTransfer(_nonProfit, _amount);

    emit DonationAdded(_user, msg.sender, _nonProfit, _amount);
  }

  function isNonProfitOnWhitelist(address _nonProfit)
    public
    view
    returns (bool)
  {
    return nonProfits[_nonProfit];
  }

  function getIntegrationBalance(address _integration)
    public
    view
    returns (uint256)
  {
    return integrations[_integration];
  }

  function getIntegrationCouncil() public view returns (address) {
    return integrationCouncil;
  }
}
