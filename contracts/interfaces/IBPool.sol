// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

interface IBPool {
    function getSpotPrice(address tokenIn, address tokenOut) external view returns (uint spotPrice);

    function swapExactAmountOut(
        address tokenIn,
        uint maxAmountIn,
        address tokenOut,
        uint tokenAmountOut,
        uint maxPrice
    )external returns (uint tokenAmountIn, uint spotPriceAfter);
}


