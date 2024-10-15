"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unparseFeeAmount = exports.parseFeeAmount = exports.parseAmount = exports.MAX_UINT160 = exports.CurrencyAmount = void 0;
const units_1 = require("@ethersproject/units");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
class CurrencyAmount extends sdk_core_1.CurrencyAmount {
}
exports.CurrencyAmount = CurrencyAmount;
exports.MAX_UINT160 = '0xffffffffffffffffffffffffffffffffffffffff';
// Try to parse a user entered amount for a given token
function parseAmount(value, currency) {
    const typedValueParsed = (0, units_1.parseUnits)(value, currency.decimals).toString();
    return CurrencyAmount.fromRawAmount(currency, jsbi_1.default.BigInt(typedValueParsed));
}
exports.parseAmount = parseAmount;
function parseFeeAmount(feeAmountStr) {
    switch (feeAmountStr) {
        case '10000':
            return v3_sdk_1.FeeAmount.HIGH;
        case '3000':
            return v3_sdk_1.FeeAmount.MEDIUM;
        case '500':
            return v3_sdk_1.FeeAmount.LOW;
        case '100':
            return v3_sdk_1.FeeAmount.LOWEST;
        default:
            throw new Error(`Fee amount ${feeAmountStr} not supported.`);
    }
}
exports.parseFeeAmount = parseFeeAmount;
function unparseFeeAmount(feeAmount) {
    switch (feeAmount) {
        case v3_sdk_1.FeeAmount.HIGH:
            return '10000';
        case v3_sdk_1.FeeAmount.MEDIUM:
            return '3000';
        case v3_sdk_1.FeeAmount.LOW:
            return '500';
        case v3_sdk_1.FeeAmount.LOWEST:
            return '100';
        default:
            throw new Error(`Fee amount ${feeAmount} not supported.`);
    }
}
exports.unparseFeeAmount = unparseFeeAmount;
