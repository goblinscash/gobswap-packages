"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRatioAmountIn = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const amounts_1 = require("../../../util/amounts");
function calculateRatioAmountIn(optimalRatio, inputTokenPrice, inputBalance, outputBalance) {
    // formula: amountToSwap = (inputBalance - (optimalRatio * outputBalance)) / ((optimalRatio * inputTokenPrice) + 1))
    const amountToSwapRaw = new sdk_core_1.Fraction(inputBalance.quotient)
        .subtract(optimalRatio.multiply(outputBalance.quotient))
        .divide(optimalRatio.multiply(inputTokenPrice).add(1));
    if (amountToSwapRaw.lessThan(0)) {
        // should never happen since we do checks before calling in
        throw new Error('routeToRatio: insufficient input token amount');
    }
    return amounts_1.CurrencyAmount.fromRawAmount(inputBalance.currency, amountToSwapRaw.quotient);
}
exports.calculateRatioAmountIn = calculateRatioAmountIn;
