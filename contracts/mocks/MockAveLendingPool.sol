// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IAaveLendingPool.sol";

contract MockAaveLendingPool is IAaveLendingPool {
    mapping(address => mapping(address => uint256)) public userBalances;

    event DepositMade(address indexed asset, address indexed user, uint256 amount);
    event WithdrawMade(address indexed asset, address indexed user, uint256 amount);

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16
    ) external payable override {
        if (msg.value > 0) {
            // If ETH was sent, we need to wrap it to the deposit token
            amount = msg.value;
        } else {
            require(
                IERC20(asset).transferFrom(msg.sender, address(this), amount),
                "Transfer failed"
            );
        }
        userBalances[onBehalfOf][asset] += amount;
        emit DepositMade(asset, onBehalfOf, amount);
    }
    
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        uint256 userBalance = userBalances[msg.sender][asset];
        
        if (amount == type(uint256).max) {
            amount = userBalance;
        }

        require(userBalance >= amount, "Insufficient balance");
        require(IERC20(asset).balanceOf(address(this)) >= amount, "Pool has insufficient balance");
        
        userBalances[msg.sender][asset] -= amount;
        require(IERC20(asset).transfer(to, amount), "Transfer failed");
        
        emit WithdrawMade(asset, msg.sender, amount);
        return amount;
    }

    receive() external payable {}

    function getBalance(address user, address asset) external view returns (uint256) {
        return userBalances[user][asset];
    }
}