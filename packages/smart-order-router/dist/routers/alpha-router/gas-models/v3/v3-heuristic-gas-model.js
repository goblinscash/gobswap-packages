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
exports.V3HeuristicGasModelFactory = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const sdk_core_1 = require("@uniswap/sdk-core");
const lodash_1 = __importDefault(require("lodash"));
const __1 = require("../../../..");
const amounts_1 = require("../../../../util/amounts");
const gas_factory_helpers_1 = require("../../../../util/gas-factory-helpers");
const log_1 = require("../../../../util/log");
const methodParameters_1 = require("../../../../util/methodParameters");
const gas_model_1 = require("../gas-model");
const gas_costs_1 = require("./gas-costs");
/**
 * Computes a gas estimate for a V3 swap using heuristics.
 * Considers number of hops in the route, number of ticks crossed
 * and the typical base cost for a swap.
 *
 * We get the number of ticks crossed in a swap from the QuoterV2
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
 * @class V3HeuristicGasModelFactory
 */
class V3HeuristicGasModelFactory extends gas_model_1.IOnChainGasModelFactory {
    constructor() {
        super();
    }
    buildGasModel({ chainId, gasPriceWei, pools, amountToken, quoteToken, l2GasDataProvider, providerConfig, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const l2GasData = l2GasDataProvider
                ? yield l2GasDataProvider.getGasData()
                : undefined;
            const usdPool = pools.usdPool;
            const calculateL1GasFees = (route) => __awaiter(this, void 0, void 0, function* () {
                const swapOptions = {
                    type: __1.SwapType.UNIVERSAL_ROUTER,
                    recipient: '0x0000000000000000000000000000000000000001',
                    deadlineOrPreviousBlockhash: 100,
                    slippageTolerance: new sdk_core_1.Percent(5, 10000),
                };
                let l1Used = bignumber_1.BigNumber.from(0);
                let l1FeeInWei = bignumber_1.BigNumber.from(0);
                const opStackChains = [
                    sdk_core_1.ChainId.OPTIMISM,
                    sdk_core_1.ChainId.OPTIMISM_GOERLI,
                    sdk_core_1.ChainId.BASE,
                    sdk_core_1.ChainId.BASE_GOERLI,
                ];
                if (opStackChains.includes(chainId)) {
                    [l1Used, l1FeeInWei] = this.calculateOptimismToL1SecurityFee(route, swapOptions, l2GasData);
                }
                else if (chainId == sdk_core_1.ChainId.ARBITRUM_ONE ||
                    chainId == sdk_core_1.ChainId.ARBITRUM_GOERLI) {
                    [l1Used, l1FeeInWei] = this.calculateArbitrumToL1SecurityFee(route, swapOptions, l2GasData);
                }
                // wrap fee to native currency
                const nativeCurrency = __1.WRAPPED_NATIVE_CURRENCY[chainId];
                const costNativeCurrency = amounts_1.CurrencyAmount.fromRawAmount(nativeCurrency, l1FeeInWei.toString());
                // convert fee into usd
                const nativeTokenPrice = usdPool.token0.address == nativeCurrency.address
                    ? usdPool.token0Price
                    : usdPool.token1Price;
                const gasCostL1USD = nativeTokenPrice.quote(costNativeCurrency);
                let gasCostL1QuoteToken = costNativeCurrency;
                // if the inputted token is not in the native currency, quote a native/quote token pool to get the gas cost in terms of the quote token
                if (!quoteToken.equals(nativeCurrency)) {
                    const nativePool = pools.nativeQuoteTokenV3Pool;
                    if (!nativePool) {
                        log_1.log.info('Could not find a pool to convert the cost into the quote token');
                        gasCostL1QuoteToken = amounts_1.CurrencyAmount.fromRawAmount(quoteToken, 0);
                    }
                    else {
                        const nativeTokenPrice = nativePool.token0.address == nativeCurrency.address
                            ? nativePool.token0Price
                            : nativePool.token1Price;
                        gasCostL1QuoteToken = nativeTokenPrice.quote(costNativeCurrency);
                    }
                }
                // gasUsedL1 is the gas units used calculated from the bytes of the calldata
                // gasCostL1USD and gasCostL1QuoteToken is the cost of gas in each of those tokens
                return {
                    gasUsedL1: l1Used,
                    gasCostL1USD,
                    gasCostL1QuoteToken,
                };
            });
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
                    calculateL1GasFees,
                };
            }
            // If the quote token is not in the native currency, we convert the gas cost to be in terms of the quote token.
            // We do this by getting the highest liquidity <quoteToken>/<nativeCurrency> pool. eg. <quoteToken>/ETH pool.
            const nativePool = pools.nativeQuoteTokenV3Pool;
            let nativeAmountPool = null;
            if (!amountToken.equals(nativeCurrency)) {
                nativeAmountPool = pools.nativeAmountTokenV3Pool;
            }
            const usdToken = usdPool.token0.address == nativeCurrency.address
                ? usdPool.token1
                : usdPool.token0;
            const estimateGasCost = (routeWithValidQuote) => {
                const { totalGasCostNativeCurrency, baseGasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig);
                let gasCostInTermsOfQuoteToken = null;
                if (nativePool) {
                    const token0 = nativePool.token0.address == nativeCurrency.address;
                    // returns mid price in terms of the native currency (the ratio of quoteToken/nativeToken)
                    const nativeTokenPrice = token0
                        ? nativePool.token0Price
                        : nativePool.token1Price;
                    try {
                        // native token is base currency
                        gasCostInTermsOfQuoteToken = nativeTokenPrice.quote(totalGasCostNativeCurrency);
                    }
                    catch (err) {
                        log_1.log.info({
                            nativeTokenPriceBase: nativeTokenPrice.baseCurrency,
                            nativeTokenPriceQuote: nativeTokenPrice.quoteCurrency,
                            gasCostInEth: totalGasCostNativeCurrency.currency,
                        }, 'Debug eth price token issue');
                        throw err;
                    }
                }
                // we have a nativeAmountPool, but not a nativePool
                else {
                    log_1.log.info(`Unable to find ${nativeCurrency.symbol} pool with the quote token, ${quoteToken.symbol} to produce gas adjusted costs. Using amountToken to calculate gas costs.`);
                }
                // Highest liquidity pool for the non quote token / ETH
                // A pool with the non quote token / ETH should not be required and errors should be handled separately
                if (nativeAmountPool) {
                    // get current execution price (amountToken / quoteToken)
                    const executionPrice = new sdk_core_1.Price(routeWithValidQuote.amount.currency, routeWithValidQuote.quote.currency, routeWithValidQuote.amount.quotient, routeWithValidQuote.quote.quotient);
                    const inputIsToken0 = nativeAmountPool.token0.address == nativeCurrency.address;
                    // ratio of input / native
                    const nativeAmountTokenPrice = inputIsToken0
                        ? nativeAmountPool.token0Price
                        : nativeAmountPool.token1Price;
                    const gasCostInTermsOfAmountToken = nativeAmountTokenPrice.quote(totalGasCostNativeCurrency);
                    // Convert gasCostInTermsOfAmountToken to quote token using execution price
                    const syntheticGasCostInTermsOfQuoteToken = executionPrice.quote(gasCostInTermsOfAmountToken);
                    // Note that the syntheticGasCost being lessThan the original quoted value is not always strictly better
                    // e.g. the scenario where the amountToken/ETH pool is very illiquid as well and returns an extremely small number
                    // however, it is better to have the gasEstimation be almost 0 than almost infinity, as the user will still receive a quote
                    if (gasCostInTermsOfQuoteToken === null ||
                        syntheticGasCostInTermsOfQuoteToken.lessThan(gasCostInTermsOfQuoteToken.asFraction)) {
                        log_1.log.info({
                            nativeAmountTokenPrice: nativeAmountTokenPrice.toSignificant(6),
                            gasCostInTermsOfQuoteToken: gasCostInTermsOfQuoteToken
                                ? gasCostInTermsOfQuoteToken.toExact()
                                : 0,
                            gasCostInTermsOfAmountToken: gasCostInTermsOfAmountToken.toExact(),
                            executionPrice: executionPrice.toSignificant(6),
                            syntheticGasCostInTermsOfQuoteToken: syntheticGasCostInTermsOfQuoteToken.toSignificant(6),
                        }, 'New gasCostInTermsOfQuoteToken calculated with synthetic quote token price is less than original');
                        gasCostInTermsOfQuoteToken = syntheticGasCostInTermsOfQuoteToken;
                    }
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
                    log_1.log.info({
                        usdT1: usdPool.token0.symbol,
                        usdT2: usdPool.token1.symbol,
                        gasCostInNativeToken: totalGasCostNativeCurrency.currency.symbol,
                    }, 'Failed to compute USD gas price');
                    throw err;
                }
                // If gasCostInTermsOfQuoteToken is null, both attempts to calculate gasCostInTermsOfQuoteToken failed (nativePool and amountNativePool)
                if (gasCostInTermsOfQuoteToken === null) {
                    log_1.log.info(`Unable to find ${nativeCurrency.symbol} pool with the quote token, ${quoteToken.symbol}, or amount Token, ${amountToken.symbol} to produce gas adjusted costs. Route will not account for gas.`);
                    return {
                        gasEstimate: baseGasUse,
                        gasCostInToken: amounts_1.CurrencyAmount.fromRawAmount(quoteToken, 0),
                        gasCostInUSD: amounts_1.CurrencyAmount.fromRawAmount(usdToken, 0),
                    };
                }
                return {
                    gasEstimate: baseGasUse,
                    gasCostInToken: gasCostInTermsOfQuoteToken,
                    gasCostInUSD: gasCostInTermsOfUSD,
                };
            };
            return {
                estimateGasCost: estimateGasCost.bind(this),
                calculateL1GasFees,
            };
        });
    }
    estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig) {
        var _a;
        const totalInitializedTicksCrossed = bignumber_1.BigNumber.from(Math.max(1, lodash_1.default.sum(routeWithValidQuote.initializedTicksCrossedList)));
        const totalHops = bignumber_1.BigNumber.from(routeWithValidQuote.route.pools.length);
        let hopsGasUse = (0, gas_costs_1.COST_PER_HOP)(chainId).mul(totalHops);
        // We have observed that this algorithm tends to underestimate single hop swaps.
        // We add a buffer in the case of a single hop swap.
        if (totalHops.eq(1)) {
            hopsGasUse = hopsGasUse.add((0, gas_costs_1.SINGLE_HOP_OVERHEAD)(chainId));
        }
        // Some tokens have extremely expensive transferFrom functions, which causes
        // us to underestimate them by a large amount. For known tokens, we apply an
        // adjustment.
        const tokenOverhead = (0, gas_costs_1.TOKEN_OVERHEAD)(chainId, routeWithValidQuote.route);
        const tickGasUse = (0, gas_costs_1.COST_PER_INIT_TICK)(chainId).mul(totalInitializedTicksCrossed);
        const uninitializedTickGasUse = gas_costs_1.COST_PER_UNINIT_TICK.mul(0);
        // base estimate gas used based on chainId estimates for hops and ticks gas useage
        const baseGasUse = (0, gas_costs_1.BASE_SWAP_COST)(chainId)
            .add(hopsGasUse)
            .add(tokenOverhead)
            .add(tickGasUse)
            .add(uninitializedTickGasUse)
            .add((_a = providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.additionalGasOverhead) !== null && _a !== void 0 ? _a : bignumber_1.BigNumber.from(0));
        const baseGasCostWei = gasPriceWei.mul(baseGasUse);
        const wrappedCurrency = __1.WRAPPED_NATIVE_CURRENCY[chainId];
        const totalGasCostNativeCurrency = amounts_1.CurrencyAmount.fromRawAmount(wrappedCurrency, baseGasCostWei.toString());
        return {
            totalGasCostNativeCurrency,
            totalInitializedTicksCrossed,
            baseGasUse,
        };
    }
    /**
     * To avoid having a call to optimism's L1 security fee contract for every route and amount combination,
     * we replicate the gas cost accounting here.
     */
    calculateOptimismToL1SecurityFee(routes, swapConfig, gasData) {
        const { l1BaseFee, scalar, decimals, overhead } = gasData;
        const route = routes[0];
        const amountToken = route.tradeType == sdk_core_1.TradeType.EXACT_INPUT
            ? route.amount.currency
            : route.quote.currency;
        const outputToken = route.tradeType == sdk_core_1.TradeType.EXACT_INPUT
            ? route.quote.currency
            : route.amount.currency;
        // build trade for swap calldata
        const trade = (0, methodParameters_1.buildTrade)(amountToken, outputToken, route.tradeType, routes);
        const data = (0, methodParameters_1.buildSwapMethodParameters)(trade, swapConfig, sdk_core_1.ChainId.OPTIMISM).calldata;
        const l1GasUsed = (0, gas_factory_helpers_1.getL2ToL1GasUsed)(data, overhead);
        // l1BaseFee is L1 Gas Price on etherscan
        const l1Fee = l1GasUsed.mul(l1BaseFee);
        const unscaled = l1Fee.mul(scalar);
        // scaled = unscaled / (10 ** decimals)
        const scaledConversion = bignumber_1.BigNumber.from(10).pow(decimals);
        const scaled = unscaled.div(scaledConversion);
        return [l1GasUsed, scaled];
    }
    calculateArbitrumToL1SecurityFee(routes, swapConfig, gasData) {
        const { perL2TxFee, perL1CalldataFee } = gasData;
        const route = routes[0];
        const amountToken = route.tradeType == sdk_core_1.TradeType.EXACT_INPUT
            ? route.amount.currency
            : route.quote.currency;
        const outputToken = route.tradeType == sdk_core_1.TradeType.EXACT_INPUT
            ? route.quote.currency
            : route.amount.currency;
        // build trade for swap calldata
        const trade = (0, methodParameters_1.buildTrade)(amountToken, outputToken, route.tradeType, routes);
        const data = (0, methodParameters_1.buildSwapMethodParameters)(trade, swapConfig, sdk_core_1.ChainId.ARBITRUM_ONE).calldata;
        // calculates gas amounts based on bytes of calldata, use 0 as overhead.
        const l1GasUsed = (0, gas_factory_helpers_1.getL2ToL1GasUsed)(data, bignumber_1.BigNumber.from(0));
        // multiply by the fee per calldata and add the flat l2 fee
        let l1Fee = l1GasUsed.mul(perL1CalldataFee);
        l1Fee = l1Fee.add(perL2TxFee);
        return [l1GasUsed, l1Fee];
    }
}
exports.V3HeuristicGasModelFactory = V3HeuristicGasModelFactory;
