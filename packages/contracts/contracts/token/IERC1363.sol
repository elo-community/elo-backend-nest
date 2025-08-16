// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC1363 {
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);
}
