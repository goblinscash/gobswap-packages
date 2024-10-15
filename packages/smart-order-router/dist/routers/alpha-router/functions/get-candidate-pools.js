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
exports.getMixedRouteCandidatePools = exports.getV2CandidatePools = exports.getV3CandidatePools = void 0;
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const lodash_1 = __importDefault(require("lodash"));
const token_provider_1 = require("../../../providers/token-provider");
const util_1 = require("../../../util");
const amounts_1 = require("../../../util/amounts");
const log_1 = require("../../../util/log");
const metric_1 = require("../../../util/metric");
const baseTokensByChain = {
    [sdk_core_1.ChainId.MAINNET]: [
        token_provider_1.USDC_MAINNET,
        token_provider_1.USDT_MAINNET,
        token_provider_1.WBTC_MAINNET,
        token_provider_1.DAI_MAINNET,
        util_1.WRAPPED_NATIVE_CURRENCY[1],
        token_provider_1.FEI_MAINNET,
    ],
    [sdk_core_1.ChainId.OPTIMISM]: [
        token_provider_1.DAI_OPTIMISM,
        token_provider_1.USDC_OPTIMISM,
        token_provider_1.USDT_OPTIMISM,
        token_provider_1.WBTC_OPTIMISM,
    ],
    [sdk_core_1.ChainId.SEPOLIA]: [
        token_provider_1.DAI_SEPOLIA,
        token_provider_1.USDC_SEPOLIA,
    ],
    [sdk_core_1.ChainId.OPTIMISM_GOERLI]: [
        token_provider_1.DAI_OPTIMISM_GOERLI,
        token_provider_1.USDC_OPTIMISM_GOERLI,
        token_provider_1.USDT_OPTIMISM_GOERLI,
        token_provider_1.WBTC_OPTIMISM_GOERLI,
    ],
    [sdk_core_1.ChainId.ARBITRUM_ONE]: [
        token_provider_1.DAI_ARBITRUM,
        token_provider_1.USDC_ARBITRUM,
        token_provider_1.WBTC_ARBITRUM,
        token_provider_1.USDT_ARBITRUM,
    ],
    [sdk_core_1.ChainId.ARBITRUM_GOERLI]: [token_provider_1.USDC_ARBITRUM_GOERLI],
    [sdk_core_1.ChainId.POLYGON]: [token_provider_1.USDC_POLYGON, token_provider_1.WMATIC_POLYGON],
    [sdk_core_1.ChainId.POLYGON_MUMBAI]: [token_provider_1.DAI_POLYGON_MUMBAI, token_provider_1.WMATIC_POLYGON_MUMBAI],
    [sdk_core_1.ChainId.CELO]: [token_provider_1.CUSD_CELO, token_provider_1.CEUR_CELO, token_provider_1.CELO],
    [sdk_core_1.ChainId.CELO_ALFAJORES]: [
        token_provider_1.CUSD_CELO_ALFAJORES,
        token_provider_1.CEUR_CELO_ALFAJORES,
        token_provider_1.CELO_ALFAJORES,
    ],
    [sdk_core_1.ChainId.GNOSIS]: [token_provider_1.WBTC_GNOSIS, token_provider_1.WXDAI_GNOSIS, token_provider_1.USDC_ETHEREUM_GNOSIS],
    [sdk_core_1.ChainId.MOONBEAM]: [
        token_provider_1.DAI_MOONBEAM,
        token_provider_1.USDC_MOONBEAM,
        token_provider_1.WBTC_MOONBEAM,
        token_provider_1.WGLMR_MOONBEAM,
    ],
    [sdk_core_1.ChainId.BNB]: [
        token_provider_1.DAI_BNB,
        token_provider_1.USDC_BNB,
        token_provider_1.USDT_BNB,
    ],
    [sdk_core_1.ChainId.AVALANCHE]: [
        token_provider_1.DAI_AVAX,
        token_provider_1.USDC_AVAX,
    ],
    [sdk_core_1.ChainId.BASE]: [
        token_provider_1.USDC_BASE,
    ],
    [sdk_core_1.ChainId.SMARTBCH]: [
        token_provider_1.BC_BCH
    ]
};
class SubcategorySelectionPools {
    constructor(pools, poolsNeeded) {
        this.pools = pools;
        this.poolsNeeded = poolsNeeded;
    }
    hasEnoughPools() {
        return this.pools.length >= this.poolsNeeded;
    }
}
function getV3CandidatePools({ tokenIn, tokenOut, routeType, routingConfig, subgraphProvider, tokenProvider, poolProvider, blockedTokenListProvider, chainId, }) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const { blockNumber, v3PoolSelection: { topN, topNDirectSwaps, topNTokenInOut, topNSecondHop, topNSecondHopForTokenAddress, tokensToAvoidOnSecondHops, topNWithEachBaseToken, topNWithBaseToken, }, } = routingConfig;
        const tokenInAddress = tokenIn.address.toLowerCase();
        const tokenOutAddress = tokenOut.address.toLowerCase();
        const beforeSubgraphPools = Date.now();
        const allPools = yield subgraphProvider.getPools(tokenIn, tokenOut, {
            blockNumber,
        });
        log_1.log.info({ samplePools: allPools.slice(0, 3) }, 'Got all pools from V3 subgraph provider');
        // Although this is less of an optimization than the V2 equivalent,
        // save some time copying objects by mutating the underlying pool directly.
        for (const pool of allPools) {
            pool.token0.id = pool.token0.id.toLowerCase();
            pool.token1.id = pool.token1.id.toLowerCase();
        }
        metric_1.metric.putMetric('V3SubgraphPoolsLoad', Date.now() - beforeSubgraphPools, metric_1.MetricLoggerUnit.Milliseconds);
        const beforePoolsFiltered = Date.now();
        // Only consider pools where neither tokens are in the blocked token list.
        let filteredPools = allPools;
        if (blockedTokenListProvider) {
            filteredPools = [];
            for (const pool of allPools) {
                const token0InBlocklist = yield blockedTokenListProvider.hasTokenByAddress(pool.token0.id);
                const token1InBlocklist = yield blockedTokenListProvider.hasTokenByAddress(pool.token1.id);
                if (token0InBlocklist || token1InBlocklist) {
                    continue;
                }
                filteredPools.push(pool);
            }
        }
        // Sort by tvlUSD in descending order
        const subgraphPoolsSorted = filteredPools.sort((a, b) => b.tvlUSD - a.tvlUSD);
        log_1.log.info(`After filtering blocked tokens went from ${allPools.length} to ${subgraphPoolsSorted.length}.`);
        const poolAddressesSoFar = new Set();
        const addToAddressSet = (pools) => {
            (0, lodash_1.default)(pools)
                .map((pool) => pool.id)
                .forEach((poolAddress) => poolAddressesSoFar.add(poolAddress));
        };
        const baseTokens = (_a = baseTokensByChain[chainId]) !== null && _a !== void 0 ? _a : [];
        const topByBaseWithTokenIn = (0, lodash_1.default)(baseTokens)
            .flatMap((token) => {
            return (0, lodash_1.default)(subgraphPoolsSorted)
                .filter((subgraphPool) => {
                const tokenAddress = token.address.toLowerCase();
                return ((subgraphPool.token0.id == tokenAddress &&
                    subgraphPool.token1.id == tokenInAddress) ||
                    (subgraphPool.token1.id == tokenAddress &&
                        subgraphPool.token0.id == tokenInAddress));
            })
                .sortBy((tokenListPool) => -tokenListPool.tvlUSD)
                .slice(0, topNWithEachBaseToken)
                .value();
        })
            .sortBy((tokenListPool) => -tokenListPool.tvlUSD)
            .slice(0, topNWithBaseToken)
            .value();
        const topByBaseWithTokenOut = (0, lodash_1.default)(baseTokens)
            .flatMap((token) => {
            return (0, lodash_1.default)(subgraphPoolsSorted)
                .filter((subgraphPool) => {
                const tokenAddress = token.address.toLowerCase();
                return ((subgraphPool.token0.id == tokenAddress &&
                    subgraphPool.token1.id == tokenOutAddress) ||
                    (subgraphPool.token1.id == tokenAddress &&
                        subgraphPool.token0.id == tokenOutAddress));
            })
                .sortBy((tokenListPool) => -tokenListPool.tvlUSD)
                .slice(0, topNWithEachBaseToken)
                .value();
        })
            .sortBy((tokenListPool) => -tokenListPool.tvlUSD)
            .slice(0, topNWithBaseToken)
            .value();
        let top2DirectSwapPool = (0, lodash_1.default)(subgraphPoolsSorted)
            .filter((subgraphPool) => {
            return (!poolAddressesSoFar.has(subgraphPool.id) &&
                ((subgraphPool.token0.id == tokenInAddress &&
                    subgraphPool.token1.id == tokenOutAddress) ||
                    (subgraphPool.token1.id == tokenInAddress &&
                        subgraphPool.token0.id == tokenOutAddress)));
        })
            .slice(0, topNDirectSwaps)
            .value();
        if (top2DirectSwapPool.length == 0 && topNDirectSwaps > 0) {
            // If we requested direct swap pools but did not find any in the subgraph query.
            // Optimistically add them into the query regardless. Invalid pools ones will be dropped anyway
            // when we query the pool on-chain. Ensures that new pools for new pairs can be swapped on immediately.
            top2DirectSwapPool = lodash_1.default.map([v3_sdk_1.FeeAmount.HIGH, v3_sdk_1.FeeAmount.MEDIUM, v3_sdk_1.FeeAmount.LOW, v3_sdk_1.FeeAmount.LOWEST], (feeAmount) => {
                const { token0, token1, poolAddress } = poolProvider.getPoolAddress(tokenIn, tokenOut, feeAmount);
                return {
                    id: poolAddress,
                    feeTier: (0, util_1.unparseFeeAmount)(feeAmount),
                    liquidity: '10000',
                    token0: {
                        id: token0.address,
                    },
                    token1: {
                        id: token1.address,
                    },
                    tvlETH: 10000,
                    tvlUSD: 10000,
                };
            });
        }
        addToAddressSet(top2DirectSwapPool);
        const wrappedNativeAddress = (_b = util_1.WRAPPED_NATIVE_CURRENCY[chainId]) === null || _b === void 0 ? void 0 : _b.address.toLowerCase();
        // Main reason we need this is for gas estimates, only needed if token out is not native.
        // We don't check the seen address set because if we've already added pools for getting native quotes
        // theres no need to add more.
        let top2EthQuoteTokenPool = [];
        if ((((_c = util_1.WRAPPED_NATIVE_CURRENCY[chainId]) === null || _c === void 0 ? void 0 : _c.symbol) ==
            ((_d = util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MAINNET]) === null || _d === void 0 ? void 0 : _d.symbol) &&
            tokenOut.symbol != 'WETH' &&
            tokenOut.symbol != 'WETH9' &&
            tokenOut.symbol != 'ETH') ||
            (((_e = util_1.WRAPPED_NATIVE_CURRENCY[chainId]) === null || _e === void 0 ? void 0 : _e.symbol) == token_provider_1.WMATIC_POLYGON.symbol &&
                tokenOut.symbol != 'MATIC' &&
                tokenOut.symbol != 'WMATIC')) {
            top2EthQuoteTokenPool = (0, lodash_1.default)(subgraphPoolsSorted)
                .filter((subgraphPool) => {
                if (routeType == sdk_core_1.TradeType.EXACT_INPUT) {
                    return ((subgraphPool.token0.id == wrappedNativeAddress &&
                        subgraphPool.token1.id == tokenOutAddress) ||
                        (subgraphPool.token1.id == wrappedNativeAddress &&
                            subgraphPool.token0.id == tokenOutAddress));
                }
                else {
                    return ((subgraphPool.token0.id == wrappedNativeAddress &&
                        subgraphPool.token1.id == tokenInAddress) ||
                        (subgraphPool.token1.id == wrappedNativeAddress &&
                            subgraphPool.token0.id == tokenInAddress));
                }
            })
                .slice(0, 1)
                .value();
        }
        addToAddressSet(top2EthQuoteTokenPool);
        const topByTVL = (0, lodash_1.default)(subgraphPoolsSorted)
            .filter((subgraphPool) => {
            return !poolAddressesSoFar.has(subgraphPool.id);
        })
            .slice(0, topN)
            .value();
        addToAddressSet(topByTVL);
        const topByTVLUsingTokenIn = (0, lodash_1.default)(subgraphPoolsSorted)
            .filter((subgraphPool) => {
            return (!poolAddressesSoFar.has(subgraphPool.id) &&
                (subgraphPool.token0.id == tokenInAddress ||
                    subgraphPool.token1.id == tokenInAddress));
        })
            .slice(0, topNTokenInOut)
            .value();
        addToAddressSet(topByTVLUsingTokenIn);
        const topByTVLUsingTokenOut = (0, lodash_1.default)(subgraphPoolsSorted)
            .filter((subgraphPool) => {
            return (!poolAddressesSoFar.has(subgraphPool.id) &&
                (subgraphPool.token0.id == tokenOutAddress ||
                    subgraphPool.token1.id == tokenOutAddress));
        })
            .slice(0, topNTokenInOut)
            .value();
        addToAddressSet(topByTVLUsingTokenOut);
        const topByTVLUsingTokenInSecondHops = (0, lodash_1.default)(topByTVLUsingTokenIn)
            .map((subgraphPool) => {
            return tokenInAddress == subgraphPool.token0.id
                ? subgraphPool.token1.id
                : subgraphPool.token0.id;
        })
            .flatMap((secondHopId) => {
            var _a;
            return (0, lodash_1.default)(subgraphPoolsSorted)
                .filter((subgraphPool) => {
                return (!poolAddressesSoFar.has(subgraphPool.id) &&
                    !(tokensToAvoidOnSecondHops === null || tokensToAvoidOnSecondHops === void 0 ? void 0 : tokensToAvoidOnSecondHops.includes(secondHopId.toLowerCase())) &&
                    (subgraphPool.token0.id == secondHopId ||
                        subgraphPool.token1.id == secondHopId));
            })
                .slice(0, (_a = topNSecondHopForTokenAddress === null || topNSecondHopForTokenAddress === void 0 ? void 0 : topNSecondHopForTokenAddress.get(secondHopId)) !== null && _a !== void 0 ? _a : topNSecondHop)
                .value();
        })
            .uniqBy((pool) => pool.id)
            .value();
        addToAddressSet(topByTVLUsingTokenInSecondHops);
        const topByTVLUsingTokenOutSecondHops = (0, lodash_1.default)(topByTVLUsingTokenOut)
            .map((subgraphPool) => {
            return tokenOutAddress == subgraphPool.token0.id
                ? subgraphPool.token1.id
                : subgraphPool.token0.id;
        })
            .flatMap((secondHopId) => {
            var _a;
            return (0, lodash_1.default)(subgraphPoolsSorted)
                .filter((subgraphPool) => {
                return (!poolAddressesSoFar.has(subgraphPool.id) &&
                    !(tokensToAvoidOnSecondHops === null || tokensToAvoidOnSecondHops === void 0 ? void 0 : tokensToAvoidOnSecondHops.includes(secondHopId.toLowerCase())) &&
                    (subgraphPool.token0.id == secondHopId ||
                        subgraphPool.token1.id == secondHopId));
            })
                .slice(0, (_a = topNSecondHopForTokenAddress === null || topNSecondHopForTokenAddress === void 0 ? void 0 : topNSecondHopForTokenAddress.get(secondHopId)) !== null && _a !== void 0 ? _a : topNSecondHop)
                .value();
        })
            .uniqBy((pool) => pool.id)
            .value();
        addToAddressSet(topByTVLUsingTokenOutSecondHops);
        const subgraphPools = (0, lodash_1.default)([
            ...topByBaseWithTokenIn,
            ...topByBaseWithTokenOut,
            ...top2DirectSwapPool,
            ...top2EthQuoteTokenPool,
            ...topByTVL,
            ...topByTVLUsingTokenIn,
            ...topByTVLUsingTokenOut,
            ...topByTVLUsingTokenInSecondHops,
            ...topByTVLUsingTokenOutSecondHops,
        ])
            .compact()
            .uniqBy((pool) => pool.id)
            .value();
        const tokenAddresses = (0, lodash_1.default)(subgraphPools)
            .flatMap((subgraphPool) => [subgraphPool.token0.id, subgraphPool.token1.id])
            .compact()
            .uniq()
            .value();
        log_1.log.info(`Getting the ${tokenAddresses.length} tokens within the ${subgraphPools.length} V3 pools we are considering`);
        const tokenAccessor = yield tokenProvider.getTokens(tokenAddresses, {
            blockNumber,
        });
        const printV3SubgraphPool = (s) => {
            var _a, _b, _c, _d;
            return `${(_b = (_a = tokenAccessor.getTokenByAddress(s.token0.id)) === null || _a === void 0 ? void 0 : _a.symbol) !== null && _b !== void 0 ? _b : s.token0.id}/${(_d = (_c = tokenAccessor.getTokenByAddress(s.token1.id)) === null || _c === void 0 ? void 0 : _c.symbol) !== null && _d !== void 0 ? _d : s.token1.id}/${s.feeTier}`;
        };
        log_1.log.info({
            topByBaseWithTokenIn: topByBaseWithTokenIn.map(printV3SubgraphPool),
            topByBaseWithTokenOut: topByBaseWithTokenOut.map(printV3SubgraphPool),
            topByTVL: topByTVL.map(printV3SubgraphPool),
            topByTVLUsingTokenIn: topByTVLUsingTokenIn.map(printV3SubgraphPool),
            topByTVLUsingTokenOut: topByTVLUsingTokenOut.map(printV3SubgraphPool),
            topByTVLUsingTokenInSecondHops: topByTVLUsingTokenInSecondHops.map(printV3SubgraphPool),
            topByTVLUsingTokenOutSecondHops: topByTVLUsingTokenOutSecondHops.map(printV3SubgraphPool),
            top2DirectSwap: top2DirectSwapPool.map(printV3SubgraphPool),
            top2EthQuotePool: top2EthQuoteTokenPool.map(printV3SubgraphPool),
        }, `V3 Candidate Pools`);
        const tokenPairsRaw = lodash_1.default.map(subgraphPools, (subgraphPool) => {
            const tokenA = tokenAccessor.getTokenByAddress(subgraphPool.token0.id);
            const tokenB = tokenAccessor.getTokenByAddress(subgraphPool.token1.id);
            let fee;
            try {
                fee = (0, amounts_1.parseFeeAmount)(subgraphPool.feeTier);
            }
            catch (err) {
                log_1.log.info({ subgraphPool }, `Dropping candidate pool for ${subgraphPool.token0.id}/${subgraphPool.token1.id}/${subgraphPool.feeTier} because fee tier not supported`);
                return undefined;
            }
            if (!tokenA || !tokenB) {
                log_1.log.info(`Dropping candidate pool for ${subgraphPool.token0.id}/${subgraphPool.token1.id}/${fee} because ${tokenA ? subgraphPool.token1.id : subgraphPool.token0.id} not found by token provider`);
                return undefined;
            }
            return [tokenA, tokenB, fee];
        });
        const tokenPairs = lodash_1.default.compact(tokenPairsRaw);
        metric_1.metric.putMetric('V3PoolsFilterLoad', Date.now() - beforePoolsFiltered, metric_1.MetricLoggerUnit.Milliseconds);
        const beforePoolsLoad = Date.now();
        const poolAccessor = yield poolProvider.getPools(tokenPairs, {
            blockNumber,
        });
        metric_1.metric.putMetric('V3PoolsLoad', Date.now() - beforePoolsLoad, metric_1.MetricLoggerUnit.Milliseconds);
        const poolsBySelection = {
            protocol: router_sdk_1.Protocol.V3,
            selections: {
                topByBaseWithTokenIn,
                topByBaseWithTokenOut,
                topByDirectSwapPool: top2DirectSwapPool,
                topByEthQuoteTokenPool: top2EthQuoteTokenPool,
                topByTVL,
                topByTVLUsingTokenIn,
                topByTVLUsingTokenOut,
                topByTVLUsingTokenInSecondHops,
                topByTVLUsingTokenOutSecondHops,
            },
        };
        return { poolAccessor, candidatePools: poolsBySelection, subgraphPools };
    });
}
exports.getV3CandidatePools = getV3CandidatePools;
function getV2CandidatePools({ tokenIn, tokenOut, routeType, routingConfig, subgraphProvider, tokenProvider, poolProvider, blockedTokenListProvider, chainId, }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { blockNumber, v2PoolSelection: { topN, topNDirectSwaps, topNTokenInOut, topNSecondHop, tokensToAvoidOnSecondHops, topNWithEachBaseToken, topNWithBaseToken, }, } = routingConfig;
        const tokenInAddress = tokenIn.address.toLowerCase();
        const tokenOutAddress = tokenOut.address.toLowerCase();
        const beforeSubgraphPools = Date.now();
        const allPoolsRaw = yield subgraphProvider.getPools(tokenIn, tokenOut, {
            blockNumber,
        });
        // With tens of thousands of V2 pools, operations that copy pools become costly.
        // Mutate the pool directly rather than creating a new pool / token to optimmize for speed.
        for (const pool of allPoolsRaw) {
            pool.token0.id = pool.token0.id.toLowerCase();
            pool.token1.id = pool.token1.id.toLowerCase();
        }
        metric_1.metric.putMetric('V2SubgraphPoolsLoad', Date.now() - beforeSubgraphPools, metric_1.MetricLoggerUnit.Milliseconds);
        const beforePoolsFiltered = Date.now();
        // Sort by pool reserve in descending order.
        const subgraphPoolsSorted = allPoolsRaw.sort((a, b) => b.reserve - a.reserve);
        const poolAddressesSoFar = new Set();
        // Always add the direct swap pool into the mix regardless of if it exists in the subgraph pool list.
        // Ensures that new pools can be swapped on immediately, and that if a pool was filtered out of the
        // subgraph query for some reason (e.g. trackedReserveETH was 0), then we still consider it.
        let topByDirectSwapPool = [];
        if (topNDirectSwaps > 0) {
            const { token0, token1, poolAddress } = poolProvider.getPoolAddress(tokenIn, tokenOut);
            poolAddressesSoFar.add(poolAddress.toLowerCase());
            topByDirectSwapPool = [
                {
                    id: poolAddress,
                    token0: {
                        id: token0.address,
                    },
                    token1: {
                        id: token1.address,
                    },
                    supply: 10000,
                    reserve: 10000,
                    reserveUSD: 10000, // Not used. Set to arbitrary number.
                },
            ];
        }
        const wethAddress = util_1.WRAPPED_NATIVE_CURRENCY[chainId].address.toLowerCase();
        const topByBaseWithTokenInMap = new Map();
        const topByBaseWithTokenOutMap = new Map();
        const baseTokens = (_a = baseTokensByChain[chainId]) !== null && _a !== void 0 ? _a : [];
        const baseTokensAddresses = new Set();
        baseTokens.forEach((token) => {
            const baseTokenAddr = token.address.toLowerCase();
            baseTokensAddresses.add(baseTokenAddr);
            topByBaseWithTokenInMap.set(baseTokenAddr, new SubcategorySelectionPools([], topNWithEachBaseToken));
            topByBaseWithTokenOutMap.set(baseTokenAddr, new SubcategorySelectionPools([], topNWithEachBaseToken));
        });
        let topByBaseWithTokenInPoolsFound = 0;
        let topByBaseWithTokenOutPoolsFound = 0;
        // Main reason we need this is for gas estimates
        // There can ever only be 1 Token/ETH pool, so we will only look for 1
        let topNEthQuoteToken = 1;
        // but, we only need it if token out is not ETH.
        if (tokenOut.symbol == 'WETH' || tokenOut.symbol == 'WETH9' || tokenOut.symbol == 'ETH') {
            // if it's eth we change the topN to 0, so we can break early from the loop.
            topNEthQuoteToken = 0;
        }
        const topByEthQuoteTokenPool = [];
        const topByTVLUsingTokenIn = [];
        const topByTVLUsingTokenOut = [];
        const topByTVL = [];
        // Used to track how many iterations we do in the first loop
        let loopsInFirstIteration = 0;
        // Filtering step for up to first hop
        // The pools are pre-sorted, so we can just iterate through them and fill our heuristics.
        for (const subgraphPool of subgraphPoolsSorted) {
            loopsInFirstIteration += 1;
            // Check if we have satisfied all the heuristics, if so, we can stop.
            if (topByBaseWithTokenInPoolsFound >= topNWithBaseToken &&
                topByBaseWithTokenOutPoolsFound >= topNWithBaseToken &&
                topByEthQuoteTokenPool.length >= topNEthQuoteToken &&
                topByTVL.length >= topN &&
                topByTVLUsingTokenIn.length >= topNTokenInOut &&
                topByTVLUsingTokenOut.length >= topNTokenInOut) {
                // We have satisfied all the heuristics, so we can stop.
                break;
            }
            if (poolAddressesSoFar.has(subgraphPool.id)) {
                // We've already added this pool, so skip it.
                continue;
            }
            // Only consider pools where neither tokens are in the blocked token list.
            if (blockedTokenListProvider) {
                const [token0InBlocklist, token1InBlocklist] = yield Promise.all([
                    blockedTokenListProvider.hasTokenByAddress(subgraphPool.token0.id),
                    blockedTokenListProvider.hasTokenByAddress(subgraphPool.token1.id)
                ]);
                if (token0InBlocklist || token1InBlocklist) {
                    continue;
                }
            }
            const tokenInToken0TopByBase = topByBaseWithTokenInMap.get(subgraphPool.token0.id);
            if (topByBaseWithTokenInPoolsFound < topNWithBaseToken &&
                tokenInToken0TopByBase &&
                subgraphPool.token0.id != tokenOutAddress &&
                subgraphPool.token1.id == tokenInAddress) {
                topByBaseWithTokenInPoolsFound += 1;
                poolAddressesSoFar.add(subgraphPool.id);
                if (topByTVLUsingTokenIn.length < topNTokenInOut) {
                    topByTVLUsingTokenIn.push(subgraphPool);
                }
                if (routeType === sdk_core_1.TradeType.EXACT_OUTPUT && subgraphPool.token0.id == wethAddress) {
                    topByEthQuoteTokenPool.push(subgraphPool);
                }
                tokenInToken0TopByBase.pools.push(subgraphPool);
                continue;
            }
            const tokenInToken1TopByBase = topByBaseWithTokenInMap.get(subgraphPool.token1.id);
            if (topByBaseWithTokenInPoolsFound < topNWithBaseToken &&
                tokenInToken1TopByBase &&
                subgraphPool.token0.id == tokenInAddress &&
                subgraphPool.token1.id != tokenOutAddress) {
                topByBaseWithTokenInPoolsFound += 1;
                poolAddressesSoFar.add(subgraphPool.id);
                if (topByTVLUsingTokenIn.length < topNTokenInOut) {
                    topByTVLUsingTokenIn.push(subgraphPool);
                }
                if (routeType === sdk_core_1.TradeType.EXACT_OUTPUT && subgraphPool.token1.id == wethAddress) {
                    topByEthQuoteTokenPool.push(subgraphPool);
                }
                tokenInToken1TopByBase.pools.push(subgraphPool);
                continue;
            }
            const tokenOutToken0TopByBase = topByBaseWithTokenOutMap.get(subgraphPool.token0.id);
            if (topByBaseWithTokenOutPoolsFound < topNWithBaseToken &&
                tokenOutToken0TopByBase &&
                subgraphPool.token0.id != tokenInAddress &&
                subgraphPool.token1.id == tokenOutAddress) {
                topByBaseWithTokenOutPoolsFound += 1;
                poolAddressesSoFar.add(subgraphPool.id);
                if (topByTVLUsingTokenOut.length < topNTokenInOut) {
                    topByTVLUsingTokenOut.push(subgraphPool);
                }
                if (routeType === sdk_core_1.TradeType.EXACT_INPUT && subgraphPool.token0.id == wethAddress) {
                    topByEthQuoteTokenPool.push(subgraphPool);
                }
                tokenOutToken0TopByBase.pools.push(subgraphPool);
                continue;
            }
            const tokenOutToken1TopByBase = topByBaseWithTokenOutMap.get(subgraphPool.token1.id);
            if (topByBaseWithTokenOutPoolsFound < topNWithBaseToken &&
                tokenOutToken1TopByBase &&
                subgraphPool.token0.id == tokenOutAddress &&
                subgraphPool.token1.id != tokenInAddress) {
                topByBaseWithTokenOutPoolsFound += 1;
                poolAddressesSoFar.add(subgraphPool.id);
                if (topByTVLUsingTokenOut.length < topNTokenInOut) {
                    topByTVLUsingTokenOut.push(subgraphPool);
                }
                if (routeType === sdk_core_1.TradeType.EXACT_INPUT && subgraphPool.token1.id == wethAddress) {
                    topByEthQuoteTokenPool.push(subgraphPool);
                }
                tokenOutToken1TopByBase.pools.push(subgraphPool);
                continue;
            }
            // Note: we do not need to check other native currencies for the V2 Protocol
            if (topByEthQuoteTokenPool.length < topNEthQuoteToken &&
                (routeType === sdk_core_1.TradeType.EXACT_INPUT && ((subgraphPool.token0.id == wethAddress && subgraphPool.token1.id == tokenOutAddress) ||
                    (subgraphPool.token1.id == wethAddress && subgraphPool.token0.id == tokenOutAddress)) ||
                    routeType === sdk_core_1.TradeType.EXACT_OUTPUT && ((subgraphPool.token0.id == wethAddress && subgraphPool.token1.id == tokenInAddress) ||
                        (subgraphPool.token1.id == wethAddress && subgraphPool.token0.id == tokenInAddress)))) {
                poolAddressesSoFar.add(subgraphPool.id);
                topByEthQuoteTokenPool.push(subgraphPool);
                continue;
            }
            if (topByTVL.length < topN) {
                poolAddressesSoFar.add(subgraphPool.id);
                topByTVL.push(subgraphPool);
                continue;
            }
            if (topByTVLUsingTokenIn.length < topNTokenInOut &&
                (subgraphPool.token0.id == tokenInAddress || subgraphPool.token1.id == tokenInAddress)) {
                poolAddressesSoFar.add(subgraphPool.id);
                topByTVLUsingTokenIn.push(subgraphPool);
                continue;
            }
            if (topByTVLUsingTokenOut.length < topNTokenInOut &&
                (subgraphPool.token0.id == tokenOutAddress || subgraphPool.token1.id == tokenOutAddress)) {
                poolAddressesSoFar.add(subgraphPool.id);
                topByTVLUsingTokenOut.push(subgraphPool);
                continue;
            }
        }
        metric_1.metric.putMetric('V2SubgraphLoopsInFirstIteration', loopsInFirstIteration, metric_1.MetricLoggerUnit.Count);
        const topByBaseWithTokenIn = [];
        for (const topByBaseWithTokenInSelection of topByBaseWithTokenInMap.values()) {
            topByBaseWithTokenIn.push(...topByBaseWithTokenInSelection.pools);
        }
        const topByBaseWithTokenOut = [];
        for (const topByBaseWithTokenOutSelection of topByBaseWithTokenOutMap.values()) {
            topByBaseWithTokenOut.push(...topByBaseWithTokenOutSelection.pools);
        }
        // Filtering step for second hops
        const topByTVLUsingTokenInSecondHopsMap = new Map();
        const topByTVLUsingTokenOutSecondHopsMap = new Map();
        const tokenInSecondHopAddresses = topByTVLUsingTokenIn.filter((pool) => {
            // filtering second hops
            if (tokenInAddress === pool.token0.id) {
                return !(tokensToAvoidOnSecondHops === null || tokensToAvoidOnSecondHops === void 0 ? void 0 : tokensToAvoidOnSecondHops.includes(pool.token1.id.toLowerCase()));
            }
            else {
                return !(tokensToAvoidOnSecondHops === null || tokensToAvoidOnSecondHops === void 0 ? void 0 : tokensToAvoidOnSecondHops.includes(pool.token0.id.toLowerCase()));
            }
        }).map((pool) => tokenInAddress === pool.token0.id ? pool.token1.id : pool.token0.id);
        const tokenOutSecondHopAddresses = topByTVLUsingTokenOut.filter((pool) => {
            // filtering second hops
            if (tokenOutAddress === pool.token0.id) {
                return !(tokensToAvoidOnSecondHops === null || tokensToAvoidOnSecondHops === void 0 ? void 0 : tokensToAvoidOnSecondHops.includes(pool.token1.id.toLowerCase()));
            }
            else {
                return !(tokensToAvoidOnSecondHops === null || tokensToAvoidOnSecondHops === void 0 ? void 0 : tokensToAvoidOnSecondHops.includes(pool.token0.id.toLowerCase()));
            }
        }).map((pool) => tokenOutAddress === pool.token0.id ? pool.token1.id : pool.token0.id);
        for (const secondHopId of tokenInSecondHopAddresses) {
            topByTVLUsingTokenInSecondHopsMap.set(secondHopId, new SubcategorySelectionPools([], topNSecondHop));
        }
        for (const secondHopId of tokenOutSecondHopAddresses) {
            topByTVLUsingTokenOutSecondHopsMap.set(secondHopId, new SubcategorySelectionPools([], topNSecondHop));
        }
        // Used to track how many iterations we do in the second loop
        let loopsInSecondIteration = 0;
        if (tokenInSecondHopAddresses.length > 0 || tokenOutSecondHopAddresses.length > 0) {
            for (const subgraphPool of subgraphPoolsSorted) {
                loopsInSecondIteration += 1;
                let allTokenInSecondHopsHaveTheirTopN = true;
                for (const secondHopPools of topByTVLUsingTokenInSecondHopsMap.values()) {
                    if (!secondHopPools.hasEnoughPools()) {
                        allTokenInSecondHopsHaveTheirTopN = false;
                        break;
                    }
                }
                let allTokenOutSecondHopsHaveTheirTopN = true;
                for (const secondHopPools of topByTVLUsingTokenOutSecondHopsMap.values()) {
                    if (!secondHopPools.hasEnoughPools()) {
                        allTokenOutSecondHopsHaveTheirTopN = false;
                        break;
                    }
                }
                if (allTokenInSecondHopsHaveTheirTopN && allTokenOutSecondHopsHaveTheirTopN) {
                    // We have satisfied all the heuristics, so we can stop.
                    break;
                }
                if (poolAddressesSoFar.has(subgraphPool.id)) {
                    continue;
                }
                // Only consider pools where neither tokens are in the blocked token list.
                if (blockedTokenListProvider) {
                    const [token0InBlocklist, token1InBlocklist] = yield Promise.all([
                        blockedTokenListProvider.hasTokenByAddress(subgraphPool.token0.id),
                        blockedTokenListProvider.hasTokenByAddress(subgraphPool.token1.id)
                    ]);
                    if (token0InBlocklist || token1InBlocklist) {
                        continue;
                    }
                }
                const tokenInToken0SecondHop = topByTVLUsingTokenInSecondHopsMap.get(subgraphPool.token0.id);
                if (tokenInToken0SecondHop && !tokenInToken0SecondHop.hasEnoughPools()) {
                    poolAddressesSoFar.add(subgraphPool.id);
                    tokenInToken0SecondHop.pools.push(subgraphPool);
                    continue;
                }
                const tokenInToken1SecondHop = topByTVLUsingTokenInSecondHopsMap.get(subgraphPool.token1.id);
                if (tokenInToken1SecondHop && !tokenInToken1SecondHop.hasEnoughPools()) {
                    poolAddressesSoFar.add(subgraphPool.id);
                    tokenInToken1SecondHop.pools.push(subgraphPool);
                    continue;
                }
                const tokenOutToken0SecondHop = topByTVLUsingTokenOutSecondHopsMap.get(subgraphPool.token0.id);
                if (tokenOutToken0SecondHop && !tokenOutToken0SecondHop.hasEnoughPools()) {
                    poolAddressesSoFar.add(subgraphPool.id);
                    tokenOutToken0SecondHop.pools.push(subgraphPool);
                    continue;
                }
                const tokenOutToken1SecondHop = topByTVLUsingTokenOutSecondHopsMap.get(subgraphPool.token1.id);
                if (tokenOutToken1SecondHop && !tokenOutToken1SecondHop.hasEnoughPools()) {
                    poolAddressesSoFar.add(subgraphPool.id);
                    tokenOutToken1SecondHop.pools.push(subgraphPool);
                    continue;
                }
            }
        }
        metric_1.metric.putMetric('V2SubgraphLoopsInSecondIteration', loopsInSecondIteration, metric_1.MetricLoggerUnit.Count);
        const topByTVLUsingTokenInSecondHops = [];
        for (const secondHopPools of topByTVLUsingTokenInSecondHopsMap.values()) {
            topByTVLUsingTokenInSecondHops.push(...secondHopPools.pools);
        }
        const topByTVLUsingTokenOutSecondHops = [];
        for (const secondHopPools of topByTVLUsingTokenOutSecondHopsMap.values()) {
            topByTVLUsingTokenOutSecondHops.push(...secondHopPools.pools);
        }
        const subgraphPools = (0, lodash_1.default)([
            ...topByBaseWithTokenIn,
            ...topByBaseWithTokenOut,
            ...topByDirectSwapPool,
            ...topByEthQuoteTokenPool,
            ...topByTVL,
            ...topByTVLUsingTokenIn,
            ...topByTVLUsingTokenOut,
            ...topByTVLUsingTokenInSecondHops,
            ...topByTVLUsingTokenOutSecondHops,
        ])
            .uniqBy((pool) => pool.id)
            .value();
        const tokenAddressesSet = new Set();
        for (const pool of subgraphPools) {
            tokenAddressesSet.add(pool.token0.id);
            tokenAddressesSet.add(pool.token1.id);
        }
        const tokenAddresses = Array.from(tokenAddressesSet);
        log_1.log.info(`Getting the ${tokenAddresses.length} tokens within the ${subgraphPools.length} V2 pools we are considering`);
        const tokenAccessor = yield tokenProvider.getTokens(tokenAddresses, {
            blockNumber,
        });
        const printV2SubgraphPool = (s) => {
            var _a, _b, _c, _d;
            return `${(_b = (_a = tokenAccessor.getTokenByAddress(s.token0.id)) === null || _a === void 0 ? void 0 : _a.symbol) !== null && _b !== void 0 ? _b : s.token0.id}/${(_d = (_c = tokenAccessor.getTokenByAddress(s.token1.id)) === null || _c === void 0 ? void 0 : _c.symbol) !== null && _d !== void 0 ? _d : s.token1.id}`;
        };
        log_1.log.info({
            topByBaseWithTokenIn: topByBaseWithTokenIn.map(printV2SubgraphPool),
            topByBaseWithTokenOut: topByBaseWithTokenOut.map(printV2SubgraphPool),
            topByTVL: topByTVL.map(printV2SubgraphPool),
            topByTVLUsingTokenIn: topByTVLUsingTokenIn.map(printV2SubgraphPool),
            topByTVLUsingTokenOut: topByTVLUsingTokenOut.map(printV2SubgraphPool),
            topByTVLUsingTokenInSecondHops: topByTVLUsingTokenInSecondHops.map(printV2SubgraphPool),
            topByTVLUsingTokenOutSecondHops: topByTVLUsingTokenOutSecondHops.map(printV2SubgraphPool),
            top2DirectSwap: topByDirectSwapPool.map(printV2SubgraphPool),
            top2EthQuotePool: topByEthQuoteTokenPool.map(printV2SubgraphPool),
        }, `V2 Candidate pools`);
        const tokenPairsRaw = lodash_1.default.map(subgraphPools, (subgraphPool) => {
            const tokenA = tokenAccessor.getTokenByAddress(subgraphPool.token0.id);
            const tokenB = tokenAccessor.getTokenByAddress(subgraphPool.token1.id);
            if (!tokenA || !tokenB) {
                log_1.log.info(`Dropping candidate pool for ${subgraphPool.token0.id}/${subgraphPool.token1.id}`);
                return undefined;
            }
            return [tokenA, tokenB];
        });
        const tokenPairs = lodash_1.default.compact(tokenPairsRaw);
        metric_1.metric.putMetric('V2PoolsFilterLoad', Date.now() - beforePoolsFiltered, metric_1.MetricLoggerUnit.Milliseconds);
        const beforePoolsLoad = Date.now();
        // this should be the only place to enable fee-on-transfer fee fetching,
        // because this places loads pools (pairs of tokens with fot taxes) from the subgraph
        const poolAccessor = yield poolProvider.getPools(tokenPairs, routingConfig);
        metric_1.metric.putMetric('V2PoolsLoad', Date.now() - beforePoolsLoad, metric_1.MetricLoggerUnit.Milliseconds);
        const poolsBySelection = {
            protocol: router_sdk_1.Protocol.V2,
            selections: {
                topByBaseWithTokenIn,
                topByBaseWithTokenOut,
                topByDirectSwapPool,
                topByEthQuoteTokenPool,
                topByTVL,
                topByTVLUsingTokenIn,
                topByTVLUsingTokenOut,
                topByTVLUsingTokenInSecondHops,
                topByTVLUsingTokenOutSecondHops,
            },
        };
        return { poolAccessor, candidatePools: poolsBySelection, subgraphPools };
    });
}
exports.getV2CandidatePools = getV2CandidatePools;
function getMixedRouteCandidatePools({ v3CandidatePools, v2CandidatePools, routingConfig, tokenProvider, v3poolProvider, v2poolProvider, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const beforeSubgraphPools = Date.now();
        const [{ subgraphPools: V3subgraphPools, candidatePools: V3candidatePools }, { subgraphPools: V2subgraphPools, candidatePools: V2candidatePools }] = [v3CandidatePools, v2CandidatePools];
        metric_1.metric.putMetric('MixedSubgraphPoolsLoad', Date.now() - beforeSubgraphPools, metric_1.MetricLoggerUnit.Milliseconds);
        const beforePoolsFiltered = Date.now();
        /**
         * Main heuristic for pruning mixedRoutes:
         * - we pick V2 pools with higher liq than respective V3 pools, or if the v3 pool doesn't exist
         *
         * This way we can reduce calls to our provider since it's possible to generate a lot of mixed routes
         */
        /// We only really care about pools involving the tokenIn or tokenOut explictly,
        /// since there's no way a long tail token in V2 would be routed through as an intermediary
        const V2topByTVLPoolIds = new Set([
            ...V2candidatePools.selections.topByTVLUsingTokenIn,
            ...V2candidatePools.selections.topByBaseWithTokenIn,
            /// tokenOut:
            ...V2candidatePools.selections.topByTVLUsingTokenOut,
            ...V2candidatePools.selections.topByBaseWithTokenOut,
            /// Direct swap:
            ...V2candidatePools.selections.topByDirectSwapPool,
        ].map((poolId) => poolId.id));
        const V2topByTVLSortedPools = (0, lodash_1.default)(V2subgraphPools)
            .filter((pool) => V2topByTVLPoolIds.has(pool.id))
            .sortBy((pool) => -pool.reserveUSD)
            .value();
        /// we consider all returned V3 pools for this heuristic to "fill in the gaps"
        const V3sortedPools = (0, lodash_1.default)(V3subgraphPools)
            .sortBy((pool) => -pool.tvlUSD)
            .value();
        /// Finding pools with greater reserveUSD on v2 than tvlUSD on v3, or if there is no v3 liquidity
        const buildV2Pools = [];
        V2topByTVLSortedPools.forEach((V2subgraphPool) => {
            const V3subgraphPool = V3sortedPools.find((pool) => (pool.token0.id == V2subgraphPool.token0.id &&
                pool.token1.id == V2subgraphPool.token1.id) ||
                (pool.token0.id == V2subgraphPool.token1.id &&
                    pool.token1.id == V2subgraphPool.token0.id));
            if (V3subgraphPool) {
                if (V2subgraphPool.reserveUSD > V3subgraphPool.tvlUSD) {
                    log_1.log.info({
                        token0: V2subgraphPool.token0.id,
                        token1: V2subgraphPool.token1.id,
                        v2reserveUSD: V2subgraphPool.reserveUSD,
                        v3tvlUSD: V3subgraphPool.tvlUSD,
                    }, `MixedRoute heuristic, found a V2 pool with higher liquidity than its V3 counterpart`);
                    buildV2Pools.push(V2subgraphPool);
                }
            }
            else {
                log_1.log.info({
                    token0: V2subgraphPool.token0.id,
                    token1: V2subgraphPool.token1.id,
                    v2reserveUSD: V2subgraphPool.reserveUSD,
                }, `MixedRoute heuristic, found a V2 pool with no V3 counterpart`);
                buildV2Pools.push(V2subgraphPool);
            }
        });
        log_1.log.info(buildV2Pools.length, `Number of V2 candidate pools that fit first heuristic`);
        const subgraphPools = [...buildV2Pools, ...V3sortedPools];
        const tokenAddresses = (0, lodash_1.default)(subgraphPools)
            .flatMap((subgraphPool) => [subgraphPool.token0.id, subgraphPool.token1.id])
            .compact()
            .uniq()
            .value();
        log_1.log.info(`Getting the ${tokenAddresses.length} tokens within the ${subgraphPools.length} pools we are considering`);
        const tokenAccessor = yield tokenProvider.getTokens(tokenAddresses, routingConfig);
        const V3tokenPairsRaw = lodash_1.default.map(V3sortedPools, (subgraphPool) => {
            const tokenA = tokenAccessor.getTokenByAddress(subgraphPool.token0.id);
            const tokenB = tokenAccessor.getTokenByAddress(subgraphPool.token1.id);
            let fee;
            try {
                fee = (0, amounts_1.parseFeeAmount)(subgraphPool.feeTier);
            }
            catch (err) {
                log_1.log.info({ subgraphPool }, `Dropping candidate pool for ${subgraphPool.token0.id}/${subgraphPool.token1.id}/${subgraphPool.feeTier} because fee tier not supported`);
                return undefined;
            }
            if (!tokenA || !tokenB) {
                log_1.log.info(`Dropping candidate pool for ${subgraphPool.token0.id}/${subgraphPool.token1.id}/${fee} because ${tokenA ? subgraphPool.token1.id : subgraphPool.token0.id} not found by token provider`);
                return undefined;
            }
            return [tokenA, tokenB, fee];
        });
        const V3tokenPairs = lodash_1.default.compact(V3tokenPairsRaw);
        const V2tokenPairsRaw = lodash_1.default.map(buildV2Pools, (subgraphPool) => {
            const tokenA = tokenAccessor.getTokenByAddress(subgraphPool.token0.id);
            const tokenB = tokenAccessor.getTokenByAddress(subgraphPool.token1.id);
            if (!tokenA || !tokenB) {
                log_1.log.info(`Dropping candidate pool for ${subgraphPool.token0.id}/${subgraphPool.token1.id}`);
                return undefined;
            }
            return [tokenA, tokenB];
        });
        const V2tokenPairs = lodash_1.default.compact(V2tokenPairsRaw);
        metric_1.metric.putMetric('MixedPoolsFilterLoad', Date.now() - beforePoolsFiltered, metric_1.MetricLoggerUnit.Milliseconds);
        const beforePoolsLoad = Date.now();
        const [V2poolAccessor, V3poolAccessor] = yield Promise.all([
            v2poolProvider.getPools(V2tokenPairs, routingConfig),
            v3poolProvider.getPools(V3tokenPairs, routingConfig),
        ]);
        metric_1.metric.putMetric('MixedPoolsLoad', Date.now() - beforePoolsLoad, metric_1.MetricLoggerUnit.Milliseconds);
        /// @dev a bit tricky here since the original V2CandidateSelections object included pools that we may have dropped
        /// as part of the heuristic. We need to reconstruct a new object with the v3 pools too.
        const buildPoolsBySelection = (key) => {
            return [
                ...buildV2Pools.filter((pool) => V2candidatePools.selections[key].map((p) => p.id).includes(pool.id)),
                ...V3candidatePools.selections[key],
            ];
        };
        const poolsBySelection = {
            protocol: router_sdk_1.Protocol.MIXED,
            selections: {
                topByBaseWithTokenIn: buildPoolsBySelection('topByBaseWithTokenIn'),
                topByBaseWithTokenOut: buildPoolsBySelection('topByBaseWithTokenOut'),
                topByDirectSwapPool: buildPoolsBySelection('topByDirectSwapPool'),
                topByEthQuoteTokenPool: buildPoolsBySelection('topByEthQuoteTokenPool'),
                topByTVL: buildPoolsBySelection('topByTVL'),
                topByTVLUsingTokenIn: buildPoolsBySelection('topByTVLUsingTokenIn'),
                topByTVLUsingTokenOut: buildPoolsBySelection('topByTVLUsingTokenOut'),
                topByTVLUsingTokenInSecondHops: buildPoolsBySelection('topByTVLUsingTokenInSecondHops'),
                topByTVLUsingTokenOutSecondHops: buildPoolsBySelection('topByTVLUsingTokenOutSecondHops'),
            },
        };
        return {
            V2poolAccessor,
            V3poolAccessor,
            candidatePools: poolsBySelection,
            subgraphPools,
        };
    });
}
exports.getMixedRouteCandidatePools = getMixedRouteCandidatePools;
