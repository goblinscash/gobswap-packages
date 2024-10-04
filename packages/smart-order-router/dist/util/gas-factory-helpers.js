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
exports.initSwapRouteFromExisting = exports.calculateGasUsed = exports.getL2ToL1GasUsed = exports.calculateOptimismToL1FeeFromCalldata = exports.calculateArbitrumToL1FeeFromCalldata = exports.getGasCostInQuoteToken = exports.getGasCostInNativeCurrency = exports.getGasCostInUSD = exports.getHighestLiquidityV3USDPool = exports.getHighestLiquidityV3NativePool = exports.getV2NativePool = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_1 = __importDefault(require("lodash"));
const routers_1 = require("../routers");
const util_1 = require("../util");
const methodParameters_1 = require("./methodParameters");
function getV2NativePool(token, poolProvider, providerConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const chainId = token.chainId;
        const weth = util_1.WRAPPED_NATIVE_CURRENCY[chainId];
        const poolAccessor = yield poolProvider.getPools([[weth, token]], providerConfig);
        const pool = poolAccessor.getPool(weth, token);
        if (!pool || pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0)) {
            util_1.log.error({
                weth,
                token,
                reserve0: pool === null || pool === void 0 ? void 0 : pool.reserve0.toExact(),
                reserve1: pool === null || pool === void 0 ? void 0 : pool.reserve1.toExact(),
            }, `Could not find a valid WETH V2 pool with ${token.symbol} for computing gas costs.`);
            return null;
        }
        return pool;
    });
}
exports.getV2NativePool = getV2NativePool;
function getHighestLiquidityV3NativePool(token, poolProvider, providerConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const nativeCurrency = util_1.WRAPPED_NATIVE_CURRENCY[token.chainId];
        const nativePools = (0, lodash_1.default)([
            v3_sdk_1.FeeAmount.HIGH,
            v3_sdk_1.FeeAmount.MEDIUM,
            v3_sdk_1.FeeAmount.LOW,
            v3_sdk_1.FeeAmount.LOWEST,
        ])
            .map((feeAmount) => {
            return [nativeCurrency, token, feeAmount];
        })
            .value();
        const poolAccessor = yield poolProvider.getPools(nativePools, providerConfig);
        const pools = (0, lodash_1.default)([
            v3_sdk_1.FeeAmount.HIGH,
            v3_sdk_1.FeeAmount.MEDIUM,
            v3_sdk_1.FeeAmount.LOW,
            v3_sdk_1.FeeAmount.LOWEST,
        ])
            .map((feeAmount) => {
            return poolAccessor.getPool(nativeCurrency, token, feeAmount);
        })
            .compact()
            .value();
        if (pools.length == 0) {
            util_1.log.error({ pools }, `Could not find a ${nativeCurrency.symbol} pool with ${token.symbol} for computing gas costs.`);
            return null;
        }
        const maxPool = pools.reduce((prev, current) => {
            return jsbi_1.default.greaterThan(prev.liquidity, current.liquidity) ? prev : current;
        });
        return maxPool;
    });
}
exports.getHighestLiquidityV3NativePool = getHighestLiquidityV3NativePool;
function getHighestLiquidityV3USDPool(chainId, poolProvider, providerConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const usdTokens = routers_1.usdGasTokensByChain[chainId];
        const wrappedCurrency = util_1.WRAPPED_NATIVE_CURRENCY[chainId];
        if (!usdTokens) {
            throw new Error(`Could not find a USD token for computing gas costs on ${chainId}`);
        }
        const usdPools = (0, lodash_1.default)([
            v3_sdk_1.FeeAmount.HIGH,
            v3_sdk_1.FeeAmount.MEDIUM,
            v3_sdk_1.FeeAmount.LOW,
            v3_sdk_1.FeeAmount.LOWEST,
        ])
            .flatMap((feeAmount) => {
            return lodash_1.default.map(usdTokens, (usdToken) => [
                wrappedCurrency,
                usdToken,
                feeAmount,
            ]);
        })
            .value();
        const poolAccessor = yield poolProvider.getPools(usdPools, providerConfig);
        const pools = (0, lodash_1.default)([
            v3_sdk_1.FeeAmount.HIGH,
            v3_sdk_1.FeeAmount.MEDIUM,
            v3_sdk_1.FeeAmount.LOW,
            v3_sdk_1.FeeAmount.LOWEST,
        ])
            .flatMap((feeAmount) => {
            const pools = [];
            for (const usdToken of usdTokens) {
                const pool = poolAccessor.getPool(wrappedCurrency, usdToken, feeAmount);
                if (pool) {
                    pools.push(pool);
                }
            }
            return pools;
        })
            .compact()
            .value();
        if (pools.length == 0) {
            const message = `Could not find a USD/${wrappedCurrency.symbol} pool for computing gas costs.`;
            util_1.log.error({ pools }, message);
            throw new Error(message);
        }
        const maxPool = pools.reduce((prev, current) => {
            return jsbi_1.default.greaterThan(prev.liquidity, current.liquidity) ? prev : current;
        });
        return maxPool;
    });
}
exports.getHighestLiquidityV3USDPool = getHighestLiquidityV3USDPool;
function getGasCostInUSD(usdPool, costNativeCurrency) {
    const nativeCurrency = costNativeCurrency.currency;
    // convert fee into usd
    const nativeTokenPrice = usdPool.token0.address == nativeCurrency.address
        ? usdPool.token0Price
        : usdPool.token1Price;
    const gasCostUSD = nativeTokenPrice.quote(costNativeCurrency);
    return gasCostUSD;
}
exports.getGasCostInUSD = getGasCostInUSD;
function getGasCostInNativeCurrency(nativeCurrency, gasCostInWei) {
    // wrap fee to native currency
    const costNativeCurrency = sdk_core_1.CurrencyAmount.fromRawAmount(nativeCurrency, gasCostInWei.toString());
    return costNativeCurrency;
}
exports.getGasCostInNativeCurrency = getGasCostInNativeCurrency;
function getGasCostInQuoteToken(quoteToken, nativePool, costNativeCurrency) {
    return __awaiter(this, void 0, void 0, function* () {
        const nativeTokenPrice = nativePool.token0.address === quoteToken.address
            ? nativePool.token1Price
            : nativePool.token0Price;
        const gasCostQuoteToken = nativeTokenPrice.quote(costNativeCurrency); // Explicit type annotation
        return gasCostQuoteToken;
    });
}
exports.getGasCostInQuoteToken = getGasCostInQuoteToken;
function calculateArbitrumToL1FeeFromCalldata(calldata, gasData) {
    const { perL2TxFee, perL1CalldataFee } = gasData;
    // calculates gas amounts based on bytes of calldata, use 0 as overhead.
    const l1GasUsed = getL2ToL1GasUsed(calldata, bignumber_1.BigNumber.from(0));
    // multiply by the fee per calldata and add the flat l2 fee
    let l1Fee = l1GasUsed.mul(perL1CalldataFee);
    l1Fee = l1Fee.add(perL2TxFee);
    return [l1GasUsed, l1Fee];
}
exports.calculateArbitrumToL1FeeFromCalldata = calculateArbitrumToL1FeeFromCalldata;
function calculateOptimismToL1FeeFromCalldata(calldata, gasData) {
    const { l1BaseFee, scalar, decimals, overhead } = gasData;
    const l1GasUsed = getL2ToL1GasUsed(calldata, overhead);
    // l1BaseFee is L1 Gas Price on etherscan
    const l1Fee = l1GasUsed.mul(l1BaseFee);
    const unscaled = l1Fee.mul(scalar);
    // scaled = unscaled / (10 ** decimals)
    const scaledConversion = bignumber_1.BigNumber.from(10).pow(decimals);
    const scaled = unscaled.div(scaledConversion);
    return [l1GasUsed, scaled];
}
exports.calculateOptimismToL1FeeFromCalldata = calculateOptimismToL1FeeFromCalldata;
// based on the code from the optimism OVM_GasPriceOracle contract
function getL2ToL1GasUsed(data, overhead) {
    // data is hex encoded
    const dataArr = data.slice(2).match(/.{1,2}/g);
    const numBytes = dataArr.length;
    let count = 0;
    for (let i = 0; i < numBytes; i += 1) {
        const byte = parseInt(dataArr[i], 16);
        if (byte == 0) {
            count += 4;
        }
        else {
            count += 16;
        }
    }
    const unsigned = overhead.add(count);
    const signedConversion = 68 * 16;
    return unsigned.add(signedConversion);
}
exports.getL2ToL1GasUsed = getL2ToL1GasUsed;
function calculateGasUsed(chainId, route, simulatedGasUsed, v2PoolProvider, v3PoolProvider, l2GasData, providerConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const quoteToken = route.quote.currency.wrapped;
        const gasPriceWei = route.gasPriceWei;
        // calculate L2 to L1 security fee if relevant
        let l2toL1FeeInWei = bignumber_1.BigNumber.from(0);
        if ([sdk_core_1.ChainId.ARBITRUM_ONE, sdk_core_1.ChainId.ARBITRUM_GOERLI].includes(chainId)) {
            l2toL1FeeInWei = calculateArbitrumToL1FeeFromCalldata(route.methodParameters.calldata, l2GasData)[1];
        }
        else if ([
            sdk_core_1.ChainId.OPTIMISM,
            sdk_core_1.ChainId.OPTIMISM_GOERLI,
            sdk_core_1.ChainId.BASE,
            sdk_core_1.ChainId.BASE_GOERLI,
        ].includes(chainId)) {
            l2toL1FeeInWei = calculateOptimismToL1FeeFromCalldata(route.methodParameters.calldata, l2GasData)[1];
        }
        // add l2 to l1 fee and wrap fee to native currency
        const gasCostInWei = gasPriceWei.mul(simulatedGasUsed).add(l2toL1FeeInWei);
        const nativeCurrency = util_1.WRAPPED_NATIVE_CURRENCY[chainId];
        const costNativeCurrency = getGasCostInNativeCurrency(nativeCurrency, gasCostInWei);
        const usdPool = yield getHighestLiquidityV3USDPool(chainId, v3PoolProvider, providerConfig);
        const gasCostUSD = yield getGasCostInUSD(usdPool, costNativeCurrency);
        let gasCostQuoteToken = costNativeCurrency;
        // get fee in terms of quote token
        if (!quoteToken.equals(nativeCurrency)) {
            const nativePools = yield Promise.all([
                getHighestLiquidityV3NativePool(quoteToken, v3PoolProvider, providerConfig),
                getV2NativePool(quoteToken, v2PoolProvider, providerConfig),
            ]);
            const nativePool = nativePools.find((pool) => pool !== null);
            if (!nativePool) {
                util_1.log.info('Could not find any V2 or V3 pools to convert the cost into the quote token');
                gasCostQuoteToken = sdk_core_1.CurrencyAmount.fromRawAmount(quoteToken, 0);
            }
            else {
                gasCostQuoteToken = yield getGasCostInQuoteToken(quoteToken, nativePool, costNativeCurrency);
            }
        }
        // Adjust quote for gas fees
        let quoteGasAdjusted;
        if (route.trade.tradeType == sdk_core_1.TradeType.EXACT_OUTPUT) {
            // Exact output - need more of tokenIn to get the desired amount of tokenOut
            quoteGasAdjusted = route.quote.add(gasCostQuoteToken);
        }
        else {
            // Exact input - can get less of tokenOut due to fees
            quoteGasAdjusted = route.quote.subtract(gasCostQuoteToken);
        }
        return {
            estimatedGasUsedUSD: gasCostUSD,
            estimatedGasUsedQuoteToken: gasCostQuoteToken,
            quoteGasAdjusted: quoteGasAdjusted,
        };
    });
}
exports.calculateGasUsed = calculateGasUsed;
function initSwapRouteFromExisting(swapRoute, v2PoolProvider, v3PoolProvider, portionProvider, quoteGasAdjusted, estimatedGasUsed, estimatedGasUsedQuoteToken, estimatedGasUsedUSD, swapOptions) {
    const currencyIn = swapRoute.trade.inputAmount.currency;
    const currencyOut = swapRoute.trade.outputAmount.currency;
    const tradeType = swapRoute.trade.tradeType.valueOf()
        ? sdk_core_1.TradeType.EXACT_OUTPUT
        : sdk_core_1.TradeType.EXACT_INPUT;
    const routesWithValidQuote = swapRoute.route.map((route) => {
        switch (route.protocol) {
            case router_sdk_1.Protocol.V3:
                return new routers_1.V3RouteWithValidQuote({
                    amount: sdk_core_1.CurrencyAmount.fromFractionalAmount(route.amount.currency, route.amount.numerator, route.amount.denominator),
                    rawQuote: bignumber_1.BigNumber.from(route.rawQuote),
                    sqrtPriceX96AfterList: route.sqrtPriceX96AfterList.map((num) => bignumber_1.BigNumber.from(num)),
                    initializedTicksCrossedList: [...route.initializedTicksCrossedList],
                    quoterGasEstimate: bignumber_1.BigNumber.from(route.gasEstimate),
                    percent: route.percent,
                    route: route.route,
                    gasModel: route.gasModel,
                    quoteToken: new sdk_core_1.Token(currencyIn.chainId, route.quoteToken.address, route.quoteToken.decimals, route.quoteToken.symbol, route.quoteToken.name),
                    tradeType: tradeType,
                    v3PoolProvider: v3PoolProvider,
                });
            case router_sdk_1.Protocol.V2:
                return new routers_1.V2RouteWithValidQuote({
                    amount: sdk_core_1.CurrencyAmount.fromFractionalAmount(route.amount.currency, route.amount.numerator, route.amount.denominator),
                    rawQuote: bignumber_1.BigNumber.from(route.rawQuote),
                    percent: route.percent,
                    route: route.route,
                    gasModel: route.gasModel,
                    quoteToken: new sdk_core_1.Token(currencyIn.chainId, route.quoteToken.address, route.quoteToken.decimals, route.quoteToken.symbol, route.quoteToken.name),
                    tradeType: tradeType,
                    v2PoolProvider: v2PoolProvider,
                });
            case router_sdk_1.Protocol.MIXED:
                return new routers_1.MixedRouteWithValidQuote({
                    amount: sdk_core_1.CurrencyAmount.fromFractionalAmount(route.amount.currency, route.amount.numerator, route.amount.denominator),
                    rawQuote: bignumber_1.BigNumber.from(route.rawQuote),
                    sqrtPriceX96AfterList: route.sqrtPriceX96AfterList.map((num) => bignumber_1.BigNumber.from(num)),
                    initializedTicksCrossedList: [...route.initializedTicksCrossedList],
                    quoterGasEstimate: bignumber_1.BigNumber.from(route.gasEstimate),
                    percent: route.percent,
                    route: route.route,
                    mixedRouteGasModel: route.gasModel,
                    v2PoolProvider,
                    quoteToken: new sdk_core_1.Token(currencyIn.chainId, route.quoteToken.address, route.quoteToken.decimals, route.quoteToken.symbol, route.quoteToken.name),
                    tradeType: tradeType,
                    v3PoolProvider: v3PoolProvider,
                });
        }
    });
    const trade = (0, methodParameters_1.buildTrade)(currencyIn, currencyOut, tradeType, routesWithValidQuote);
    const quoteGasAndPortionAdjusted = swapRoute.portionAmount
        ? portionProvider.getQuoteGasAndPortionAdjusted(swapRoute.trade.tradeType, quoteGasAdjusted, swapRoute.portionAmount)
        : undefined;
    const routesWithValidQuotePortionAdjusted = portionProvider.getRouteWithQuotePortionAdjusted(swapRoute.trade.tradeType, routesWithValidQuote, swapOptions);
    return {
        quote: swapRoute.quote,
        quoteGasAdjusted,
        quoteGasAndPortionAdjusted,
        estimatedGasUsed,
        estimatedGasUsedQuoteToken,
        estimatedGasUsedUSD,
        gasPriceWei: bignumber_1.BigNumber.from(swapRoute.gasPriceWei),
        trade,
        route: routesWithValidQuotePortionAdjusted,
        blockNumber: bignumber_1.BigNumber.from(swapRoute.blockNumber),
        methodParameters: swapRoute.methodParameters
            ? {
                calldata: swapRoute.methodParameters.calldata,
                value: swapRoute.methodParameters.value,
                to: swapRoute.methodParameters.to,
            }
            : undefined,
        simulationStatus: swapRoute.simulationStatus,
        portionAmount: swapRoute.portionAmount,
    };
}
exports.initSwapRouteFromExisting = initSwapRouteFromExisting;
