pragma solidity ^0.8.11;
pragma abicoder v2;

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

  mapping(address => bool) public nonProfits;

  event NonProfitAdded(address nonProfit);
  event NonProfitRemoved(address nonProfit);

  event PoolBalanceIncreased(address promoter, uint256 amount);

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

  function isNonProfitOnWhitelist(address _nonProfit)
    public
    view
    returns (bool)
  {
    return nonProfits[_nonProfit];
  }

  function getIntegrationCouncil() public view returns (address) {
    return integrationCouncil;
  }
}
