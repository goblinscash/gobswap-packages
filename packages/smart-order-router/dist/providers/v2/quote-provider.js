"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2QuoteProvider = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const sdk_core_1 = require("@uniswap/sdk-core");
const v2_sdk_1 = require("@uniswap/v2-sdk");
const log_1 = require("../../util/log");
const routes_1 = require("../../util/routes");
/**
 * Computes quotes for V2 off-chain. Quotes are computed using the balances
 * of the pools within each route provided.
 *
 * @export
 * @class V2QuoteProvider
 */
class V2QuoteProvider {
    /* eslint-disable @typescript-eslint/no-empty-function */
    constructor() {
    }
    /* eslint-enable @typescript-eslint/no-empty-function */
    getQuotesManyExactIn(amountIns, routes, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getQuotes(amountIns, routes, sdk_core_1.TradeType.EXACT_INPUT, providerConfig);
        });
    }
    getQuotesManyExactOut(amountOuts, routes, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getQuotes(amountOuts, routes, sdk_core_1.TradeType.EXACT_OUTPUT, providerConfig);
        });
    }
    getQuotes(amounts, routes, tradeType, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const routesWithQuotes = [];
            const debugStrs = [];
            for (const route of routes) {
                const amountQuotes = [];
                let insufficientInputAmountErrorCount = 0;
                let insufficientReservesErrorCount = 0;
                for (const amount of amounts) {
                    try {
                        if (tradeType == sdk_core_1.TradeType.EXACT_INPUT) {
                            let outputAmount = amount.wrapped;
                            for (const pair of route.pairs) {
                                [outputAmount] = pair.getOutputAmount(outputAmount, providerConfig.enableFeeOnTransferFeeFetching === true);
                            }
                            amountQuotes.push({
                                amount,
                                quote: bignumber_1.BigNumber.from(outputAmount.quotient.toString()),
                            });
                        }
                        else {
                            let inputAmount = amount.wrapped;
                            for (let i = route.pairs.length - 1; i >= 0; i--) {
                                const pair = route.pairs[i];
                                [inputAmount] = pair.getInputAmount(inputAmount, providerConfig.enableFeeOnTransferFeeFetching === true);
                            }
                            amountQuotes.push({
                                amount,
                                quote: bignumber_1.BigNumber.from(inputAmount.quotient.toString()),
                            });
                        }
                    }
                    catch (err) {
                        // Can fail to get quotes, e.g. throws InsufficientReservesError or InsufficientInputAmountError.
                        if (err instanceof v2_sdk_1.InsufficientInputAmountError) {
                            insufficientInputAmountErrorCount =
                                insufficientInputAmountErrorCount + 1;
                            amountQuotes.push({ amount, quote: null });
                        }
                        else if (err instanceof v2_sdk_1.InsufficientReservesError) {
                            insufficientReservesErrorCount = insufficientReservesErrorCount + 1;
                            amountQuotes.push({ amount, quote: null });
                        }
                        else {
                            throw err;
                        }
                    }
                }
                if (insufficientInputAmountErrorCount > 0 ||
                    insufficientReservesErrorCount > 0) {
                    debugStrs.push(`${[
                        (0, routes_1.routeToString)(route),
                    ]} Input: ${insufficientInputAmountErrorCount} Reserves: ${insufficientReservesErrorCount} }`);
                }
                routesWithQuotes.push([route, amountQuotes]);
            }
            if (debugStrs.length > 0) {
                log_1.log.info({ debugStrs }, `Failed quotes for V2 routes`);
            }
            return {
                routesWithQuotes,
            };
        });
    }
}
exports.V2QuoteProvider = V2QuoteProvider;
