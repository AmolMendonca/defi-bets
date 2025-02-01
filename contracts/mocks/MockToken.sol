// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20Burnable, Ownable {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
        Ownable()
    {
        // Initial supply for testing
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}