"use strict";
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
async function getV3CandidatePools({ tokenIn, tokenOut, routeType, routingConfig, subgraphProvider, tokenProvider, poolProvider, blockedTokenListProvider, chainId, }) {
    var _a, _b, _c, _d, _e;
    const { blockNumber, v3PoolSelection: { topN, topNDirectSwaps, topNTokenInOut, topNSecondHop, topNSecondHopForTokenAddress, tokensToAvoidOnSecondHops, topNWithEachBaseToken, topNWithBaseToken, }, } = routingConfig;
    const tokenInAddress = tokenIn.address.toLowerCase();
    const tokenOutAddress = tokenOut.address.toLowerCase();
    const beforeSubgraphPools = Date.now();
    const allPools = await subgraphProvider.getPools(tokenIn, tokenOut, {
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
            const token0InBlocklist = await blockedTokenListProvider.hasTokenByAddress(pool.token0.id);
            const token1InBlocklist = await blockedTokenListProvider.hasTokenByAddress(pool.token1.id);
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
    const tokenAccessor = await tokenProvider.getTokens(tokenAddresses, {
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
    const poolAccessor = await poolProvider.getPools(tokenPairs, {
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
}
exports.getV3CandidatePools = getV3CandidatePools;
async function getV2CandidatePools({ tokenIn, tokenOut, routeType, routingConfig, subgraphProvider, tokenProvider, poolProvider, blockedTokenListProvider, chainId, }) {
    var _a;
    const { blockNumber, v2PoolSelection: { topN, topNDirectSwaps, topNTokenInOut, topNSecondHop, tokensToAvoidOnSecondHops, topNWithEachBaseToken, topNWithBaseToken, }, } = routingConfig;
    const tokenInAddress = tokenIn.address.toLowerCase();
    const tokenOutAddress = tokenOut.address.toLowerCase();
    const beforeSubgraphPools = Date.now();
    const allPoolsRaw = await subgraphProvider.getPools(tokenIn, tokenOut, {
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
            const [token0InBlocklist, token1InBlocklist] = await Promise.all([
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
                const [token0InBlocklist, token1InBlocklist] = await Promise.all([
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
    const tokenAccessor = await tokenProvider.getTokens(tokenAddresses, {
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
    const poolAccessor = await poolProvider.getPools(tokenPairs, routingConfig);
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
}
exports.getV2CandidatePools = getV2CandidatePools;
async function getMixedRouteCandidatePools({ v3CandidatePools, v2CandidatePools, routingConfig, tokenProvider, v3poolProvider, v2poolProvider, }) {
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
    const tokenAccessor = await tokenProvider.getTokens(tokenAddresses, routingConfig);
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
    const [V2poolAccessor, V3poolAccessor] = await Promise.all([
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
}
exports.getMixedRouteCandidatePools = getMixedRouteCandidatePools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWNhbmRpZGF0ZS1wb29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9yb3V0ZXJzL2FscGhhLXJvdXRlci9mdW5jdGlvbnMvZ2V0LWNhbmRpZGF0ZS1wb29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBK0M7QUFDL0MsZ0RBQThEO0FBQzlELDRDQUE0QztBQUM1QyxvREFBdUI7QUFHdkIsc0VBOEMyQztBQUkzQyx3Q0FBMEU7QUFDMUUsbURBQXVEO0FBQ3ZELDJDQUF3QztBQUN4QyxpREFBZ0U7QUF5RGhFLE1BQU0saUJBQWlCLEdBQXVDO0lBQzVELENBQUMsa0JBQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNqQiw2QkFBWTtRQUNaLDZCQUFZO1FBQ1osNkJBQVk7UUFDWiw0QkFBVztRQUNYLDhCQUF1QixDQUFDLENBQUMsQ0FBRTtRQUMzQiw0QkFBVztLQUNaO0lBQ0QsQ0FBQyxrQkFBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xCLDZCQUFZO1FBQ1osOEJBQWE7UUFDYiw4QkFBYTtRQUNiLDhCQUFhO0tBQ2Q7SUFDRCxDQUFDLGtCQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDakIsNEJBQVc7UUFDWCw2QkFBWTtLQUNiO0lBQ0QsQ0FBQyxrQkFBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFO1FBQ3pCLG9DQUFtQjtRQUNuQixxQ0FBb0I7UUFDcEIscUNBQW9CO1FBQ3BCLHFDQUFvQjtLQUNyQjtJQUNELENBQUMsa0JBQU8sQ0FBQyxZQUFZLENBQUMsRUFBRTtRQUN0Qiw2QkFBWTtRQUNaLDhCQUFhO1FBQ2IsOEJBQWE7UUFDYiw4QkFBYTtLQUNkO0lBQ0QsQ0FBQyxrQkFBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMscUNBQW9CLENBQUM7SUFDakQsQ0FBQyxrQkFBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsNkJBQVksRUFBRSwrQkFBYyxDQUFDO0lBQ2pELENB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