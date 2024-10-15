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
exports.CachingV3PoolProvider = void 0;
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("../../util");
const log_1 = require("../../util/log");
/**
 * Provider for getting V3 pools, with functionality for caching the results.
 * Does not cache by block because we compute quotes using the on-chain quoter
 * so do not mind if the liquidity values are out of date.
 *
 * @export
 * @class CachingV3PoolProvider
 */
class CachingV3PoolProvider {
    /**
     * Creates an instance of CachingV3PoolProvider.
     * @param chainId The chain id to use.
     * @param poolProvider The provider to use to get the pools when not in the cache.
     * @param cache Cache instance to hold cached pools.
     */
    constructor(chainId, poolProvider, cache) {
        this.chainId = chainId;
        this.poolProvider = poolProvider;
        this.cache = cache;
        this.POOL_KEY = (chainId, address) => `pool-${chainId}-${address}`;
    }
    getPools(tokenPairs, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const poolAddressSet = new Set();
            const poolsToGetTokenPairs = [];
            const poolsToGetAddresses = [];
            const poolAddressToPool = {};
            for (const [tokenA, tokenB, feeAmount] of tokenPairs) {
                const { poolAddress, token0, token1 } = this.getPoolAddress(tokenA, tokenB, feeAmount);
                if (poolAddressSet.has(poolAddress)) {
                    continue;
                }
                poolAddressSet.add(poolAddress);
                const cachedPool = yield this.cache.get(this.POOL_KEY(this.chainId, poolAddress));
                if (cachedPool) {
                    util_1.metric.putMetric('V3_INMEMORY_CACHING_POOL_HIT_IN_MEMORY', 1, util_1.MetricLoggerUnit.None);
                    poolAddressToPool[poolAddress] = cachedPool;
                    continue;
                }
                util_1.metric.putMetric('V3_INMEMORY_CACHING_POOL_MISS_NOT_IN_MEMORY', 1, util_1.MetricLoggerUnit.None);
                poolsToGetTokenPairs.push([token0, token1, feeAmount]);
                poolsToGetAddresses.push(poolAddress);
            }
            log_1.log.info({
                poolsFound: lodash_1.default.map(Object.values(poolAddressToPool), (p) => `${p.token0.symbol} ${p.token1.symbol} ${p.fee}`),
                poolsToGetTokenPairs: lodash_1.default.map(poolsToGetTokenPairs, (t) => `${t[0].symbol} ${t[1].symbol} ${t[2]}`),
            }, `Found ${Object.keys(poolAddressToPool).length} V3 pools already in local cache. About to get liquidity and slot0s for ${poolsToGetTokenPairs.length} pools.`);
            if (poolsToGetAddresses.length > 0) {
                const poolAccessor = yield this.poolProvider.getPools(poolsToGetTokenPairs, providerConfig);
                for (const address of poolsToGetAddresses) {
                    const pool = poolAccessor.getPoolByAddress(address);
                    if (pool) {
                        poolAddressToPool[address] = pool;
                        // We don't want to wait for this caching to complete before returning the pools.
                        this.cache.set(this.POOL_KEY(this.chainId, address), pool);
                    }
                }
            }
            return {
                getPool: (tokenA, tokenB, feeAmount) => {
                    const { poolAddress } = this.getPoolAddress(tokenA, tokenB, feeAmount);
                    return poolAddressToPool[poolAddress];
                },
                getPoolByAddress: (address) => poolAddressToPool[address],
                getAllPools: () => Object.values(poolAddressToPool),
            };
        });
    }
    getPoolAddress(tokenA, tokenB, feeAmount) {
        return this.poolProvider.getPoolAddress(tokenA, tokenB, feeAmount);
    }
}
exports.CachingV3PoolProvider = CachingV3PoolProvider;
