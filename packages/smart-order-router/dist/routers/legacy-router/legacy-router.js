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
exports.LegacyRouter = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const logger_1 = require("@ethersproject/logger");
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const lodash_1 = __importDefault(require("lodash"));
const token_provider_1 = require("../../providers/token-provider");
const util_1 = require("../../util");
const amounts_1 = require("../../util/amounts");
const log_1 = require("../../util/log");
const routes_1 = require("../../util/routes");
const alpha_router_1 = require("../alpha-router");
const router_1 = require("../router");
const bases_1 = require("./bases");
// Interface defaults to 2.
const MAX_HOPS = 2;
/**
 * Replicates the router implemented in the V3 interface.
 * Code is mostly a copy from https://github.com/Uniswap/uniswap-interface/blob/0190b5a408c13016c87e1030ffc59326c085f389/src/hooks/useBestV3Trade.ts#L22-L23
 * with React/Redux hooks removed, and refactoring to allow re-use in other routers.
 */
class LegacyRouter {
    constructor({ chainId, multicall2Provider, poolProvider, quoteProvider, tokenProvider, }) {
        this.chainId = chainId;
        this.multicall2Provider = multicall2Provider;
        this.poolProvider = poolProvider;
        this.quoteProvider = quoteProvider;
        this.tokenProvider = tokenProvider;
    }
    route(amount, quoteCurrency, swapType, swapConfig, partialRoutingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (swapType == sdk_core_1.TradeType.EXACT_INPUT) {
                return this.routeExactIn(amount.currency, quoteCurrency, amount, swapConfig, partialRoutingConfig);
            }
            return this.routeExactOut(quoteCurrency, amount.currency, amount, swapConfig, partialRoutingConfig);
        });
    }
    routeExactIn(currencyIn, currencyOut, amountIn, swapConfig, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenIn = currencyIn.wrapped;
            const tokenOut = currencyOut.wrapped;
            const routes = yield this.getAllRoutes(tokenIn, tokenOut, routingConfig);
            const routeQuote = yield this.findBestRouteExactIn(amountIn, tokenOut, routes, routingConfig);
            if (!routeQuote) {
                return null;
            }
            const trade = this.buildTrade(currencyIn, currencyOut, sdk_core_1.TradeType.EXACT_INPUT, routeQuote);
            return {
                quote: routeQuote.quote,
                quoteGasAdjusted: routeQuote.quote,
                route: [routeQuote],
                estimatedGasUsed: bignumber_1.BigNumber.from(0),
                estimatedGasUsedQuoteToken: amounts_1.CurrencyAmount.fromFractionalAmount(tokenOut, 0, 1),
                estimatedGasUsedUSD: amounts_1.CurrencyAmount.fromFractionalAmount(token_provider_1.DAI_MAINNET, 0, 1),
                gasPriceWei: bignumber_1.BigNumber.from(0),
                trade,
                methodParameters: swapConfig
                    ? Object.assign(Object.assign({}, this.buildMethodParameters(trade, swapConfig)), { to: (0, util_1.SWAP_ROUTER_02_ADDRESSES)(this.chainId) }) : undefined,
                blockNumber: bignumber_1.BigNumber.from(0),
            };
        });
    }
    routeExactOut(currencyIn, currencyOut, amountOut, swapConfig, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenIn = currencyIn.wrapped;
            const tokenOut = currencyOut.wrapped;
            const routes = yield this.getAllRoutes(tokenIn, tokenOut, routingConfig);
            const routeQuote = yield this.findBestRouteExactOut(amountOut, tokenIn, routes, routingConfig);
            if (!routeQuote) {
                return null;
            }
            const trade = this.buildTrade(currencyIn, currencyOut, sdk_core_1.TradeType.EXACT_OUTPUT, routeQuote);
            return {
                quote: routeQuote.quote,
                quoteGasAdjusted: routeQuote.quote,
                route: [routeQuote],
                estimatedGasUsed: bignumber_1.BigNumber.from(0),
                estimatedGasUsedQuoteToken: amounts_1.CurrencyAmount.fromFractionalAmount(tokenIn, 0, 1),
                estimatedGasUsedUSD: amounts_1.CurrencyAmount.fromFractionalAmount(token_provider_1.DAI_MAINNET, 0, 1),
                gasPriceWei: bignumber_1.BigNumber.from(0),
                trade,
                methodParameters: swapConfig
                    ? Object.assign(Object.assign({}, this.buildMethodParameters(trade, swapConfig)), { to: (0, util_1.SWAP_ROUTER_02_ADDRESSES)(this.chainId) }) : undefined,
                blockNumber: bignumber_1.BigNumber.from(0),
            };
        });
    }
    findBestRouteExactIn(amountIn, tokenOut, routes, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { routesWithQuotes: quotesRaw } = yield this.quoteProvider.getQuotesManyExactIn([amountIn], routes, {
                blockNumber: routingConfig === null || routingConfig === void 0 ? void 0 : routingConfig.blockNumber,
            });
            const quotes100Percent = lodash_1.default.map(quotesRaw, ([route, quotes]) => { var _a, _b; return `${(0, routes_1.routeToString)(route)} : ${(_b = (_a = quotes[0]) === null || _a === void 0 ? void 0 : _a.quote) === null || _b === void 0 ? void 0 : _b.toString()}`; });
            log_1.log.info({ quotes100Percent }, '100% Quotes');
            const bestQuote = yield this.getBestQuote(routes, quotesRaw, tokenOut, sdk_core_1.TradeType.EXACT_INPUT);
            return bestQuote;
        });
    }
    findBestRouteExactOut(amountOut, tokenIn, routes, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { routesWithQuotes: quotesRaw } = yield this.quoteProvider.getQuotesManyExactOut([amountOut], routes, {
                blockNumber: routingConfig === null || routingConfig === void 0 ? void 0 : routingConfig.blockNumber,
            });
            const bestQuote = yield this.getBestQuote(routes, quotesRaw, tokenIn, sdk_core_1.TradeType.EXACT_OUTPUT);
            return bestQuote;
        });
    }
    getBestQuote(routes, quotesRaw, quoteToken, routeType) {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.debug(`Got ${lodash_1.default.filter(quotesRaw, ([_, quotes]) => !!quotes[0]).length} valid quotes from ${routes.length} possible routes.`);
            const routeQuotesRaw = [];
            for (let i = 0; i < quotesRaw.length; i++) {
                const [route, quotes] = quotesRaw[i];
                const { quote, amount } = quotes[0];
                if (!quote) {
                    logger_1.Logger.globalLogger().debug(`No quote for ${(0, routes_1.routeToString)(route)}`);
                    continue;
                }
                routeQuotesRaw.push({ route, quote, amount });
            }
            if (routeQuotesRaw.length == 0) {
                return null;
            }
            routeQuotesRaw.sort((routeQuoteA, routeQuoteB) => {
                if (routeType == sdk_core_1.TradeType.EXACT_INPUT) {
                    return routeQuoteA.quote.gt(routeQuoteB.quote) ? -1 : 1;
                }
                else {
                    return routeQuoteA.quote.lt(routeQuoteB.quote) ? -1 : 1;
                }
            });
            const routeQuotes = lodash_1.default.map(routeQuotesRaw, ({ route, quote, amount }) => {
                return new alpha_router_1.V3RouteWithValidQuote({
                    route,
                    rawQuote: quote,
                    amount,
                    percent: 100,
                    gasModel: {
                        estimateGasCost: () => ({
                            gasCostInToken: amounts_1.CurrencyAmount.fromRawAmount(quoteToken, 0),
                            gasCostInUSD: amounts_1.CurrencyAmount.fromRawAmount(token_provider_1.USDC_MAINNET, 0),
                            gasEstimate: bignumber_1.BigNumber.from(0),
                        }),
                    },
                    sqrtPriceX96AfterList: [],
                    initializedTicksCrossedList: [],
                    quoterGasEstimate: bignumber_1.BigNumber.from(0),
                    tradeType: routeType,
                    quoteToken,
                    v3PoolProvider: this.poolProvider,
                });
            });
            for (const rq of routeQuotes) {
                log_1.log.debug(`Quote: ${rq.amount.toFixed(Math.min(rq.amount.currency.decimals, 2))} Route: ${(0, routes_1.routeToString)(rq.route)}`);
            }
            return routeQuotes[0];
        });
    }
    getAllRoutes(tokenIn, tokenOut, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenPairs = yield this.getAllPossiblePairings(tokenIn, tokenOut);
            const poolAccessor = yield this.poolProvider.getPools(tokenPairs, {
                blockNumber: routingConfig === null || routingConfig === void 0 ? void 0 : routingConfig.blockNumber,
            });
            const pools = poolAccessor.getAllPools();
            const routes = this.computeAllRoutes(tokenIn, tokenOut, pools, this.chainId, [], [], tokenIn, MAX_HOPS);
            log_1.log.info({ routes: lodash_1.default.map(routes, routes_1.routeToString) }, `Computed ${routes.length} possible routes.`);
            return routes;
        });
    }
    getAllPossiblePairings(tokenIn, tokenOut) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const common = (_a = (0, bases_1.BASES_TO_CHECK_TRADES_AGAINST)(this.tokenProvider)[this.chainId]) !== null && _a !== void 0 ? _a : [];
            const additionalA = (_c = (_b = (yield (0, bases_1.ADDITIONAL_BASES)(this.tokenProvider))[this.chainId]) === null || _b === void 0 ? void 0 : _b[tokenIn.address]) !== null && _c !== void 0 ? _c : [];
            const additionalB = (_e = (_d = (yield (0, bases_1.ADDITIONAL_BASES)(this.tokenProvider))[this.chainId]) === null || _d === void 0 ? void 0 : _d[tokenOut.address]) !== null && _e !== void 0 ? _e : [];
            const bases = [...common, ...additionalA, ...additionalB];
            const basePairs = lodash_1.default.flatMap(bases, (base) => bases.map((otherBase) => [base, otherBase]));
            const customBases = (yield (0, bases_1.CUSTOM_BASES)(this.tokenProvider))[this.chainId];
            const allPairs = (0, lodash_1.default)([
                // the direct pair
                [tokenIn, tokenOut],
                // token A against all bases
                ...bases.map((base) => [tokenIn, base]),
                // token B against all bases
                ...bases.map((base) => [tokenOut, base]),
                // each base against all bases
                ...basePairs,
            ])
                .filter((tokens) => Boolean(tokens[0] && tokens[1]))
                .filter(([tokenA, tokenB]) => tokenA.address !== tokenB.address && !tokenA.equals(tokenB))
                .filter(([tokenA, tokenB]) => {
                const customBasesA = customBases === null || customBases === void 0 ? void 0 : customBases[tokenA.address];
                const customBasesB = customBases === null || customBases === void 0 ? void 0 : customBases[tokenB.address];
                if (!customBasesA && !customBasesB)
                    return true;
                if (customBasesA && !customBasesA.find((base) => tokenB.equals(base)))
                    return false;
                if (customBasesB && !customBasesB.find((base) => tokenA.equals(base)))
                    return false;
                return true;
            })
                .flatMap(([tokenA, tokenB]) => {
                return [
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.LOW],
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.MEDIUM],
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.HIGH],
                ];
            })
                .value();
            return allPairs;
        });
    }
    computeAllRoutes(tokenIn, tokenOut, pools, chainId, currentPath = [], allPaths = [], startTokenIn = tokenIn, maxHops = 2) {
        for (const pool of pools) {
            if (currentPath.indexOf(pool) !== -1 || !pool.involvesToken(tokenIn))
                continue;
            const outputToken = pool.token0.equals(tokenIn)
                ? pool.token1
                : pool.token0;
            if (outputToken.equals(tokenOut)) {
                allPaths.push(new router_1.V3Route([...currentPath, pool], startTokenIn, tokenOut));
            }
            else if (maxHops > 1) {
                this.computeAllRoutes(outputToken, tokenOut, pools, chainId, [...currentPath, pool], allPaths, startTokenIn, maxHops - 1);
            }
        }
        return allPaths;
    }
    buildTrade(tokenInCurrency, tokenOutCurrency, tradeType, routeAmount) {
        const { route, amount, quote } = routeAmount;
        // The route, amount and quote are all in terms of wrapped tokens.
        // When constructing the Trade object the inputAmount/outputAmount must
        // use native currencies if necessary. This is so that the Trade knows to wrap/unwrap.
        if (tradeType == sdk_core_1.TradeType.EXACT_INPUT) {
            const amountCurrency = amounts_1.CurrencyAmount.fromFractionalAmount(tokenInCurrency, amount.numerator, amount.denominator);
            const quoteCurrency = amounts_1.CurrencyAmount.fromFractionalAmount(tokenOutCurrency, quote.numerator, quote.denominator);
            const routeCurrency = new v3_sdk_1.Route(route.pools, amountCurrency.currency, quoteCurrency.currency);
            return new router_sdk_1.Trade({
                v3Routes: [
                    {
                        routev3: routeCurrency,
                        inputAmount: amountCurrency,
                        outputAmount: quoteCurrency,
                    },
                ],
                v2Routes: [],
                tradeType: tradeType,
            });
        }
        else {
            const quoteCurrency = amounts_1.CurrencyAmount.fromFractionalAmount(tokenInCurrency, quote.numerator, quote.denominator);
            const amountCurrency = amounts_1.CurrencyAmount.fromFractionalAmount(tokenOutCurrency, amount.numerator, amount.denominator);
            const routeCurrency = new v3_sdk_1.Route(route.pools, quoteCurrency.currency, amountCurrency.currency);
            return new router_sdk_1.Trade({
                v3Routes: [
                    {
                        routev3: routeCurrency,
                        inputAmount: quoteCurrency,
                        outputAmount: amountCurrency,
                    },
                ],
                v2Routes: [],
                tradeType: tradeType,
            });
        }
    }
    buildMethodParameters(trade, swapConfig) {
        const { recipient, slippageTolerance, deadline } = swapConfig;
        const methodParameters = router_sdk_1.SwapRouter.swapCallParameters(trade, {
            recipient,
            slippageTolerance,
            deadlineOrPreviousBlockhash: deadline,
            // ...(signatureData
            //   ? {
            //       inputTokenPermit:
            //         'allowed' in signatureData
            //           ? {
            //               expiry: signatureData.deadline,
            //               nonce: signatureData.nonce,
            //               s: signatureData.s,
            //               r: signatureData.r,
            //               v: signatureData.v as any,
            //             }
            //           : {
            //               deadline: signatureData.deadline,
            //               amount: signatureData.amount,
            //               s: signatureData.s,
            //               r: signatureData.r,
            //               v: signatureData.v as any,
            //             },
            //     }
            //   : {}),
        });
        return methodParameters;
    }
}
exports.LegacyRouter = LegacyRouter;
