import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list';
import { Protocol, SwapRouter, ZERO } from '@uniswap/router-sdk';
import { ChainId, Fraction, TradeType } from '@uniswap/sdk-core';
import { Pool, Position, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
import retry from 'async-retry';
import JSBI from 'jsbi';
import _ from 'lodash';
import NodeCache from 'node-cache';
import { CachedRoutes, CacheMode, CachingGasStationProvider, CachingTokenProviderWithFallback, CachingV2PoolProvider, CachingV2SubgraphProvider, CachingV3PoolProvider, CachingV3SubgraphProvider, EIP1559GasPriceProvider, ETHGasStationInfoProvider, LegacyGasPriceProvider, NodeJSCache, OnChainGasPriceProvider, OnChainQuoteProvider, StaticV2SubgraphProvider, StaticV3SubgraphProvider, SwapRouterProvider, TokenPropertiesProvider, UniswapMulticallProvider, URISubgraphProvider, V2QuoteProvider, V2SubgraphProviderWithFallBacks, V3SubgraphProviderWithFallBacks } from '../../providers';
import { CachingTokenListProvider } from '../../providers/caching-token-list-provider';
import { PortionProvider } from '../../providers/portion-provider';
import { OnChainTokenFeeFetcher } from '../../providers/token-fee-fetcher';
import { TokenProvider } from '../../providers/token-provider';
import { TokenValidatorProvider } from '../../providers/token-validator-provider';
import { V2PoolProvider } from '../../providers/v2/pool-provider';
import { ArbitrumGasDataProvider, OptimismGasDataProvider } from '../../providers/v3/gas-data-provider';
import { V3PoolProvider } from '../../providers/v3/pool-provider';
import { Erc20__factory } from '../../types/other/factories/Erc20__factory';
import { SWAP_ROUTER_02_ADDRESSES, WRAPPED_NATIVE_CURRENCY } from '../../util';
import { CurrencyAmount } from '../../util/amounts';
import { ID_TO_CHAIN_ID, ID_TO_NETWORK_NAME, V2_SUPPORTED } from '../../util/chains';
import { getHighestLiquidityV3NativePool, getHighestLiquidityV3USDPool } from '../../util/gas-factory-helpers';
import { log } from '../../util/log';
import { buildSwapMethodParameters, buildTrade } from '../../util/methodParameters';
import { metric, MetricLoggerUnit } from '../../util/metric';
import { UNSUPPORTED_TOKENS } from '../../util/unsupported-tokens';
import { SwapToRatioStatus, } from '../router';
import { DEFAULT_ROUTING_CONFIG_BY_CHAIN, ETH_GAS_STATION_API_URL } from './config';
import { getBestSwapRoute } from './functions/best-swap-route';
import { calculateRatioAmountIn } from './functions/calculate-ratio-amount-in';
import { getV2CandidatePools, getV3CandidatePools } from './functions/get-candidate-pools';
import { MixedRouteHeuristicGasModelFactory } from './gas-models/mixedRoute/mixed-route-heuristic-gas-model';
import { V2HeuristicGasModelFactory } from './gas-models/v2/v2-heuristic-gas-model';
import { NATIVE_OVERHEAD } from './gas-models/v3/gas-costs';
import { V3HeuristicGasModelFactory } from './gas-models/v3/v3-heuristic-gas-model';
import { MixedQuoter, V2Quoter, V3Quoter } from './quoters';
export class MapWithLowerCaseKey extends Map {
    set(key, value) {
        return super.set(key.toLowerCase(), value);
    }
}
export class LowerCaseStringArray extends Array {
    constructor(...items) {
        // Convert all items to lowercase before calling the parent constructor
        super(...items.map(item => item.toLowerCase()));
    }
}
export class AlphaRouter {
    constructor({ chainId, provider, multicall2Provider, v3PoolProvider, onChainQuoteProvider, v2PoolProvider, v2QuoteProvider, v2SubgraphProvider, tokenProvider, blockedTokenListProvider, v3SubgraphProvider, gasPriceProvider, v3GasModelFactory, v2GasModelFactory, mixedRouteGasModelFactory, swapRouterProvider, optimismGasDataProvider, tokenValidatorProvider, arbitrumGasDataProvider, simulator, routeCachingProvider, tokenPropertiesProvider, portionProvider, }) {
        this.chainId = chainId;
        this.provider = provider;
        this.multicall2Provider =
            multicall2Provider !== null && multicall2Provider !== void 0 ? multicall2Provider : new UniswapMulticallProvider(chainId, provider, 375000);
        this.v3PoolProvider =
            v3PoolProvider !== null && v3PoolProvider !== void 0 ? v3PoolProvider : new CachingV3PoolProvider(this.chainId, new V3PoolProvider(ID_TO_CHAIN_ID(chainId), this.multicall2Provider), new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false })));
        this.simulator = simulator;
        this.routeCachingProvider = routeCachingProvider;
        if (onChainQuoteProvider) {
            this.onChainQuoteProvider = onChainQuoteProvider;
        }
        else {
            switch (chainId) {
                case ChainId.OPTIMISM:
                case ChainId.OPTIMISM_GOERLI:
                    this.onChainQuoteProvider = new OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
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
                case ChainId.BASE:
                case ChainId.BASE_GOERLI:
                    this.onChainQuoteProvider = new OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
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
                case ChainId.ARBITRUM_ONE:
                case ChainId.ARBITRUM_GOERLI:
                    this.onChainQuoteProvider = new OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
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
                case ChainId.CELO:
                case ChainId.CELO_ALFAJORES:
                case ChainId.SMARTBCH:
                    this.onChainQuoteProvider = new OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
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
                default:
                    this.onChainQuoteProvider = new OnChainQuoteProvider(chainId, provider, this.multicall2Provider, {
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
        else if (this.chainId === ChainId.MAINNET) {
            this.tokenValidatorProvider = new TokenValidatorProvider(this.chainId, this.multicall2Provider, new NodeJSCache(new NodeCache({ stdTTL: 30000, useClones: false })));
        }
        if (tokenPropertiesProvider) {
            this.tokenPropertiesProvider = tokenPropertiesProvider;
        }
        else {
            this.tokenPropertiesProvider = new TokenPropertiesProvider(this.chainId, new NodeJSCache(new NodeCache({ stdTTL: 86400, useClones: false })), new OnChainTokenFeeFetcher(this.chainId, provider));
        }
        this.v2PoolProvider =
            v2PoolProvider !== null && v2PoolProvider !== void 0 ? v2PoolProvider : new CachingV2PoolProvider(chainId, new V2PoolProvider(chainId, this.multicall2Provider, this.tokenPropertiesProvider), new NodeJSCache(new NodeCache({ stdTTL: 60, useClones: false })));
        this.v2QuoteProvider = v2QuoteProvider !== null && v2QuoteProvider !== void 0 ? v2QuoteProvider : new V2QuoteProvider();
        this.blockedTokenListProvider =
            blockedTokenListProvider !== null && blockedTokenListProvider !== void 0 ? blockedTokenListProvider : new CachingTokenListProvider(chainId, UNSUPPORTED_TOKENS, new NodeJSCache(new NodeCache({ stdTTL: 3600, useClones: false })));
        this.tokenProvider =
            tokenProvider !== null && tokenProvider !== void 0 ? tokenProvider : new CachingTokenProviderWithFallback(chainId, new NodeJSCache(new NodeCache({ stdTTL: 3600, useClones: false })), new CachingTokenListProvider(chainId, DEFAULT_TOKEN_LIST, new NodeJSCache(new NodeCache({ stdTTL: 3600, useClones: false }))), new TokenProvider(chainId, this.multicall2Provider));
        this.portionProvider = portionProvider !== null && portionProvider !== void 0 ? portionProvider : new PortionProvider();
        const chainName = ID_TO_NETWORK_NAME(chainId);
        // ipfs urls in the following format: `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/${protocol}/${chainName}.json`;
        if (v2SubgraphProvider) {
            this.v2SubgraphProvider = v2SubgraphProvider;
        }
        else {
            this.v2SubgraphProvider = new V2SubgraphProviderWithFallBacks([
                new CachingV2SubgraphProvider(chainId, new URISubgraphProvider(chainId, `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/v2/${chainName}.json`, undefined, 0), new NodeJSCache(new NodeCache({ stdTTL: 300, useClones: false }))),
                new StaticV2SubgraphProvider(chainId),
            ]);
        }
        if (v3SubgraphProvider) {
            this.v3SubgraphProvider = v3SubgraphProvider;
        }
        else {
            this.v3SubgraphProvider = new V3SubgraphProviderWithFallBacks([
                new CachingV3SubgraphProvider(chainId, new URISubgraphProvider(chainId, `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/v3/${chainName}.json`, undefined, 0), new NodeJSCache(new NodeCache({ stdTTL: 300, useClones: false }))),
                new StaticV3SubgraphProvider(chainId, this.v3PoolProvider),
            ]);
        }
        let gasPriceProviderInstance;
        if (JsonRpcProvider.isProvider(this.provider)) {
            gasPriceProviderInstance = new OnChainGasPriceProvider(chainId, new EIP1559GasPriceProvider(this.provider), new LegacyGasPriceProvider(this.provider));
        }
        else {
            gasPriceProviderInstance = new ETHGasStationInfoProvider(ETH_GAS_STATION_API_URL);
        }
        this.gasPriceProvider =
            gasPriceProvider !== null && gasPriceProvider !== void 0 ? gasPriceProvider : new CachingGasStationProvider(chainId, gasPriceProviderInstance, new NodeJSCache(new NodeCache({ stdTTL: 7, useClones: false })));
        this.v3GasModelFactory =
            v3GasModelFactory !== null && v3GasModelFactory !== void 0 ? v3GasModelFactory : new V3HeuristicGasModelFactory();
        this.v2GasModelFactory =
            v2GasModelFactory !== null && v2GasModelFactory !== void 0 ? v2GasModelFactory : new V2HeuristicGasModelFactory();
        this.mixedRouteGasModelFactory =
            mixedRouteGasModelFactory !== null && mixedRouteGasModelFactory !== void 0 ? mixedRouteGasModelFactory : new MixedRouteHeuristicGasModelFactory();
        this.swapRouterProvider =
            swapRouterProvider !== null && swapRouterProvider !== void 0 ? swapRouterProvider : new SwapRouterProvider(this.multicall2Provider, this.chainId);
        if (chainId === ChainId.OPTIMISM || chainId === ChainId.BASE) {
            this.l2GasDataProvider =
                optimismGasDataProvider !== null && optimismGasDataProvider !== void 0 ? optimismGasDataProvider : new OptimismGasDataProvider(chainId, this.multicall2Provider);
        }
        if (chainId === ChainId.ARBITRUM_ONE ||
            chainId === ChainId.ARBITRUM_GOERLI) {
            this.l2GasDataProvider =
                arbitrumGasDataProvider !== null && arbitrumGasDataProvider !== void 0 ? arbitrumGasDataProvider : new ArbitrumGasDataProvider(chainId, this.provider);
        }
        // Initialize the Quoters.
        // Quoters are an abstraction encapsulating the business logic of fetching routes and quotes.
        this.v2Quoter = new V2Quoter(this.v2SubgraphProvider, this.v2PoolProvider, this.v2QuoteProvider, this.v2GasModelFactory, this.tokenProvider, this.chainId, this.blockedTokenListProvider, this.tokenValidatorProvider);
        this.v3Quoter = new V3Quoter(this.v3SubgraphProvider, this.v3PoolProvider, this.onChainQuoteProvider, this.tokenProvider, this.chainId, this.blockedTokenListProvider, this.tokenValidatorProvider);
        this.mixedQuoter = new MixedQuoter(this.v3SubgraphProvider, this.v3PoolProvider, this.v2SubgraphProvider, this.v2PoolProvider, this.onChainQuoteProvider, this.tokenProvider, this.chainId, this.blockedTokenListProvider, this.tokenValidatorProvider);
    }
    async routeToRatio(token0Balance, token1Balance, position, swapAndAddConfig, swapAndAddOptions, routingConfig = DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId)) {
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
            zeroForOne = new Fraction(token0Balance.quotient, token1Balance.quotient).greaterThan(preSwapOptimalRatio);
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
                log.info('max iterations exceeded');
                return {
                    status: SwapToRatioStatus.NO_ROUTE_FOUND,
                    error: 'max iterations exceeded',
                };
            }
            const amountToSwap = calculateRatioAmountIn(optimalRatio, exchangeRate, inputBalance, outputBalance);
            if (amountToSwap.equalTo(0)) {
                log.info(`no swap needed: amountToSwap = 0`);
                return {
                    status: SwapToRatioStatus.NO_SWAP_NEEDED,
                };
            }
            swap = await this.route(amountToSwap, outputBalance.currency, TradeType.EXACT_INPUT, undefined, {
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId),
                ...routingConfig,
                /// @dev We do not want to query for mixedRoutes for routeToRatio as they are not supported
                /// [Protocol.V3, Protocol.V2] will make sure we only query for V3 and V2
                protocols: [Protocol.V3, Protocol.V2],
            });
            if (!swap) {
                log.info('no route found from this.route()');
                return {
                    status: SwapToRatioStatus.NO_ROUTE_FOUND,
                    error: 'no route found',
                };
            }
            const inputBalanceUpdated = inputBalance.subtract(swap.trade.inputAmount);
            const outputBalanceUpdated = outputBalance.add(swap.trade.outputAmount);
            const newRatio = inputBalanceUpdated.divide(outputBalanceUpdated);
            let targetPoolPriceUpdate;
            swap.route.forEach((route) => {
                if (route.protocol === Protocol.V3) {
                    const v3Route = route;
                    v3Route.route.pools.forEach((pool, i) => {
                        if (pool.token0.equals(position.pool.token0) &&
                            pool.token1.equals(position.pool.token1) &&
                            pool.fee === position.pool.fee) {
                            targetPoolPriceUpdate = JSBI.BigInt(v3Route.sqrtPriceX96AfterList[i].toString());
                            optimalRatio = this.calculateOptimalRatio(position, JSBI.BigInt(targetPoolPriceUpdate.toString()), zeroForOne);
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
                postSwapTargetPool = new Pool(position.pool.token0, position.pool.token1, position.pool.fee, targetPoolPriceUpdate, position.pool.liquidity, TickMath.getTickAtSqrtRatio(targetPoolPriceUpdate), position.pool.tickDataProvider);
            }
            exchangeRate = swap.trade.outputAmount.divide(swap.trade.inputAmount);
            log.info({
                exchangeRate: exchangeRate.asFraction.toFixed(18),
                optimalRatio: optimalRatio.asFraction.toFixed(18),
                newRatio: newRatio.asFraction.toFixed(18),
                inputBalanceUpdated: inputBalanceUpdated.asFraction.toFixed(18),
                outputBalanceUpdated: outputBalanceUpdated.asFraction.toFixed(18),
                ratioErrorTolerance: swapAndAddConfig.ratioErrorTolerance.toFixed(18),
                iterationN: n.toString(),
            }, 'QuoteToRatio Iteration Parameters');
            if (exchangeRate.equalTo(0)) {
                log.info('exchangeRate to 0');
                return {
                    status: SwapToRatioStatus.NO_ROUTE_FOUND,
                    error: 'insufficient liquidity to swap to optimal ratio',
                };
            }
        }
        if (!swap) {
            return {
                status: SwapToRatioStatus.NO_ROUTE_FOUND,
                error: 'no route found',
            };
        }
        let methodParameters;
        if (swapAndAddOptions) {
            methodParameters = await this.buildSwapAndAddMethodParameters(swap.trade, swapAndAddOptions, {
                initialBalanceTokenIn: inputBalance,
                initialBalanceTokenOut: outputBalance,
                preLiquidityPosition: position,
            });
        }
        return {
            status: SwapToRatioStatus.SUCCESS,
            result: { ...swap, methodParameters, optimalRatio, postSwapTargetPool },
        };
    }
    /**
     * @inheritdoc IRouter
     */
    async route(amount, quoteCurrency, tradeType, swapConfig, partialRoutingConfig = {}) {
        var _a, _c, _d, _e;
        const originalAmount = amount;
        if (tradeType === TradeType.EXACT_OUTPUT) {
            const portionAmount = this.portionProvider.getPortionAmount(amount, tradeType, swapConfig);
            if (portionAmount && portionAmount.greaterThan(ZERO)) {
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
        metric.setProperty('chainId', this.chainId);
        metric.setProperty('pair', `${tokenIn.symbol}/${tokenOut.symbol}`);
        metric.setProperty('tokenIn', tokenIn.address);
        metric.setProperty('tokenOut', tokenOut.address);
        metric.setProperty('tradeType', tradeType === TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut');
        metric.putMetric(`QuoteRequestedForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
        // Get a block number to specify in all our calls. Ensures data we fetch from chain is
        // from the same block.
        const blockNumber = (_a = partialRoutingConfig.blockNumber) !== null && _a !== void 0 ? _a : this.getBlockNumberPromise();
        const routingConfig = _.merge({
            // These settings could be changed by the partialRoutingConfig
            useCachedRoutes: true,
            writeToCachedRoutes: true,
            optimisticCachedRoutes: false,
        }, DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId), partialRoutingConfig, { blockNumber });
        if (routingConfig.debugRouting) {
            log.warn(`Finalized routing config is ${JSON.stringify(routingConfig)}`);
        }
        const gasPriceWei = await this.getGasPriceWei();
        const quoteToken = quoteCurrency.wrapped;
        const providerConfig = {
            ...routingConfig,
            blockNumber,
            additionalGasOverhead: NATIVE_OVERHEAD(this.chainId, amount.currency, quoteCurrency),
        };
        const [v3GasModel, mixedRouteGasModel] = await this.getGasModels(gasPriceWei, amount.currency.wrapped, quoteToken, providerConfig);
        // Create a Set to sanitize the protocols input, a Set of undefined becomes an empty set,
        // Then create an Array from the values of that Set.
        const protocols = Array.from(new Set(routingConfig.protocols).values());
        const cacheMode = (_c = routingConfig.overwriteCacheMode) !== null && _c !== void 0 ? _c : await ((_d = this.routeCachingProvider) === null || _d === void 0 ? void 0 : _d.getCacheMode(this.chainId, amount, quoteToken, tradeType, protocols));
        // Fetch CachedRoutes
        let cachedRoutes;
        if (routingConfig.useCachedRoutes && cacheMode !== CacheMode.Darkmode) {
            cachedRoutes = await ((_e = this.routeCachingProvider) === null || _e === void 0 ? void 0 : _e.getCachedRoute(this.chainId, amount, quoteToken, tradeType, protocols, await blockNumber, routingConfig.optimisticCachedRoutes));
        }
        metric.putMetric(routingConfig.useCachedRoutes ? 'GetQuoteUsingCachedRoutes' : 'GetQuoteNotUsingCachedRoutes', 1, MetricLoggerUnit.Count);
        if (cacheMode && routingConfig.useCachedRoutes && cacheMode !== CacheMode.Darkmode && !cachedRoutes) {
            metric.putMetric(`GetCachedRoute_miss_${cacheMode}`, 1, MetricLoggerUnit.Count);
            log.info({
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
            metric.putMetric(`GetCachedRoute_hit_${cacheMode}`, 1, MetricLoggerUnit.Count);
            log.info({
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
            swapRouteFromCachePromise = this.getSwapRouteFromCache(cachedRoutes, await blockNumber, amount, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig);
        }
        // let swapRouteFromChainPromise: Promise<BestSwapRoute | null> = Promise.resolve(null);
        // if (!cachedRoutes || cacheMode !== CacheMode.Livemode) {
        //   swapRouteFromChainPromise = this.getSwapRouteFromChain(
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
        //   );
        // }
        const swapRouteFromCache = await swapRouteFromCachePromise;
        const swapRouteFromChain = await this.getSwapRouteFromChain(amount, tokenIn, tokenOut, protocols, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig);
        ;
        let swapRouteRaw;
        let hitsCachedRoute = false;
        if (cacheMode === CacheMode.Livemode && swapRouteFromCache) {
            log.info(`CacheMode is ${cacheMode}, and we are using swapRoute from cache`);
            hitsCachedRoute = true;
            swapRouteRaw = swapRouteFromCache;
        }
        else {
            log.info(`CacheMode is ${cacheMode}, and we are using materialized swapRoute`);
            swapRouteRaw = swapRouteFromChain;
        }
        if (cacheMode === CacheMode.Tapcompare && swapRouteFromCache && swapRouteFromChain) {
            const quoteDiff = swapRouteFromChain.quote.subtract(swapRouteFromCache.quote);
            const quoteGasAdjustedDiff = swapRouteFromChain.quoteGasAdjusted.subtract(swapRouteFromCache.quoteGasAdjusted);
            const gasUsedDiff = swapRouteFromChain.estimatedGasUsed.sub(swapRouteFromCache.estimatedGasUsed);
            // Only log if quoteDiff is different from 0, or if quoteGasAdjustedDiff and gasUsedDiff are both different from 0
            if (!quoteDiff.equalTo(0) || !(quoteGasAdjustedDiff.equalTo(0) || gasUsedDiff.eq(0))) {
                // Calculates the percentage of the difference with respect to the quoteFromChain (not from cache)
                const misquotePercent = quoteGasAdjustedDiff.divide(swapRouteFromChain.quoteGasAdjusted).multiply(100);
                metric.putMetric(`TapcompareCachedRoute_quoteGasAdjustedDiffPercent`, Number(misquotePercent.toExact()), MetricLoggerUnit.Percent);
                log.warn({
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
            cacheMode !== CacheMode.Darkmode &&
            swapRouteFromChain) {
            // Generate the object to be cached
            const routesToCache = CachedRoutes.fromRoutesWithValidQuotes(swapRouteFromChain.routes, this.chainId, tokenIn, tokenOut, protocols.sort(), // sort it for consistency in the order of the protocols.
            await blockNumber, tradeType, amount.toExact());
            if (routesToCache) {
                // Attempt to insert the entry in cache. This is fire and forget promise.
                // The catch method will prevent any exception from blocking the normal code execution.
                this.routeCachingProvider.setCachedRoute(routesToCache, amount).then((success) => {
                    const status = success ? 'success' : 'rejected';
                    metric.putMetric(`SetCachedRoute_${status}`, 1, MetricLoggerUnit.Count);
                }).catch((reason) => {
                    log.error({
                        reason: reason,
                        tokenPair: this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType),
                    }, `SetCachedRoute failure`);
                    metric.putMetric(`SetCachedRoute_failure`, 1, MetricLoggerUnit.Count);
                });
            }
            else {
                metric.putMetric(`SetCachedRoute_unnecessary`, 1, MetricLoggerUnit.Count);
            }
        }
        metric.putMetric(`QuoteFoundForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
        // Build Trade object that represents the optimal swap.
        const trade = buildTrade(currencyIn, currencyOut, tradeType, routeAmounts);
        let methodParameters;
        // If user provided recipient, deadline etc. we also generate the calldata required to execute
        // the swap and return it too.
        if (swapConfig) {
            methodParameters = buildSwapMethodParameters(trade, swapConfig, this.chainId);
        }
        const tokenOutAmount = tradeType === TradeType.EXACT_OUTPUT ?
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
            blockNumber: BigNumber.from(await blockNumber),
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
            log.info({ swapConfig, methodParameters }, 'Starting simulation');
            const fromAddress = swapConfig.simulate.fromAddress;
            const beforeSimulate = Date.now();
            const swapRouteWithSimulation = await this.simulator.simulate(fromAddress, swapConfig, swapRoute, amount, 
            // Quote will be in WETH even if quoteCurrency is ETH
            // So we init a new CurrencyAmount object here
            CurrencyAmount.fromRawAmount(quoteCurrency, quote.quotient.toString()), this.l2GasDataProvider
                ? await this.l2GasDataProvider.getGasData()
                : undefined, providerConfig);
            metric.putMetric('SimulateTransaction', Date.now() - beforeSimulate, MetricLoggerUnit.Milliseconds);
            return swapRouteWithSimulation;
        }
        return swapRoute;
    }
    async getSwapRouteFromCache(cachedRoutes, blockNumber, amount, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig) {
        log.info({
            protocols: cachedRoutes.protocolsCovered,
            tradeType: cachedRoutes.tradeType,
            cachedBlockNumber: cachedRoutes.blockNumber,
            quoteBlockNumber: blockNumber,
        }, 'Routing across CachedRoute');
        const quotePromises = [];
        const v3Routes = cachedRoutes.routes.filter((route) => route.protocol === Protocol.V3);
        const v2Routes = cachedRoutes.routes.filter((route) => route.protocol === Protocol.V2);
        const mixedRoutes = cachedRoutes.routes.filter((route) => route.protocol === Protocol.MIXED);
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
            metric.putMetric('SwapRouteFromCache_V3_GetQuotes_Request', 1, MetricLoggerUnit.Count);
            const beforeGetQuotes = Date.now();
            quotePromises.push(this.v3Quoter.getQuotes(v3RoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, undefined, v3GasModel).then((result) => {
                metric.putMetric(`SwapRouteFromCache_V3_GetQuotes_Load`, Date.now() - beforeGetQuotes, MetricLoggerUnit.Milliseconds);
                return result;
            }));
        }
        if (v2Routes.length > 0) {
            const v2RoutesFromCache = v2Routes.map((cachedRoute) => cachedRoute.route);
            metric.putMetric('SwapRouteFromCache_V2_GetQuotes_Request', 1, MetricLoggerUnit.Count);
            const beforeGetQuotes = Date.now();
            quotePromises.push(this.v2Quoter.refreshRoutesThenGetQuotes(cachedRoutes.tokenIn, cachedRoutes.tokenOut, v2RoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, gasPriceWei).then((result) => {
                metric.putMetric(`SwapRouteFromCache_V2_GetQuotes_Load`, Date.now() - beforeGetQuotes, MetricLoggerUnit.Milliseconds);
                return result;
            }));
        }
        if (mixedRoutes.length > 0) {
            const mixedRoutesFromCache = mixedRoutes.map((cachedRoute) => cachedRoute.route);
            metric.putMetric('SwapRouteFromCache_Mixed_GetQuotes_Request', 1, MetricLoggerUnit.Count);
            const beforeGetQuotes = Date.now();
            quotePromises.push(this.mixedQuoter.getQuotes(mixedRoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, undefined, mixedRouteGasModel).then((result) => {
                metric.putMetric(`SwapRouteFromCache_Mixed_GetQuotes_Load`, Date.now() - beforeGetQuotes, MetricLoggerUnit.Milliseconds);
                return result;
            }));
        }
        const getQuotesResults = await Promise.all(quotePromises);
        const allRoutesWithValidQuotes = _.flatMap(getQuotesResults, (quoteResult) => quoteResult.routesWithValidQuotes);
        return getBestSwapRoute(amount, percents, allRoutesWithValidQuotes, tradeType, this.chainId, routingConfig, this.portionProvider, v3GasModel, swapConfig);
    }
    async getSwapRouteFromChain(amount, tokenIn, tokenOut, protocols, quoteToken, tradeType, routingConfig, v3GasModel, mixedRouteGasModel, gasPriceWei, swapConfig) {
        // Generate our distribution of amounts, i.e. fractions of the input amount.
        // We will get quotes for fractions of the input amount for different routes, then
        // combine to generate split routes.
        const [percents, amounts] = this.getAmountDistribution(amount, routingConfig);
        const noProtocolsSpecified = protocols.length === 0;
        const v3ProtocolSpecified = protocols.includes(Protocol.V3);
        const v2ProtocolSpecified = protocols.includes(Protocol.V2);
        const v2SupportedInChain = V2_SUPPORTED.includes(this.chainId);
        const shouldQueryMixedProtocol = protocols.includes(Protocol.MIXED) || (noProtocolsSpecified && v2SupportedInChain);
        const mixedProtocolAllowed = [ChainId.MAINNET, ChainId.GOERLI].includes(this.chainId) &&
            tradeType === TradeType.EXACT_INPUT;
        const beforeGetCandidates = Date.now();
        let v3CandidatePoolsPromise = Promise.resolve(undefined);
        if (v3ProtocolSpecified ||
            noProtocolsSpecified ||
            (shouldQueryMixedProtocol && mixedProtocolAllowed)) {
            v3CandidatePoolsPromise = getV3CandidatePools({
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
                metric.putMetric('GetV3CandidatePools', Date.now() - beforeGetCandidates, MetricLoggerUnit.Milliseconds);
                return candidatePools;
            });
        }
        let v2CandidatePoolsPromise = Promise.resolve(undefined);
        if ((v2SupportedInChain && (v2ProtocolSpecified || noProtocolsSpecified)) ||
            (shouldQueryMixedProtocol && mixedProtocolAllowed)) {
            // Fetch all the pools that we will consider routing via. There are thousands
            // of pools, so we filter them to a set of candidate pools that we expect will
            // result in good prices.
            v2CandidatePoolsPromise = getV2CandidatePools({
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
                metric.putMetric('GetV2CandidatePools', Date.now() - beforeGetCandidates, MetricLoggerUnit.Milliseconds);
                return candidatePools;
            });
        }
        const quotePromises = [];
        // Maybe Quote V3 - if V3 is specified, or no protocol is specified
        if (v3ProtocolSpecified || noProtocolsSpecified) {
            log.info({ protocols, tradeType }, 'Routing across V3');
            metric.putMetric('SwapRouteFromChain_V3_GetRoutesThenQuotes_Request', 1, MetricLoggerUnit.Count);
            const beforeGetRoutesThenQuotes = Date.now();
            quotePromises.push(v3CandidatePoolsPromise.then((v3CandidatePools) => this.v3Quoter.getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, v3CandidatePools, tradeType, routingConfig, v3GasModel).then((result) => {
                metric.putMetric(`SwapRouteFromChain_V3_GetRoutesThenQuotes_Load`, Date.now() - beforeGetRoutesThenQuotes, MetricLoggerUnit.Milliseconds);
                return result;
            })));
        }
        // Maybe Quote V2 - if V2 is specified, or no protocol is specified AND v2 is supported in this chain
        if (v2SupportedInChain && (v2ProtocolSpecified || noProtocolsSpecified)) {
            log.info({ protocols, tradeType }, 'Routing across V2');
            metric.putMetric('SwapRouteFromChain_V2_GetRoutesThenQuotes_Request', 1, MetricLoggerUnit.Count);
            const beforeGetRoutesThenQuotes = Date.now();
            quotePromises.push(v2CandidatePoolsPromise.then((v2CandidatePools) => this.v2Quoter.getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, v2CandidatePools, tradeType, routingConfig, undefined, gasPriceWei).then((result) => {
                metric.putMetric(`SwapRouteFromChain_V2_GetRoutesThenQuotes_Load`, Date.now() - beforeGetRoutesThenQuotes, MetricLoggerUnit.Milliseconds);
                return result;
            })));
        }
        // Maybe Quote mixed routes
        // if MixedProtocol is specified or no protocol is specified and v2 is supported AND tradeType is ExactIn
        // AND is Mainnet or Gorli
        if (shouldQueryMixedProtocol && mixedProtocolAllowed) {
            log.info({ protocols, tradeType }, 'Routing across MixedRoutes');
            metric.putMetric('SwapRouteFromChain_Mixed_GetRoutesThenQuotes_Request', 1, MetricLoggerUnit.Count);
            const beforeGetRoutesThenQuotes = Date.now();
            quotePromises.push(Promise.all([v3CandidatePoolsPromise, v2CandidatePoolsPromise]).then(([v3CandidatePools, v2CandidatePools]) => this.mixedQuoter.getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, [v3CandidatePools, v2CandidatePools], tradeType, routingConfig, mixedRouteGasModel).then((result) => {
                metric.putMetric(`SwapRouteFromChain_Mixed_GetRoutesThenQuotes_Load`, Date.now() - beforeGetRoutesThenQuotes, MetricLoggerUnit.Milliseconds);
                return result;
            })));
        }
        const getQuotesResults = await Promise.all(quotePromises);
        const allRoutesWithValidQuotes = [];
        const allCandidatePools = [];
        getQuotesResults.forEach((getQuoteResult) => {
            allRoutesWithValidQuotes.push(...getQuoteResult.routesWithValidQuotes);
            if (getQuoteResult.candidatePools) {
                allCandidatePools.push(getQuoteResult.candidatePools);
            }
        });
        if (allRoutesWithValidQuotes.length === 0) {
            log.info({ allRoutesWithValidQuotes }, 'Received no valid quotes');
            return null;
        }
        // Given all the quotes for all the amounts for all the routes, find the best combination.
        const bestSwapRoute = await getBestSwapRoute(amount, percents, allRoutesWithValidQuotes, tradeType, this.chainId, routingConfig, this.portionProvider, v3GasModel, swapConfig);
        if (bestSwapRoute) {
            this.emitPoolSelectionMetrics(bestSwapRoute, allCandidatePools);
        }
        return bestSwapRoute;
    }
    tradeTypeStr(tradeType) {
        return tradeType === TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut';
    }
    tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType) {
        return `${tokenIn.symbol}/${tokenOut.symbol}/${this.tradeTypeStr(tradeType)}/${this.chainId}`;
    }
    determineCurrencyInOutFromTradeType(tradeType, amount, quoteCurrency) {
        if (tradeType === TradeType.EXACT_INPUT) {
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
    async getGasPriceWei() {
        // Track how long it takes to resolve this async call.
        const beforeGasTimestamp = Date.now();
        // Get an estimate of the gas price to use when estimating gas cost of different routes.
        const { gasPriceWei } = await this.gasPriceProvider.getGasPrice();
        metric.putMetric('GasPriceLoad', Date.now() - beforeGasTimestamp, MetricLoggerUnit.Milliseconds);
        return gasPriceWei;
    }
    async getGasModels(gasPriceWei, amountToken, quoteToken, providerConfig) {
        const beforeGasModel = Date.now();
        const usdPoolPromise = getHighestLiquidityV3USDPool(this.chainId, this.v3PoolProvider, providerConfig);
        const nativeCurrency = WRAPPED_NATIVE_CURRENCY[this.chainId];
        const nativeQuoteTokenV3PoolPromise = !quoteToken.equals(nativeCurrency) ? getHighestLiquidityV3NativePool(quoteToken, this.v3PoolProvider, providerConfig) : Promise.resolve(null);
        const nativeAmountTokenV3PoolPromise = !amountToken.equals(nativeCurrency) ? getHighestLiquidityV3NativePool(amountToken, this.v3PoolProvider, providerConfig) : Promise.resolve(null);
        const [usdPool, nativeQuoteTokenV3Pool, nativeAmountTokenV3Pool] = await Promise.all([
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
        const [v3GasModel, mixedRouteGasModel] = await Promise.all([
            v3GasModelPromise,
            mixedRouteGasModelPromise
        ]);
        metric.putMetric('GasModelCreation', Date.now() - beforeGasModel, MetricLoggerUnit.Milliseconds);
        return [v3GasModel, mixedRouteGasModel];
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
            amounts.push(amount.multiply(new Fraction(i * distributionPercent, 100)));
        }
        return [percents, amounts];
    }
    async buildSwapAndAddMethodParameters(trade, swapAndAddOptions, swapAndAddParameters) {
        const { swapOptions: { recipient, slippageTolerance, deadline, inputTokenPermit }, addLiquidityOptions: addLiquidityConfig, } = swapAndAddOptions;
        const preLiquidityPosition = swapAndAddParameters.preLiquidityPosition;
        const finalBalanceTokenIn = swapAndAddParameters.initialBalanceTokenIn.subtract(trade.inputAmount);
        const finalBalanceTokenOut = swapAndAddParameters.initialBalanceTokenOut.add(trade.outputAmount);
        const approvalTypes = await this.swapRouterProvider.getApprovalType(finalBalanceTokenIn, finalBalanceTokenOut);
        const zeroForOne = finalBalanceTokenIn.currency.wrapped.sortsBefore(finalBalanceTokenOut.currency.wrapped);
        return {
            ...SwapRouter.swapAndAddCallParameters(trade, {
                recipient,
                slippageTolerance,
                deadlineOrPreviousBlockhash: deadline,
                inputTokenPermit,
            }, Position.fromAmounts({
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
            }), addLiquidityConfig, approvalTypes.approvalTokenIn, approvalTypes.approvalTokenOut),
            to: SWAP_ROUTER_02_ADDRESSES(this.chainId),
        };
    }
    emitPoolSelectionMetrics(swapRouteRaw, allPoolsBySelection) {
        const poolAddressesUsed = new Set();
        const { routes: routeAmounts } = swapRouteRaw;
        _(routeAmounts)
            .flatMap((routeAmount) => {
            const { poolAddresses } = routeAmount;
            return poolAddresses;
        })
            .forEach((address) => {
            poolAddressesUsed.add(address.toLowerCase());
        });
        for (const poolsBySelection of allPoolsBySelection) {
            const { protocol } = poolsBySelection;
            _.forIn(poolsBySelection.selections, (pools, topNSelection) => {
                const topNUsed = _.findLastIndex(pools, (pool) => poolAddressesUsed.has(pool.id.toLowerCase())) + 1;
                metric.putMetric(_.capitalize(`${protocol}${topNSelection}`), topNUsed, MetricLoggerUnit.Count);
            });
        }
        let hasV3Route = false;
        let hasV2Route = false;
        let hasMixedRoute = false;
        for (const routeAmount of routeAmounts) {
            if (routeAmount.protocol === Protocol.V3) {
                hasV3Route = true;
            }
            if (routeAmount.protocol === Protocol.V2) {
                hasV2Route = true;
            }
            if (routeAmount.protocol === Protocol.MIXED) {
                hasMixedRoute = true;
            }
        }
        if (hasMixedRoute && (hasV3Route || hasV2Route)) {
            if (hasV3Route && hasV2Route) {
                metric.putMetric(`MixedAndV3AndV2SplitRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`MixedAndV3AndV2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
            else if (hasV3Route) {
                metric.putMetric(`MixedAndV3SplitRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`MixedAndV3SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
            else if (hasV2Route) {
                metric.putMetric(`MixedAndV2SplitRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`MixedAndV2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
        }
        else if (hasV3Route && hasV2Route) {
            metric.putMetric(`V3AndV2SplitRoute`, 1, MetricLoggerUnit.Count);
            metric.putMetric(`V3AndV2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
        }
        else if (hasMixedRoute) {
            if (routeAmounts.length > 1) {
                metric.putMetric(`MixedSplitRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`MixedSplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
            else {
                metric.putMetric(`MixedRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`MixedRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
        }
        else if (hasV3Route) {
            if (routeAmounts.length > 1) {
                metric.putMetric(`V3SplitRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`V3SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
            else {
                metric.putMetric(`V3Route`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`V3RouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
        }
        else if (hasV2Route) {
            if (routeAmounts.length > 1) {
                metric.putMetric(`V2SplitRoute`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`V2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
            else {
                metric.putMetric(`V2Route`, 1, MetricLoggerUnit.Count);
                metric.putMetric(`V2RouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count);
            }
        }
    }
    calculateOptimalRatio(position, sqrtRatioX96, zeroForOne) {
        const upperSqrtRatioX96 = TickMath.getSqrtRatioAtTick(position.tickUpper);
        const lowerSqrtRatioX96 = TickMath.getSqrtRatioAtTick(position.tickLower);
        // returns Fraction(0, 1) for any out of range position regardless of zeroForOne. Implication: function
        // cannot be used to determine the trading direction of out of range positions.
        if (JSBI.greaterThan(sqrtRatioX96, upperSqrtRatioX96) ||
            JSBI.lessThan(sqrtRatioX96, lowerSqrtRatioX96)) {
            return new Fraction(0, 1);
        }
        const precision = JSBI.BigInt('1' + '0'.repeat(18));
        let optimalRatio = new Fraction(SqrtPriceMath.getAmount0Delta(sqrtRatioX96, upperSqrtRatioX96, precision, true), SqrtPriceMath.getAmount1Delta(sqrtRatioX96, lowerSqrtRatioX96, precision, true));
        if (!zeroForOne)
            optimalRatio = optimalRatio.invert();
        return optimalRatio;
    }
    async userHasSufficientBalance(fromAddress, tradeType, amount, quote) {
        try {
            const neededBalance = tradeType === TradeType.EXACT_INPUT ? amount : quote;
            let balance;
            if (neededBalance.currency.isNative) {
                balance = await this.provider.getBalance(fromAddress);
            }
            else {
                const tokenContract = Erc20__factory.connect(neededBalance.currency.address, this.provider);
                balance = await tokenContract.balanceOf(fromAddress);
            }
            return balance.gte(BigNumber.from(neededBalance.quotient.toString()));
        }
        catch (e) {
            log.error(e, 'Error while checking user balance');
            return false;
        }
    }
    absoluteValue(fraction) {
        const numeratorAbs = JSBI.lessThan(fraction.numerator, JSBI.BigInt(0))
            ? JSBI.unaryMinus(fraction.numerator)
            : fraction.numerator;
        const denominatorAbs = JSBI.lessThan(fraction.denominator, JSBI.BigInt(0))
            ? JSBI.unaryMinus(fraction.denominator)
            : fraction.denominator;
        return new Fraction(numeratorAbs, denominatorAbs);
    }
    getBlockNumberPromise() {
        return retry(async (_b, attempt) => {
            if (attempt > 1) {
                log.info(`Get block number attempt ${attempt}`);
            }
            return this.provider.getBlockNumber();
        }, {
            retries: 2,
            minTimeout: 100,
            maxTimeout: 1000,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxwaGEtcm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3JvdXRlcnMvYWxwaGEtcm91dGVyL2FscGhhLXJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFnQixlQUFlLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUN6RSxPQUFPLGtCQUFrQixNQUFNLDZCQUE2QixDQUFDO0FBQzdELE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFTLElBQUksRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxPQUFPLEVBQVksUUFBUSxFQUFTLFNBQVMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWxGLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMxRSxPQUFPLEtBQUssTUFBTSxhQUFhLENBQUM7QUFDaEMsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sQ0FBQyxNQUFNLFFBQVEsQ0FBQztBQUN2QixPQUFPLFNBQVMsTUFBTSxZQUFZLENBQUM7QUFFbkMsT0FBTyxFQUNMLFlBQVksRUFDWixTQUFTLEVBQ1QseUJBQXlCLEVBQ3pCLGdDQUFnQyxFQUNoQyxxQkFBcUIsRUFDckIseUJBQXlCLEVBQ3pCLHFCQUFxQixFQUNyQix5QkFBeUIsRUFDekIsdUJBQXVCLEVBQ3ZCLHlCQUF5QixFQU96QixzQkFBc0IsRUFDdEIsV0FBVyxFQUNYLHVCQUF1QixFQUN2QixvQkFBb0IsRUFFcEIsd0JBQXdCLEVBQ3hCLHdCQUF3QixFQUN4QixrQkFBa0IsRUFDbEIsdUJBQXVCLEVBQ3ZCLHdCQUF3QixFQUN4QixtQkFBbUIsRUFDbkIsZUFBZSxFQUNmLCtCQUErQixFQUMvQiwrQkFBK0IsRUFDaEMsTUFBTSxpQkFB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