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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixedRouteHeuristicGasModelFactory = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const router_sdk_1 = require("@uniswap/router-sdk");
const v2_sdk_1 = require("@uniswap/v2-sdk");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_1 = __importDefault(require("lodash"));
const __1 = require("../../../..");
const util_1 = require("../../../../util");
const amounts_1 = require("../../../../util/amounts");
const gas_factory_helpers_1 = require("../../../../util/gas-factory-helpers");
const gas_model_1 = require("../gas-model");
const v2_heuristic_gas_model_1 = require("../v2/v2-heuristic-gas-model");
const gas_costs_1 = require("../v3/gas-costs");
/**
 * Computes a gas estimate for a mixed route swap using heuristics.
 * Considers number of hops in the route, number of ticks crossed
 * and the typical base cost for a swap.
 *
 * We get the number of ticks crossed in a swap from the MixedRouteQuoterV1
 * contract.
 *
 * We compute gas estimates off-chain because
 *  1/ Calling eth_estimateGas for a swaps requires the caller to have
 *     the full balance token being swapped, and approvals.
 *  2/ Tracking gas used using a wrapper contract is not accurate with Multicall
 *     due to EIP-2929. We would have to make a request for every swap we wanted to estimate.
 *  3/ For V2 we simulate all our swaps off-chain so have no way to track gas used.
 *
 * @export
 * @class MixedRouteHeuristicGasModelFactory
 */
class MixedRouteHeuristicGasModelFactory extends gas_model_1.IOnChainGasModelFactory {
    constructor() {
        super();
    }
    buildGasModel({ chainId, gasPriceWei, pools, quoteToken, v2poolProvider: V2poolProvider, providerConfig, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const usdPool = pools.usdPool;
            // If our quote token is WETH, we don't need to convert our gas use to be in terms
            // of the quote token in order to produce a gas adjusted amount.
            // We do return a gas use in USD however, so we still convert to usd.
            const nativeCurrency = __1.WRAPPED_NATIVE_CURRENCY[chainId];
            if (quoteToken.equals(nativeCurrency)) {
                const estimateGasCost = (routeWithValidQuote) => {
                    const { totalGasCostNativeCurrency, baseGasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig);
                    const token0 = usdPool.token0.address == nativeCurrency.address;
                    const nativeTokenPrice = token0
                        ? usdPool.token0Price
                        : usdPool.token1Price;
                    const gasCostInTermsOfUSD = nativeTokenPrice.quote(totalGasCostNativeCurrency);
                    return {
                        gasEstimate: baseGasUse,
                        gasCostInToken: totalGasCostNativeCurrency,
                        gasCostInUSD: gasCostInTermsOfUSD,
                    };
                };
                return {
                    estimateGasCost,
                };
            }
            // If the quote token is not in the native currency, we convert the gas cost to be in terms of the quote token.
            // We do this by getting the highest liquidity <quoteToken>/<nativeCurrency> pool. eg. <quoteToken>/ETH pool.
            const nativeV3Pool = pools.nativeQuoteTokenV3Pool;
            let nativeV2Pool;
            if (V2poolProvider) {
                /// MixedRoutes
                nativeV2Pool = yield (0, gas_factory_helpers_1.getV2NativePool)(quoteToken, V2poolProvider, providerConfig);
            }
            const usdToken = usdPool.token0.address == nativeCurrency.address
                ? usdPool.token1
                : usdPool.token0;
            const estimateGasCost = (routeWithValidQuote) => {
                const { totalGasCostNativeCurrency, baseGasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig);
                if (!nativeV3Pool && !nativeV2Pool) {
                    util_1.log.info(`Unable to find ${nativeCurrency.symbol} pool with the quote token, ${quoteToken.symbol} to produce gas adjusted costs. Route will not account for gas.`);
                    return {
                        gasEstimate: baseGasUse,
                        gasCostInToken: amounts_1.CurrencyAmount.fromRawAmount(quoteToken, 0),
                        gasCostInUSD: amounts_1.CurrencyAmount.fromRawAmount(usdToken, 0),
                    };
                }
                /// we will use nativeV2Pool for fallback if nativeV3 does not exist or has 0 liquidity
                /// can use ! here because we return above if v3Pool and v2Pool are null
                const nativePool = (!nativeV3Pool || jsbi_1.default.equal(nativeV3Pool.liquidity, jsbi_1.default.BigInt(0))) &&
                    nativeV2Pool
                    ? nativeV2Pool
                    : nativeV3Pool;
                const token0 = nativePool.token0.address == nativeCurrency.address;
                // returns mid price in terms of the native currency (the ratio of quoteToken/nativeToken)
                const nativeTokenPrice = token0
                    ? nativePool.token0Price
                    : nativePool.token1Price;
                let gasCostInTermsOfQuoteToken;
                try {
                    // native token is base currency
                    gasCostInTermsOfQuoteToken = nativeTokenPrice.quote(totalGasCostNativeCurrency);
                }
                catch (err) {
                    util_1.log.info({
                        nativeTokenPriceBase: nativeTokenPrice.baseCurrency,
                        nativeTokenPriceQuote: nativeTokenPrice.quoteCurrency,
                        gasCostInEth: totalGasCostNativeCurrency.currency,
                    }, 'Debug eth price token issue');
                    throw err;
                }
                // true if token0 is the native currency
                const token0USDPool = usdPool.token0.address == nativeCurrency.address;
                // gets the mid price of the pool in terms of the native token
                const nativeTokenPriceUSDPool = token0USDPool
                    ? usdPool.token0Price
                    : usdPool.token1Price;
                let gasCostInTermsOfUSD;
                try {
                    gasCostInTermsOfUSD = nativeTokenPriceUSDPool.quote(totalGasCostNativeCurrency);
                }
                catch (err) {
                    util_1.log.info({
                        usdT1: usdPool.token0.symbol,
                        usdT2: usdPool.token1.symbol,
                        gasCostInNativeToken: totalGasCostNativeCurrency.currency.symbol,
                    }, 'Failed to compute USD gas price');
                    throw err;
                }
                return {
                    gasEstimate: baseGasUse,
                    gasCostInToken: gasCostInTermsOfQuoteToken,
                    gasCostInUSD: gasCostInTermsOfUSD,
                };
            };
            return {
                estimateGasCost: estimateGasCost.bind(this),
            };
        });
    }
    estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig) {
        const totalInitializedTicksCrossed = bignumber_1.BigNumber.from(Math.max(1, lodash_1.default.sum(routeWithValidQuote.initializedTicksCrossedList)));
        /**
         * Since we must make a separate call to multicall for each v3 and v2 section, we will have to
         * add the BASE_SWAP_COST to each section.
         */
        let baseGasUse = bignumber_1.BigNumber.from(0);
        const route = routeWithValidQuote.route;
        const res = (0, router_sdk_1.partitionMixedRouteByProtocol)(route);
        // @ts-ignore
        res.map((section) => {
            if (section.every((pool) => pool instanceof v3_sdk_1.Pool)) {
                baseGasUse = baseGasUse.add((0, gas_costs_1.BASE_SWAP_COST)(chainId));
                baseGasUse = baseGasUse.add((0, gas_costs_1.COST_PER_HOP)(chainId).mul(section.length));
            }
            else if (section.every((pool) => pool instanceof v2_sdk_1.Pair)) {
                baseGasUse = baseGasUse.add(v2_heuristic_gas_model_1.BASE_SWAP_COST);
                baseGasUse = baseGasUse.add(
                /// same behavior in v2 heuristic gas model factory
                v2_heuristic_gas_model_1.COST_PER_EXTRA_HOP.mul(section.length - 1));
            }
        });
        const tickGasUse = (0, gas_costs_1.COST_PER_INIT_TICK)(chainId).mul(totalInitializedTicksCrossed);
        const uninitializedTickGasUse = gas_costs_1.COST_PER_UNINIT_TICK.mul(0);
        // base estimate gas used based on chainId estimates for hops and ticks gas useage
        baseGasUse = baseGasUse.add(tickGasUse).add(uninitializedTickGasUse);
        if (providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.additionalGasOverhead) {
            baseGasUse = baseGasUse.add(providerConfig.additionalGasOverhead);
        }
        const baseGasCostWei = gasPriceWei.mul(baseGasUse);
        const wrappedCurrency = __1.WRAPPED_NATIVE_CURRENCY[chainId];
        const totalGasCostNativeCurrency = amounts_1.CurrencyAmount.fromRawAmount(wrappedCurrency, baseGasCostWei.toString());
        return {
            totalGasCostNativeCurrency,
            totalInitializedTicksCrossed,
            baseGasUse,
        };
    }
}
exports.MixedRouteHeuristicGasModelFactory = MixedRouteHeuristicGasModelFactory;
