// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockToken is ERC20Burnable {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {
        // Initial supply for testing
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    // WETH specific functions
    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    receive() external payable {
        this.deposit();
    }
}