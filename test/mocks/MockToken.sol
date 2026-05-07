// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Stripped-down ERC20 used to stand in for cUSD in tests.
contract MockToken is ERC20 {
    constructor() ERC20("Mock cUSD", "mcUSD") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
