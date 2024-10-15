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
exports.AlphaRouter = exports.LowerCaseStringArray = exports.MapWithLowerCaseKey = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const providers_1 = require("@ethersproject/providers");
const default_token_list_1 = __importDefault(require("@uniswap/default-token-list"));
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const async_retry_1 = __importDefault(require("async-retry"));
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_1 = __importDefault(require("lodash"));
const node_cache_1 = __importDefault(require("node-cache"));
const providers_2 = require("../../providers");
const caching_token_list_provider_1 = require("../../providers/caching-token-list-provider");
const portion_provider_1 = require("../../providers/portion-provider");
const token_fee_fetcher_1 = require("../../providers/token-fee-fetcher");
const token_provider_1 = require("../../providers/token-provider");
const token_validator_provider_1 = require("../../providers/token-validator-provider");
const pool_provider_1 = require("../../providers/v2/pool-provider");
const gas_data_provider_1 = require("../../providers/v3/gas-data-provider");
const pool_provider_2 = require("../../providers/v3/pool-provider");
const Erc20__factory_1 = require("../../types/other/factories/Erc20__factory");
const util_1 = require("../../util");
const amounts_1 = require("../../util/amounts");
const chains_1 = require("../../util/chains");
const gas_factory_helpers_1 = require("../../util/gas-factory-helpers");
const log_1 = require("../../util/log");
const methodParameters_1 = require("../../util/methodParameters");
const metric_1 = require("../../util/metric");
const unsupported_tokens_1 = require("../../util/unsupported-tokens");
const router_1 = require("../router");
const config_1 = require("./config");
const best_swap_route_1 = require("./functions/best-swap-route");
const calculate_ratio_amount_in_1 = require("./functions/calculate-ratio-amount-in");
const get_candidate_pools_1 = require("./functions/get-candidate-pools");
const mixed_route_heuristic_gas_model_1 = require("./gas-models/mixedRoute/mixed-route-heuristic-gas-model");
const v2_heuristic_gas_model_1 = require("./gas-models/v2/v2-heuristic-gas-model");
const gas_costs_1 = require("./gas-models/v3/gas-costs");
const v3_heuristic_gas_model_1 = require("./gas-models/v3/v3-heuristic-gas-model");
const quoters_1 = require("./quoters");
class MapWithLowerCaseKey extends Map {
    set(key, value) {
        return super.set(key.toLowerCase(), value);
    }
}
exports.MapWithLowerCaseKey = MapWithLowerCaseKey;
class LowerCaseStringArray extends Array {
    constructor(...items) {
        // Convert all items to lowercase before calling the parent constructor
        super(...items.map(item => item.toLowerCase()));
    }
}
exports.LowerCaseStringArray = LowerCaseStringArray;
class AlphaRouter {
    constructor({ chainId, provider, multicall2Provider, v3PoolProvider, onChainQuoteProvider, v2PoolProvider, v2QuoteProvider, v2SubgraphProvider, tokenProvider, blockedTokenListProvider, v3SubgraphProvider, gasPriceProvider, v3GasModelFactory, v2GasModelFactory, mixedRouteGasModelFactory, swapRouterProvider, optimismGasDataProvider, tokenValidatorProvider, arbitrumGasDataProvider, simulator, routeCachingProvider, tokenPropertiesProvider, portionProvider, }) {
        this.chainId = chainId;
        this.provider = provider;
        this.multicall2Provider =
            multicall2Provider !== null && multicall2Provider !== void 0 ? multicall2Provider : new providers_2.UniswapMulticallProvider(chainId, provider, 375000);
        this.v3PoolProvider =
            v3PoolProvider !== null && v3PoolProvider !== void 0 ? v3PoolProvider : new providers_2.CachingV3PoolProvider(this.chainId, new pool_provider_2.V3PoolProvider((0, chains_1.ID_TO_CHAIN_ID)(chainId), this.multicall2Provider), new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 360, useClones: false })));
        this.simulator = simulator;
        this.routeCachingProvider = routeCachingProvider;
        if (onChainQuoteProvider) {
            this.onChainQuoteProvider = onChainQuoteProvider;
        }
        else {
            switch (chainId) {
                case sdk_core_1.ChainId.OPTIMISM:
                case sdk_core_1.ChainId.OPTIMISM_GOERLI:
                    this.onChainQuoteProvider = new providers_2.OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
                        retries: 2,
                        minTimeout: 100,
                        maxTimeout: 1000,
                    }, {
                        multicallChunk: 110,
                        gasLimitPerCall: 1200000,
                        quoteMinSuccessRate: 0.1,
                    }, {
                        gasLimitOverride: 3000000,
                        multicallChunk: 45,
                    }, {
                        gasLimitOverride: 3000000,
                        multicallChunk: 45,
                    }, {
                        baseBlockOffset: -10,
                        rollback: {
                            enabled: true,
                            attemptsBeforeRollback: 1,
                            rollbackBlockOffset: -10,
                        },
                    });
                    break;
                case sdk_core_1.ChainId.BASE:
                case sdk_core_1.ChainId.BASE_GOERLI:
                    this.onChainQuoteProvider = new providers_2.OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
                        retries: 2,
                        minTimeout: 100,
                        maxTimeout: 1000,
                    }, {
                        multicallChunk: 80,
                        gasLimitPerCall: 1200000,
                        quoteMinSuccessRate: 0.1,
                    }, {
                        gasLimitOverride: 3000000,
                        multicallChunk: 45,
                    }, {
                        gasLimitOverride: 3000000,
                        multicallChunk: 45,
                    }, {
                        baseBlockOffset: -10,
                        rollback: {
                            enabled: true,
                            attemptsBeforeRollback: 1,
                            rollbackBlockOffset: -10,
                        },
                    });
                    break;
                case sdk_core_1.ChainId.ARBITRUM_ONE:
                case sdk_core_1.ChainId.ARBITRUM_GOERLI:
                    this.onChainQuoteProvider = new providers_2.OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
                        retries: 2,
                        minTimeout: 100,
                        maxTimeout: 1000,
                    }, {
                        multicallChunk: 10,
                        gasLimitPerCall: 12000000,
                        quoteMinSuccessRate: 0.1,
                    }, {
                        gasLimitOverride: 30000000,
                        multicallChunk: 6,
                    }, {
                        gasLimitOverride: 30000000,
                        multicallChunk: 6,
                    });
                    break;
                case sdk_core_1.ChainId.CELO:
                case sdk_core_1.ChainId.CELO_ALFAJORES:
                    this.onChainQuoteProvider = new providers_2.OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
                        retries: 2,
                        minTimeout: 100,
                        maxTimeout: 1000,
                    }, {
                        multicallChunk: 10,
                        gasLimitPerCall: 5000000,
                        quoteMinSuccessRate: 0.1,
                    }, {
                        gasLimitOverride: 5000000,
                        multicallChunk: 5,
                    }, {
                        gasLimitOverride: 6250000,
                        multicallChunk: 4,
                    });
                    break;
                case sdk_core_1.ChainId.SMARTBCH:
                    this.onChainQuoteProvider = new providers_2.OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
                        retries: 2,
                        minTimeout: 100,
                        maxTimeout: 1000,
                    }, {
                        multicallChunk: 8,
                        gasLimitPerCall: 800000,
                        quoteMinSuccessRate: 0.01,
                    }, {
                        gasLimitOverride: 1000000,
                        multicallChunk: 5,
                    }, {
                        gasLimitOverride: 1000000,
                        multicallChunk: 4,
                    });
                    break;
                default:
                    this.onChainQuoteProvider = new providers_2.OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
                        retries: 2,
                        minTimeout: 100,
                        maxTimeout: 1000,
                    }, {
                        multicallChunk: 210,
                        gasLimitPerCall: 705000,
                        quoteMinSuccessRate: 0.15,
                    }, {
                        gasLimitOverride: 2000000,
                        multicallChunk: 70,
                    });
                    break;
            }
        }
        if (tokenValidatorProvider) {
            this.tokenValidatorProvider = tokenValidatorProvider;
        }
        else if (this.chainId === sdk_core_1.ChainId.MAINNET) {
            this.tokenValidatorProvider = new token_validator_provider_1.TokenValidatorProvider(this.chainId, this.multicall2Provider, new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 30000, useClones: false })));
        }
        if (tokenPropertiesProvider) {
            this.tokenPropertiesProvider = tokenPropertiesProvider;
        }
        else {
            this.tokenPropertiesProvider = new providers_2.TokenPropertiesProvider(this.chainId, new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 86400, useClones: false })), new token_fee_fetcher_1.OnChainTokenFeeFetcher(this.chainId, provider));
        }
        this.v2PoolProvider =
            v2PoolProvider !== null && v2PoolProvider !== void 0 ? v2PoolProvider : new providers_2.CachingV2PoolProvider(chainId, new pool_provider_1.V2PoolProvider(chainId, this.multicall2Provider, this.tokenPropertiesProvider), new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 60, useClones: false })));
        this.v2QuoteProvider = v2QuoteProvider !== null && v2QuoteProvider !== void 0 ? v2QuoteProvider : new providers_2.V2QuoteProvider();
        this.blockedTokenListProvider =
            blockedTokenListProvider !== null && blockedTokenListProvider !== void 0 ? blockedTokenListProvider : new caching_token_list_provider_1.CachingTokenListProvider(chainId, unsupported_tokens_1.UNSUPPORTED_TOKENS, new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 3600, useClones: false })));
        this.tokenProvider =
            tokenProvider !== null && tokenProvider !== void 0 ? tokenProvider : new providers_2.CachingTokenProviderWithFallback(chainId, new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 3600, useClones: false })), new caching_token_list_provider_1.CachingTokenListProvider(chainId, default_token_list_1.default, new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 3600, useClones: false }))), new token_provider_1.TokenProvider(chainId, this.multicall2Provider));
        this.portionProvider = portionProvider !== null && portionProvider !== void 0 ? portionProvider : new portion_provider_1.PortionProvider();
        const chainName = (0, chains_1.ID_TO_NETWORK_NAME)(chainId);
        // ipfs urls in the following format: `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/${protocol}/${chainName}.json`;
        if (v2SubgraphProvider) {
            this.v2SubgraphProvider = v2SubgraphProvider;
        }
        else {
            this.v2SubgraphProvider = new providers_2.V2SubgraphProviderWithFallBacks([
                new providers_2.CachingV2SubgraphProvider(chainId, new providers_2.URISubgraphProvider(chainId, `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/v2/${chainName}.json`, undefined, 0), new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 300, useClones: false }))),
                new providers_2.StaticV2SubgraphProvider(chainId),
            ]);
        }
        if (v3SubgraphProvider) {
            this.v3SubgraphProvider = v3SubgraphProvider;
        }
        else {
            this.v3SubgraphProvider = new providers_2.V3SubgraphProviderWithFallBacks([
                new providers_2.CachingV3SubgraphProvider(chainId, new providers_2.URISubgraphProvider(chainId, `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/v3/${chainName}.json`, undefined, 0), new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 300, useClones: false }))),
                new providers_2.StaticV3SubgraphProvider(chainId, this.v3PoolProvider),
            ]);
        }
        let gasPriceProviderInstance;
        if (providers_1.JsonRpcProvider.isProvider(this.provider)) {
            gasPriceProviderInstance = new providers_2.OnChainGasPriceProvider(chainId, new providers_2.EIP1559GasPriceProvider(this.provider), new providers_2.LegacyGasPriceProvider(this.provider));
        }
        else {
            gasPriceProviderInstance = new providers_2.ETHGasStationInfoProvider(config_1.ETH_GAS_STATION_API_URL);
        }
        this.gasPriceProvider =
            gasPriceProvider !== null && gasPriceProvider !== void 0 ? gasPriceProvider : new providers_2.CachingGasStationProvider(chainId, gasPriceProviderInstance, new providers_2.NodeJSCache(new node_cache_1.default({ stdTTL: 7, useClones: false })));
        this.v3GasModelFactory =
            v3GasModelFactory !== null && v3GasModelFactory !== void 0 ? v3GasModelFactory : new v3_heuristic_gas_model_1.V3HeuristicGasModelFactory();
        this.v2GasModelFactory =
            v2GasModelFactory !== null && v2GasModelFactory !== void 0 ? v2GasModelFactory : new v2_heuristic_gas_model_1.V2HeuristicGasModelFactory();
        this.mixedRouteGasModelFactory =
            mixedRouteGasModelFactory !== null && mixedRouteGasModelFactory !== void 0 ? mixedRouteGasModelFactory : new mixed_route_heuristic_gas_model_1.MixedRouteHeuristicGasModelFactory();
        this.swapRouterProvider =
            swapRouterProvider !== null && swapRouterProvider !== void 0 ? swapRouterProvider : new providers_2.SwapRouterProvider(this.multicall2Provider, this.chainId);
        if (chainId === sdk_core_1.ChainId.OPTIMISM || chainId === sdk_core_1.ChainId.BASE) {
            this.l2GasDataProvider =
                optimismGasDataProvider !== null && optimismGasDataProvider !== void 0 ? optimismGasDataProvider : new gas_data_provider_1.OptimismGasDataProvider(chainId, this.multicall2Provider);
        }
        if (chainId === sdk_core_1.ChainId.ARBITRUM_ONE ||
            chainId === sdk_core_1.ChainId.ARBITRUM_GOERLI) {
            this.l2GasDataProvider =
                arbitrumGasDataProvider !== null && arbitrumGasDataProvider !== void 0 ? arbitrumGasDataProvider : new gas_data_provider_1.ArbitrumGasDataProvider(chainId, this.provider);
        }
        // Initialize the Quoters.
        // Quoters are an abstraction encapsulating the business logic of fetching routes and quotes.
        this.v2Quoter = new quoters_1.V2Quoter(this.v2SubgraphProvider, this.v2PoolProvider, this.v2QuoteProvider, this.v2GasModelFactory, this.tokenProvider, this.chainId, this.blockedTokenListProvider, this.tokenValidatorProvider);
        this.v3Quoter = new quoters_1.V3Quoter(this.v3SubgraphProvider, this.v3PoolProvider, this.onChainQuoteProvider, this.tokenProvider, this.chainId, this.blockedTokenListProvider, this.tokenValidatorProvider);
        this.mixedQuoter = new quoters_1.MixedQuoter(this.v3SubgraphProvider, this.v3PoolProvider, this.v2SubgraphProvider, this.v2PoolProvider, this.onChainQuoteProvider, this.tokenProvider, this.chainId, this.blockedTokenListProvider, this.tokenValidatorProvider);
    }
    routeToRatio(token0Balance, token1Balance, position, swapAndAddConfig, swapAndAddOptions, routingConfig = (0, config_1.DEFAULT_ROUTING_CONFIG_BY_CHAIN)(this.chainId)) {
        return __awaiter(this, void 0, void 0, function* () {
            if (token1Balance.currency.wrapped.sortsBefore(token0Balance.currency.wrapped)) {
                [token0Balance, token1Balance] = [token1Balance, token0Balance];
            }
            let preSwapOptimalRatio = this.calculateOptimalRatio(position, position.pool.sqrtRatioX96, true);
            // set up parameters according to which token will be swapped
            let zeroForOne;
            if (position.pool.tickCurrent > position.tickUpper) {
                zeroForOne = true;
            }
            else if (position.pool.tickCurrent < position.tickLower) {
                zeroForOne = false;
            }
            else {
                zeroForOne = new sdk_core_1.Fraction(token0Balance.quotient, token1Balance.quotient).greaterThan(preSwapOptimalRatio);
                if (!zeroForOne)
                    preSwapOptimalRatio = preSwapOptimalRatio.invert();
            }
            const [inputBalance, outputBalance] = zeroForOne
                ? [token0Balance, token1Balance]
                : [token1Balance, token0Balance];
            let optimalRatio = preSwapOptimalRatio;
            let postSwapTargetPool = position.pool;
            let exchangeRate = zeroForOne
                ? position.pool.token0Price
                : position.pool.token1Price;
            let swap = null;
            let ratioAchieved = false;
            let n = 0;
            // iterate until we find a swap with a sufficient ratio or return null
            while (!ratioAchieved) {
                n++;
                if (n > swapAndAddConfig.maxIterations) {
                    log_1.log.info('max iterations exceeded');
                    return {
                        status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
                        error: 'max iterations exceeded',
                    };
                }
                const amountToSwap = (0, calculate_ratio_amount_in_1.calculateRatioAmountIn)(optimalRatio, exchangeRate, inputBalance, outputBalance);
                if (amountToSwap.equalTo(0)) {
                    log_1.log.info(`no swap needed: amountToSwap = 0`);
                    return {
                        status: router_1.SwapToRatioStatus.NO_SWAP_NEEDED,
                    };
                }
                swap = yield this.route(amountToSwap, outputBalance.currency, sdk_core_1.TradeType.EXACT_INPUT, undefined, Object.assign(Object.assign(Object.assign({}, (0, config_1.DEFAULT_ROUTING_CONFIG_BY_CHAIN)(this.chainId)), routingConfig), { 
                    /// @dev We do not want to query for mixedRoutes for routeToRatio as they are not supported
                    /// [Protocol.V3, Protocol.V2] will make sure we only query for V3 and V2
                    protocols: [router_sdk_1.Protocol.V3, router_sdk_1.Protocol.V2] }));
                if (!swap) {
                    log_1.log.info('no route found from this.route()');
                    return {
                        status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
                        error: 'no route found',
                    };
                }
                const inputBalanceUpdated = inputBalance.subtract(swap.trade.inputAmount);
                const outputBalanceUpdated = outputBalance.add(swap.trade.outputAmount);
                const newRatio = inputBalanceUpdated.divide(outputBalanceUpdated);
                let targetPoolPriceUpdate;
                swap.route.forEach((route) => {
                    if (route.protocol === router_sdk_1.Protocol.V3) {
                        const v3Route = route;
                        v3Route.route.pools.forEach((pool, i) => {
                            if (pool.token0.equals(position.pool.token0) &&
                                pool.token1.equals(position.pool.token1) &&
                                pool.fee === position.pool.fee) {
                                targetPoolPriceUpdate = jsbi_1.default.BigInt(v3Route.sqrtPriceX96AfterList[i].toString());
                                optimalRatio = this.calculateOptimalRatio(position, jsbi_1.default.BigInt(targetPoolPriceUpdate.toString()), zeroForOne);
                            }
                        });
                    }
                });
                if (!targetPoolPriceUpdate) {
                    optimalRatio = preSwapOptimalRatio;
                }
                ratioAchieved =
                    newRatio.equalTo(optimalRatio) ||
                        this.absoluteValue(newRatio.asFraction.divide(optimalRatio).subtract(1)).lessThan(swapAndAddConfig.ratioErrorTolerance);
                if (ratioAchieved && targetPoolPriceUpdate) {
                    postSwapTargetPool = new v3_sdk_1.Pool(position.pool.token0, position.pool.token1, position.pool.fee, targetPoolPriceUpdate, position.pool.liquidity, v3_sdk_1.TickMath.getTickAtSqrtRatio(targetPoolPriceUpdate), position.pool.tickDataProvider);
                }
                exchangeRate = swap.trade.outputAmount.divide(swap.trade.inputAmount);
                log_1.log.info({
                    exchangeRate: exchangeRate.asFraction.toFixed(18),
                    optimalRatio: optimalRatio.asFraction.toFixed(18),
                    newRatio: newRatio.asFraction.toFixed(18),
                    inputBalanceUpdated: inputBalanceUpdated.asFraction.toFixed(18),
                    outputBalanceUpdated: outputBalanceUpdated.asFraction.toFixed(18),
                    ratioErrorTolerance: swapAndAddConfig.ratioErrorTolerance.toFixed(18),
                    iterationN: n.toString(),
                }, 'QuoteToRatio Iteration Parameters');
                if (exchangeRate.equalTo(0)) {
                    log_1.log.info('exchangeRate to 0');
                    return {
                        status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
                        error: 'insufficient liquidity to swap to optimal ratio',
                    };
                }
            }
            if (!swap) {
                return {
                    status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
                    error: 'no route found',
                };
            }
            let methodParameters;
            if (swapAndAddOptions) {
                methodParameters = yield this.buildSwapAndAddMethodParameters(swap.trade, swapAndAddOptions, {
                    initialBalanceTokenIn: inputBalance,
                    initialBalanceTokenOut: outputBalance,
                    preLiquidityPosition: position,
                });
            }
            return {
                status: router_1.SwapToRatioStatus.SUCCESS,
                result: Object.assign(Object.assign({}, swap), { methodParameters, optimalRatio, postSwapTargetPool }),
            };
        });
    }
    /**
     * @inheritdoc IRouter
     */
    route(amount, quoteCurrency, tradeType, swapConfig, partialRoutingConfig = {}) {
        var _a, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const originalAmount = amount;
            if (tradeType === sdk_core_1.TradeType.EXACT_OUTPUT) {
                const portionAmount = this.portionProvider.getPortionAmount(amount, tradeType, swapConfig);
                if (portionAmount && portionAmount.greaterThan(router_sdk_1.ZERO)) {
                    // In case of exact out swap, before we route, we need to make sure that the
                    // token out amount accounts for flat portion, and token in amount after the best swap route contains the token in equivalent of portion.
                    // In other words, in case a pool's LP fee bps is lower than the portion bps (0.01%/0.05% for v3), a pool can go insolvency.
                    // This is because instead of the swapper being responsible for the portion,
                    // the pool instead gets responsible for the portion.
                    // The addition below avoids that situation.
                    amount = amount.add(portionAmount);
                }
            }
            const { currencyIn, currencyOut } = this.determineCurrencyInOutFromTradeType(tradeType, amount, quoteCurrency);
            const tokenIn = currencyIn.wrapped;
            const tokenOut = currencyOut.wrapped;
            metric_1.metric.setProperty('chainId', this.chainId);
            metric_1.metric.setProperty('pair', `${tokenIn.symbol}/${tokenOut.symbol}`);
            metric_1.metric.setProperty('tokenIn', tokenIn.address);
            metric_1.metric.setProperty('tokenOut', tokenOut.address);
            metric_1.metric.setProperty('tradeType', tradeType === sdk_core_1.TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut');
            metric_1.metric.putMetric(`QuoteRequestedForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            // Get a block number to specify in all our calls. Ensures data we fetch from chain is
            // from the same block.
            const blockNumber = (_a = partialRoutingConfig.blockNumber) !== null && _a !== void 0 ? _a : this.getBlockNumberPromise();
            const routingConfig = lodash_1.default.merge({
                // These settings could be changed by the partialRoutingConfig
                useCachedRoutes: true,
                writeToCachedRoutes: true,
                optimisticCachedRoutes: false,
            }, (0, config_1.DEFAULT_ROUTING_CONFIG_BY_CHAIN)(this.chainId), partialRoutingConfig, { blockNumber });
            if (routingConfig.debugRouting) {
                log_1.log.warn(`Finalized routing config is ${JSON.stringify(routingConfig)}`);
            }
            const gasPriceWei = yield this.getGasPriceWei();
            const quoteToken = quoteCurrency.wrapped;
            const providerConfig = Object.assign(Object.assign({}, routingConfig), { blockNumber, additionalGasOverhead: (0, gas_costs_1.NATIVE_OVERHEAD)(this.chainId, amount.currency, quoteCurrency) });
            const [v3GasModel, mixedRouteGasModel] = yield this.getGasModels(gasPriceWei, amount.currency.wrapped, quoteToken, providerConfig);
            // Create a Set to sanitize the protocols input, a Set of undefined becomes an empty set,
            // Then create an Array from the values of that Set.
            const protocols = Array.from(new Set(routingConfig.protocols).values());
            const cacheMode = (_c = routingConfig.overwriteCacheMode) !== null && _c !== void 0 ? _c : yield ((_d = this.routeCachingProvider) === null || _d === void 0 ? void 0 : _d.getCacheMode(this.chainId, amount, quoteToken, tradeType, protocols));
            // Fetch CachedRoutes
            let cachedRoutes;
            if (routingConfig.useCachedRoutes && cacheMode !== providers_2.CacheMode.Darkmode) {
                cachedRoutes = yield ((_e = this.routeCachingProvider) === null || _e === void 0 ? void 0 : _e.getCachedRoute(this.chainId, amount, quoteToken, tradeType, protocols, yield blockNumber, routingConfig.optimisticCachedRoutes));
            }
            metric_1.metric.putMetric(routingConfig.useCachedRoutes ? 'GetQuoteUsingCachedRoutes' : 'GetQuoteNotUsingCachedRoutes', 1, metric_1.MetricLoggerUnit.Count);
            if (cacheMode && routingConfig.useCachedRoutes && cacheMode !== providers_2.CacheMode.Darkmode && !cachedRoutes) {
                metric_1.metric.putMetric(`GetCachedRoute_miss_${cacheMode}`, 1, metric_1.MetricLoggerUnit.Count);
                log_1.log.info({
                    tokenIn: tokenIn.symbol,
                    tokenInAddress: tokenIn.address,
                    tokenOut: tokenOut.symbol,
                    tokenOutAddress: tokenOut.address,
                    cacheMode,
                    amount: amount.toExact(),
                    chainId: this.chainId,
                    tradeType: this.tradeTypeStr(tradeType)
                }, `GetCachedRoute miss ${cacheMode} for ${this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType)}`);
            }
            else if (cachedRoutes && routingConfig.useCachedRoutes) {
                metric_1.metric.putMetric(`GetCachedRoute_hit_${cacheMode}`, 1, metric_1.MetricLoggerUnit.Count);
                log_1.log.info({
                    tokenIn: tokenIn.symbol,
                    tokenInAddress: tokenIn.address,
                    tokenOut: tokenOut.symbol,
                    tokenOutAddress: tokenOut.address,
                    cacheMode,
                    amount: amount.toExact(),
                    chainId: this.chainId,
                    tradeType: this.tradeTypeStr(tradeType)
                }, `GetCachedRoute hit ${cacheMode} for ${this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType)}`);
            }
            let swapRouteFromCachePromise = Promise.resolve(null);
            if (cachedRoutes) {
                swapRouteFromCachePromise = this.getSwapRouteFromCache(cachedRoutes, yield blockNumber, amount, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig);
            }
            let swapRouteFromChainPromise = Promise.resolve(null);
            if (!cachedRoutes || cacheMode !== providers_2.CacheMode.Livemode) {
                swapRouteFromChainPromise = this.getSwapRouteFromChain(amount, tokenIn, tokenOut, protocols, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig);
            }
            //   const swapRouteFromCache = await swapRouteFromCachePromise;
            //   const swapRouteFromChain = await this.getSwapRouteFromChain(
            //     amount,
            //     tokenIn,
            //     tokenOut,
            //     protocols,
            //     quoteToken,
            //     tradeType,
            //     routingConfig,
            //     v3GasModel,
            //     mixedRouteGasModel,
            //     gasPriceWei,
            //     swapConfig
            //   );;
            // );
            const [swapRouteFromCache, swapRouteFromChain] = yield Promise.all([
                swapRouteFromCachePromise,
                swapRouteFromChainPromise
            ]);
            let swapRouteRaw;
            let hitsCachedRoute = false;
            if (cacheMode === providers_2.CacheMode.Livemode && swapRouteFromCache) {
                log_1.log.info(`CacheMode is ${cacheMode}, and we are using swapRoute from cache`);
                hitsCachedRoute = true;
                swapRouteRaw = swapRouteFromCache;
            }
            else {
                log_1.log.info(`CacheMode is ${cacheMode}, and we are using materialized swapRoute`);
                swapRouteRaw = swapRouteFromChain;
            }
            if (cacheMode === providers_2.CacheMode.Tapcompare && swapRouteFromCache && swapRouteFromChain) {
                const quoteDiff = swapRouteFromChain.quote.subtract(swapRouteFromCache.quote);
                const quoteGasAdjustedDiff = swapRouteFromChain.quoteGasAdjusted.subtract(swapRouteFromCache.quoteGasAdjusted);
                const gasUsedDiff = swapRouteFromChain.estimatedGasUsed.sub(swapRouteFromCache.estimatedGasUsed);
                // Only log if quoteDiff is different from 0, or if quoteGasAdjustedDiff and gasUsedDiff are both different from 0
                if (!quoteDiff.equalTo(0) || !(quoteGasAdjustedDiff.equalTo(0) || gasUsedDiff.eq(0))) {
                    // Calculates the percentage of the difference with respect to the quoteFromChain (not from cache)
                    const misquotePercent = quoteGasAdjustedDiff.divide(swapRouteFromChain.quoteGasAdjusted).multiply(100);
                    metric_1.metric.putMetric(`TapcompareCachedRoute_quoteGasAdjustedDiffPercent`, Number(misquotePercent.toExact()), metric_1.MetricLoggerUnit.Percent);
                    log_1.log.warn({
                        quoteFromChain: swapRouteFromChain.quote.toExact(),
                        quoteFromCache: swapRouteFromCache.quote.toExact(),
                        quoteDiff: quoteDiff.toExact(),
                        quoteGasAdjustedFromChain: swapRouteFromChain.quoteGasAdjusted.toExact(),
                        quoteGasAdjustedFromCache: swapRouteFromCache.quoteGasAdjusted.toExact(),
                        quoteGasAdjustedDiff: quoteGasAdjustedDiff.toExact(),
                        gasUsedFromChain: swapRouteFromChain.estimatedGasUsed.toString(),
                        gasUsedFromCache: swapRouteFromCache.estimatedGasUsed.toString(),
                        gasUsedDiff: gasUsedDiff.toString(),
                        routesFromChain: swapRouteFromChain.routes.toString(),
                        routesFromCache: swapRouteFromCache.routes.toString(),
                        amount: amount.toExact(),
                        originalAmount: cachedRoutes === null || cachedRoutes === void 0 ? void 0 : cachedRoutes.originalAmount,
                        pair: this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType),
                        blockNumber
                    }, `Comparing quotes between Chain and Cache for ${this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType)}`);
                }
            }
            if (!swapRouteRaw) {
                return null;
            }
            const { quote, quoteGasAdjusted, estimatedGasUsed, routes: routeAmounts, estimatedGasUsedQuoteToken, estimatedGasUsedUSD, } = swapRouteRaw;
            if (this.routeCachingProvider &&
                routingConfig.writeToCachedRoutes &&
                cacheMode !== providers_2.CacheMode.Darkmode &&
                swapRouteFromChain) {
                // Generate the object to be cached
                const routesToCache = providers_2.CachedRoutes.fromRoutesWithValidQuotes(swapRouteFromChain.routes, this.chainId, tokenIn, tokenOut, protocols.sort(), // sort it for consistency in the order of the protocols.
                yield blockNumber, tradeType, amount.toExact());
                if (routesToCache) {
                    // Attempt to insert the entry in cache. This is fire and forget promise.
                    // The catch method will prevent any exception from blocking the normal code execution.
                    this.routeCachingProvider.setCachedRoute(routesToCache, amount).then((success) => {
                        const status = success ? 'success' : 'rejected';
                        metric_1.metric.putMetric(`SetCachedRoute_${status}`, 1, metric_1.MetricLoggerUnit.Count);
                    }).catch((reason) => {
                        log_1.log.error({
                            reason: reason,
                            tokenPair: this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType),
                        }, `SetCachedRoute failure`);
                        metric_1.metric.putMetric(`SetCachedRoute_failure`, 1, metric_1.MetricLoggerUnit.Count);
                    });
                }
                else {
                    metric_1.metric.putMetric(`SetCachedRoute_unnecessary`, 1, metric_1.MetricLoggerUnit.Count);
                }
            }
            metric_1.metric.putMetric(`QuoteFoundForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            // Build Trade object that represents the optimal swap.
            const trade = (0, methodParameters_1.buildTrade)(currencyIn, currencyOut, tradeType, routeAmounts);
            let methodParameters;
            // If user provided recipient, deadline etc. we also generate the calldata required to execute
            // the swap and return it too.
            if (swapConfig) {
                methodParameters = (0, methodParameters_1.buildSwapMethodParameters)(trade, swapConfig, this.chainId);
            }
            const tokenOutAmount = tradeType === sdk_core_1.TradeType.EXACT_OUTPUT ?
                originalAmount // we need to pass in originalAmount instead of amount, because amount already added portionAmount in case of exact out swap
                : quote;
            const portionAmount = this.portionProvider.getPortionAmount(tokenOutAmount, tradeType, swapConfig);
            const portionQuoteAmount = this.portionProvider.getPortionQuoteAmount(tradeType, quote, amount, // we need to pass in amount instead of originalAmount here, because amount here needs to add the portion for exact out
            portionAmount);
            // we need to correct quote and quote gas adjusted for exact output when portion is part of the exact out swap
            const correctedQuote = this.portionProvider.getQuote(tradeType, quote, portionQuoteAmount);
            const correctedQuoteGasAdjusted = this.portionProvider.getQuoteGasAdjusted(tradeType, quoteGasAdjusted, portionQuoteAmount);
            const quoteGasAndPortionAdjusted = this.portionProvider.getQuoteGasAndPortionAdjusted(tradeType, quoteGasAdjusted, portionAmount);
            const swapRoute = {
                quote: correctedQuote,
                quoteGasAdjusted: correctedQuoteGasAdjusted,
                estimatedGasUsed,
                estimatedGasUsedQuoteToken,
                estimatedGasUsedUSD,
                gasPriceWei,
                route: routeAmounts,
                trade,
                methodParameters,
                blockNumber: bignumber_1.BigNumber.from(yield blockNumber),
                hitsCachedRoute: hitsCachedRoute,
                portionAmount: portionAmount,
                quoteGasAndPortionAdjusted: quoteGasAndPortionAdjusted,
            };
            if (swapConfig &&
                swapConfig.simulate &&
                methodParameters &&
                methodParameters.calldata) {
                if (!this.simulator) {
                    throw new Error('Simulator not initialized!');
                }
                log_1.log.info({ swapConfig, methodParameters }, 'Starting simulation');
                const fromAddress = swapConfig.simulate.fromAddress;
                const beforeSimulate = Date.now();
                const swapRouteWithSimulation = yield this.simulator.simulate(fromAddress, swapConfig, swapRoute, amount, 
                // Quote will be in WETH even if quoteCurrency is ETH
                // So we init a new CurrencyAmount object here
                amounts_1.CurrencyAmount.fromRawAmount(quoteCurrency, quote.quotient.toString()), this.l2GasDataProvider
                    ? yield this.l2GasDataProvider.getGasData()
                    : undefined, providerConfig);
                metric_1.metric.putMetric('SimulateTransaction', Date.now() - beforeSimulate, metric_1.MetricLoggerUnit.Milliseconds);
                return swapRouteWithSimulation;
            }
            return swapRoute;
        });
    }
    getSwapRouteFromCache(cachedRoutes, blockNumber, amount, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.info({
                protocols: cachedRoutes.protocolsCovered,
                tradeType: cachedRoutes.tradeType,
                cachedBlockNumber: cachedRoutes.blockNumber,
                quoteBlockNumber: blockNumber,
            }, 'Routing across CachedRoute');
            const quotePromises = [];
            const v3Routes = cachedRoutes.routes.filter((route) => route.protocol === router_sdk_1.Protocol.V3);
            const v2Routes = cachedRoutes.routes.filter((route) => route.protocol === router_sdk_1.Protocol.V2);
            const mixedRoutes = cachedRoutes.routes.filter((route) => route.protocol === router_sdk_1.Protocol.MIXED);
            let percents;
            let amounts;
            if (cachedRoutes.routes.length > 1) {
                // If we have more than 1 route, we will quote the different percents for it, following the regular process
                [percents, amounts] = this.getAmountDistribution(amount, routingConfig);
            }
            else if (cachedRoutes.routes.length == 1) {
                [percents, amounts] = [[100], [amount]];
            }
            else {
                // In this case this means that there's no route, so we return null
                return Promise.resolve(null);
            }
            if (v3Routes.length > 0) {
                const v3RoutesFromCache = v3Routes.map((cachedRoute) => cachedRoute.route);
                metric_1.metric.putMetric('SwapRouteFromCache_V3_GetQuotes_Request', 1, metric_1.MetricLoggerUnit.Count);
                const beforeGetQuotes = Date.now();
                quotePromises.push(this.v3Quoter.getQuotes(v3RoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, undefined, v3GasModel).then((result) => {
                    metric_1.metric.putMetric(`SwapRouteFromCache_V3_GetQuotes_Load`, Date.now() - beforeGetQuotes, metric_1.MetricLoggerUnit.Milliseconds);
                    return result;
                }));
            }
            if (v2Routes.length > 0) {
                const v2RoutesFromCache = v2Routes.map((cachedRoute) => cachedRoute.route);
                metric_1.metric.putMetric('SwapRouteFromCache_V2_GetQuotes_Request', 1, metric_1.MetricLoggerUnit.Count);
                const beforeGetQuotes = Date.now();
                quotePromises.push(this.v2Quoter.refreshRoutesThenGetQuotes(cachedRoutes.tokenIn, cachedRoutes.tokenOut, v2RoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, gasPriceWei).then((result) => {
                    metric_1.metric.putMetric(`SwapRouteFromCache_V2_GetQuotes_Load`, Date.now() - beforeGetQuotes, metric_1.MetricLoggerUnit.Milliseconds);
                    return result;
                }));
            }
            if (mixedRoutes.length > 0) {
                const mixedRoutesFromCache = mixedRoutes.map((cachedRoute) => cachedRoute.route);
                metric_1.metric.putMetric('SwapRouteFromCache_Mixed_GetQuotes_Request', 1, metric_1.MetricLoggerUnit.Count);
                const beforeGetQuotes = Date.now();
                quotePromises.push(this.mixedQuoter.getQuotes(mixedRoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, undefined, mixedRouteGasModel).then((result) => {
                    metric_1.metric.putMetric(`SwapRouteFromCache_Mixed_GetQuotes_Load`, Date.now() - beforeGetQuotes, metric_1.MetricLoggerUnit.Milliseconds);
                    return result;
                }));
            }
            const getQuotesResults = yield Promise.all(quotePromises);
            const allRoutesWithValidQuotes = lodash_1.default.flatMap(getQuotesResults, (quoteResult) => quoteResult.routesWithValidQuotes);
            return (0, best_swap_route_1.getBestSwapRoute)(amount, percents, allRoutesWithValidQuotes, tradeType, this.chainId, routingConfig, this.portionProvider, v3GasModel, swapConfig);
        });
    }
    getSwapRouteFromChain(amount, tokenIn, tokenOut, protocols, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate our distribution of amounts, i.e. fractions of the input amount.
            // We will get quotes for fractions of the input amount for different routes, then
            // combine to generate split routes.
            const [percents, amounts] = this.getAmountDistribution(amount, routingConfig);
            const noProtocolsSpecified = protocols.length === 0;
            const v3ProtocolSpecified = protocols.includes(router_sdk_1.Protocol.V3);
            const v2ProtocolSpecified = protocols.includes(router_sdk_1.Protocol.V2);
            const v2SupportedInChain = chains_1.V2_SUPPORTED.includes(this.chainId);
            const shouldQueryMixedProtocol = protocols.includes(router_sdk_1.Protocol.MIXED) || (noProtocolsSpecified && v2SupportedInChain);
            const mixedProtocolAllowed = [sdk_core_1.ChainId.MAINNET, sdk_core_1.ChainId.GOERLI].includes(this.chainId) &&
                tradeType === sdk_core_1.TradeType.EXACT_INPUT;
            const beforeGetCandidates = Date.now();
            let v3CandidatePoolsPromise = Promise.resolve(undefined);
            if (v3ProtocolSpecified ||
                noProtocolsSpecified ||
                (shouldQueryMixedProtocol && mixedProtocolAllowed)) {
                v3CandidatePoolsPromise = (0, get_candidate_pools_1.getV3CandidatePools)({
                    tokenIn,
                    tokenOut,
                    tokenProvider: this.tokenProvider,
                    blockedTokenListProvider: this.blockedTokenListProvider,
                    poolProvider: this.v3PoolProvider,
                    routeType: tradeType,
                    subgraphProvider: this.v3SubgraphProvider,
                    routingConfig,
                    chainId: this.chainId,
                }).then((candidatePools) => {
                    metric_1.metric.putMetric('GetV3CandidatePools', Date.now() - beforeGetCandidates, metric_1.MetricLoggerUnit.Milliseconds);
                    return candidatePools;
                });
            }
            let v2CandidatePoolsPromise = Promise.resolve(undefined);
            if ((v2SupportedInChain && (v2ProtocolSpecified || noProtocolsSpecified)) ||
                (shouldQueryMixedProtocol && mixedProtocolAllowed)) {
                // Fetch all the pools that we will consider routing via. There are thousands
                // of pools, so we filter them to a set of candidate pools that we expect will
                // result in good prices.
                v2CandidatePoolsPromise = (0, get_candidate_pools_1.getV2CandidatePools)({
                    tokenIn,
                    tokenOut,
                    tokenProvider: this.tokenProvider,
                    blockedTokenListProvider: this.blockedTokenListProvider,
                    poolProvider: this.v2PoolProvider,
                    routeType: tradeType,
                    subgraphProvider: this.v2SubgraphProvider,
                    routingConfig,
                    chainId: this.chainId,
                }).then((candidatePools) => {
                    metric_1.metric.putMetric('GetV2CandidatePools', Date.now() - beforeGetCandidates, metric_1.MetricLoggerUnit.Milliseconds);
                    return candidatePools;
                });
            }
            const quotePromises = [];
            // Maybe Quote V3 - if V3 is specified, or no protocol is specified
            if (v3ProtocolSpecified || noProtocolsSpecified) {
                log_1.log.info({ protocols, tradeType }, 'Routing across V3');
                metric_1.metric.putMetric('SwapRouteFromChain_V3_GetRoutesThenQuotes_Request', 1, metric_1.MetricLoggerUnit.Count);
                const beforeGetRoutesThenQuotes = Date.now();
                quotePromises.push(v3CandidatePoolsPromise.then((v3CandidatePools) => this.v3Quoter.getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, v3CandidatePools, tradeType, routingConfig, v3GasModel).then((result) => {
                    metric_1.metric.putMetric(`SwapRouteFromChain_V3_GetRoutesThenQuotes_Load`, Date.now() - beforeGetRoutesThenQuotes, metric_1.MetricLoggerUnit.Milliseconds);
                    return result;
                })));
            }
            // Maybe Quote V2 - if V2 is specified, or no protocol is specified AND v2 is supported in this chain
            if (v2SupportedInChain && (v2ProtocolSpecified || noProtocolsSpecified)) {
                log_1.log.info({ protocols, tradeType }, 'Routing across V2');
                metric_1.metric.putMetric('SwapRouteFromChain_V2_GetRoutesThenQuotes_Request', 1, metric_1.MetricLoggerUnit.Count);
                const beforeGetRoutesThenQuotes = Date.now();
                quotePromises.push(v2CandidatePoolsPromise.then((v2CandidatePools) => this.v2Quoter.getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, v2CandidatePools, tradeType, routingConfig, undefined, gasPriceWei).then((result) => {
                    metric_1.metric.putMetric(`SwapRouteFromChain_V2_GetRoutesThenQuotes_Load`, Date.now() - beforeGetRoutesThenQuotes, metric_1.MetricLoggerUnit.Milliseconds);
                    return result;
                })));
            }
            // Maybe Quote mixed routes
            // if MixedProtocol is specified or no protocol is specified and v2 is supported AND tradeType is ExactIn
            // AND is Mainnet or Gorli
            if (shouldQueryMixedProtocol && mixedProtocolAllowed) {
                log_1.log.info({ protocols, tradeType }, 'Routing across MixedRoutes');
                metric_1.metric.putMetric('SwapRouteFromChain_Mixed_GetRoutesThenQuotes_Request', 1, metric_1.MetricLoggerUnit.Count);
                const beforeGetRoutesThenQuotes = Date.now();
                quotePromises.push(Promise.all([v3CandidatePoolsPromise, v2CandidatePoolsPromise]).then(([v3CandidatePools, v2CandidatePools]) => this.mixedQuoter.getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, [v3CandidatePools, v2CandidatePools], tradeType, routingConfig, mixedRouteGasModel).then((result) => {
                    metric_1.metric.putMetric(`SwapRouteFromChain_Mixed_GetRoutesThenQuotes_Load`, Date.now() - beforeGetRoutesThenQuotes, metric_1.MetricLoggerUnit.Milliseconds);
                    return result;
                })));
            }
            const getQuotesResults = yield Promise.all(quotePromises);
            const allRoutesWithValidQuotes = [];
            const allCandidatePools = [];
            getQuotesResults.forEach((getQuoteResult) => {
                allRoutesWithValidQuotes.push(...getQuoteResult.routesWithValidQuotes);
                if (getQuoteResult.candidatePools) {
                    allCandidatePools.push(getQuoteResult.candidatePools);
                }
            });
            if (allRoutesWithValidQuotes.length === 0) {
                log_1.log.info({ allRoutesWithValidQuotes }, 'Received no valid quotes');
                return null;
            }
            // Given all the quotes for all the amounts for all the routes, find the best combination.
            const bestSwapRoute = yield (0, best_swap_route_1.getBestSwapRoute)(amount, percents, allRoutesWithValidQuotes, tradeType, this.chainId, routingConfig, this.portionProvider, v3GasModel, swapConfig);
            if (bestSwapRoute) {
                this.emitPoolSelectionMetrics(bestSwapRoute, allCandidatePools);
            }
            return bestSwapRoute;
        });
    }
    tradeTypeStr(tradeType) {
        return tradeType === sdk_core_1.TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut';
    }
    tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType) {
        return `${tokenIn.symbol}/${tokenOut.symbol}/${this.tradeTypeStr(tradeType)}/${this.chainId}`;
    }
    determineCurrencyInOutFromTradeType(tradeType, amount, quoteCurrency) {
        if (tradeType === sdk_core_1.TradeType.EXACT_INPUT) {
            return {
                currencyIn: amount.currency,
                currencyOut: quoteCurrency
            };
        }
        else {
            return {
                currencyIn: quoteCurrency,
                currencyOut: amount.currency
            };
        }
    }
    getGasPriceWei() {
        return __awaiter(this, void 0, void 0, function* () {
            // Track how long it takes to resolve this async call.
            const beforeGasTimestamp = Date.now();
            // Get an estimate of the gas price to use when estimating gas cost of different routes.
            const { gasPriceWei } = yield this.gasPriceProvider.getGasPrice();
            metric_1.metric.putMetric('GasPriceLoad', Date.now() - beforeGasTimestamp, metric_1.MetricLoggerUnit.Milliseconds);
            return gasPriceWei;
        });
    }
    getGasModels(gasPriceWei, amountToken, quoteToken, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGasModel = Date.now();
            const usdPoolPromise = (0, gas_factory_helpers_1.getHighestLiquidityV3USDPool)(this.chainId, this.v3PoolProvider, providerConfig);
            const nativeCurrency = util_1.WRAPPED_NATIVE_CURRENCY[this.chainId];
            const nativeQuoteTokenV3PoolPromise = !quoteToken.equals(nativeCurrency) ? (0, gas_factory_helpers_1.getHighestLiquidityV3NativePool)(quoteToken, this.v3PoolProvider, providerConfig) : Promise.resolve(null);
            const nativeAmountTokenV3PoolPromise = !amountToken.equals(nativeCurrency) ? (0, gas_factory_helpers_1.getHighestLiquidityV3NativePool)(amountToken, this.v3PoolProvider, providerConfig) : Promise.resolve(null);
            const [usdPool, nativeQuoteTokenV3Pool, nativeAmountTokenV3Pool] = yield Promise.all([
                usdPoolPromise,
                nativeQuoteTokenV3PoolPromise,
                nativeAmountTokenV3PoolPromise
            ]);
            const pools = {
                usdPool: usdPool,
                nativeQuoteTokenV3Pool: nativeQuoteTokenV3Pool,
                nativeAmountTokenV3Pool: nativeAmountTokenV3Pool
            };
            const v3GasModelPromise = this.v3GasModelFactory.buildGasModel({
                chainId: this.chainId,
                gasPriceWei,
                pools,
                amountToken,
                quoteToken,
                v2poolProvider: this.v2PoolProvider,
                l2GasDataProvider: this.l2GasDataProvider,
                providerConfig: providerConfig
            });
            const mixedRouteGasModelPromise = this.mixedRouteGasModelFactory.buildGasModel({
                chainId: this.chainId,
                gasPriceWei,
                pools,
                amountToken,
                quoteToken,
                v2poolProvider: this.v2PoolProvider,
                providerConfig: providerConfig
            });
            const [v3GasModel, mixedRouteGasModel] = yield Promise.all([
                v3GasModelPromise,
                mixedRouteGasModelPromise
            ]);
            metric_1.metric.putMetric('GasModelCreation', Date.now() - beforeGasModel, metric_1.MetricLoggerUnit.Milliseconds);
            return [v3GasModel, mixedRouteGasModel];
        });
    }
    // Note multiplications here can result in a loss of precision in the amounts (e.g. taking 50% of 101)
    // This is reconcilled at the end of the algorithm by adding any lost precision to one of
    // the splits in the route.
    getAmountDistribution(amount, routingConfig) {
        const { distributionPercent } = routingConfig;
        const percents = [];
        const amounts = [];
        for (let i = 1; i <= 100 / distributionPercent; i++) {
            percents.push(i * distributionPercent);
            amounts.push(amount.multiply(new sdk_core_1.Fraction(i * distributionPercent, 100)));
        }
        return [percents, amounts];
    }
    buildSwapAndAddMethodParameters(trade, swapAndAddOptions, swapAndAddParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { swapOptions: { recipient, slippageTolerance, deadline, inputTokenPermit }, addLiquidityOptions: addLiquidityConfig, } = swapAndAddOptions;
            const preLiquidityPosition = swapAndAddParameters.preLiquidityPosition;
            const finalBalanceTokenIn = swapAndAddParameters.initialBalanceTokenIn.subtract(trade.inputAmount);
            const finalBalanceTokenOut = swapAndAddParameters.initialBalanceTokenOut.add(trade.outputAmount);
            const approvalTypes = yield this.swapRouterProvider.getApprovalType(finalBalanceTokenIn, finalBalanceTokenOut);
            const zeroForOne = finalBalanceTokenIn.currency.wrapped.sortsBefore(finalBalanceTokenOut.currency.wrapped);
            return Object.assign(Object.assign({}, router_sdk_1.SwapRouter.swapAndAddCallParameters(trade, {
                recipient,
                slippageTolerance,
                deadlineOrPreviousBlockhash: deadline,
                inputTokenPermit,
            }, v3_sdk_1.Position.fromAmounts({
                pool: preLiquidityPosition.pool,
                tickLower: preLiquidityPosition.tickLower,
                tickUpper: preLiquidityPosition.tickUpper,
                amount0: zeroForOne
                    ? finalBalanceTokenIn.quotient.toString()
                    : finalBalanceTokenOut.quotient.toString(),
                amount1: zeroForOne
                    ? finalBalanceTokenOut.quotient.toString()
                    : finalBalanceTokenIn.quotient.toString(),
                useFullPrecision: false,
            }), addLiquidityConfig, approvalTypes.approvalTokenIn, approvalTypes.approvalTokenOut)), { to: (0, util_1.SWAP_ROUTER_02_ADDRESSES)(this.chainId) });
        });
    }
    emitPoolSelectionMetrics(swapRouteRaw, allPoolsBySelection) {
        const poolAddressesUsed = new Set();
        const { routes: routeAmounts } = swapRouteRaw;
        (0, lodash_1.default)(routeAmounts)
            .flatMap((routeAmount) => {
            const { poolAddresses } = routeAmount;
            return poolAddresses;
        })
            .forEach((address) => {
            poolAddressesUsed.add(address.toLowerCase());
        });
        for (const poolsBySelection of allPoolsBySelection) {
            const { protocol } = poolsBySelection;
            lodash_1.default.forIn(poolsBySelection.selections, (pools, topNSelection) => {
                const topNUsed = lodash_1.default.findLastIndex(pools, (pool) => poolAddressesUsed.has(pool.id.toLowerCase())) + 1;
                metric_1.metric.putMetric(lodash_1.default.capitalize(`${protocol}${topNSelection}`), topNUsed, metric_1.MetricLoggerUnit.Count);
            });
        }
        let hasV3Route = false;
        let hasV2Route = false;
        let hasMixedRoute = false;
        for (const routeAmount of routeAmounts) {
            if (routeAmount.protocol === router_sdk_1.Protocol.V3) {
                hasV3Route = true;
            }
            if (routeAmount.protocol === router_sdk_1.Protocol.V2) {
                hasV2Route = true;
            }
            if (routeAmount.protocol === router_sdk_1.Protocol.MIXED) {
                hasMixedRoute = true;
            }
        }
        if (hasMixedRoute && (hasV3Route || hasV2Route)) {
            if (hasV3Route && hasV2Route) {
                metric_1.metric.putMetric(`MixedAndV3AndV2SplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`MixedAndV3AndV2SplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
            else if (hasV3Route) {
                metric_1.metric.putMetric(`MixedAndV3SplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`MixedAndV3SplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
            else if (hasV2Route) {
                metric_1.metric.putMetric(`MixedAndV2SplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`MixedAndV2SplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
        }
        else if (hasV3Route && hasV2Route) {
            metric_1.metric.putMetric(`V3AndV2SplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
            metric_1.metric.putMetric(`V3AndV2SplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
        }
        else if (hasMixedRoute) {
            if (routeAmounts.length > 1) {
                metric_1.metric.putMetric(`MixedSplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`MixedSplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
            else {
                metric_1.metric.putMetric(`MixedRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`MixedRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
        }
        else if (hasV3Route) {
            if (routeAmounts.length > 1) {
                metric_1.metric.putMetric(`V3SplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`V3SplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
            else {
                metric_1.metric.putMetric(`V3Route`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`V3RouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
        }
        else if (hasV2Route) {
            if (routeAmounts.length > 1) {
                metric_1.metric.putMetric(`V2SplitRoute`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`V2SplitRouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
            else {
                metric_1.metric.putMetric(`V2Route`, 1, metric_1.MetricLoggerUnit.Count);
                metric_1.metric.putMetric(`V2RouteForChain${this.chainId}`, 1, metric_1.MetricLoggerUnit.Count);
            }
        }
    }
    calculateOptimalRatio(position, sqrtRatioX96, zeroForOne) {
        const upperSqrtRatioX96 = v3_sdk_1.TickMath.getSqrtRatioAtTick(position.tickUpper);
        const lowerSqrtRatioX96 = v3_sdk_1.TickMath.getSqrtRatioAtTick(position.tickLower);
        // returns Fraction(0, 1) for any out of range position regardless of zeroForOne. Implication: function
        // cannot be used to determine the trading direction of out of range positions.
        if (jsbi_1.default.greaterThan(sqrtRatioX96, upperSqrtRatioX96) ||
            jsbi_1.default.lessThan(sqrtRatioX96, lowerSqrtRatioX96)) {
            return new sdk_core_1.Fraction(0, 1);
        }
        const precision = jsbi_1.default.BigInt('1' + '0'.repeat(18));
        let optimalRatio = new sdk_core_1.Fraction(v3_sdk_1.SqrtPriceMath.getAmount0Delta(sqrtRatioX96, upperSqrtRatioX96, precision, true), v3_sdk_1.SqrtPriceMath.getAmount1Delta(sqrtRatioX96, lowerSqrtRatioX96, precision, true));
        if (!zeroForOne)
            optimalRatio = optimalRatio.invert();
        return optimalRatio;
    }
    userHasSufficientBalance(fromAddress, tradeType, amount, quote) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const neededBalance = tradeType === sdk_core_1.TradeType.EXACT_INPUT ? amount : quote;
                let balance;
                if (neededBalance.currency.isNative) {
                    balance = yield this.provider.getBalance(fromAddress);
                }
                else {
                    const tokenContract = Erc20__factory_1.Erc20__factory.connect(neededBalance.currency.address, this.provider);
                    balance = yield tokenContract.balanceOf(fromAddress);
                }
                return balance.gte(bignumber_1.BigNumber.from(neededBalance.quotient.toString()));
            }
            catch (e) {
                log_1.log.error(e, 'Error while checking user balance');
                return false;
            }
        });
    }
    absoluteValue(fraction) {
        const numeratorAbs = jsbi_1.default.lessThan(fraction.numerator, jsbi_1.default.BigInt(0))
            ? jsbi_1.default.unaryMinus(fraction.numerator)
            : fraction.numerator;
        const denominatorAbs = jsbi_1.default.lessThan(fraction.denominator, jsbi_1.default.BigInt(0))
            ? jsbi_1.default.unaryMinus(fraction.denominator)
            : fraction.denominator;
        return new sdk_core_1.Fraction(numeratorAbs, denominatorAbs);
    }
    getBlockNumberPromise() {
        return (0, async_retry_1.default)((_b, attempt) => __awaiter(this, void 0, void 0, function* () {
            if (attempt > 1) {
                log_1.log.info(`Get block number attempt ${attempt}`);
            }
            return this.provider.getBlockNumber();
        }), {
            retries: 2,
            minTimeout: 100,
            maxTimeout: 1000,
        });
    }
}
exports.AlphaRouter = AlphaRouter;
