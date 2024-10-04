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
exports.CachingV2PoolProvider = void 0;
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("../../util/log");
/**
 * Provider for getting V2 pools, with functionality for caching the results per block.
 *
 * @export
 * @class CachingV2PoolProvider
 */
class CachingV2PoolProvider {
    /**
     * Creates an instance of CachingV3PoolProvider.
     * @param chainId The chain id to use.
     * @param poolProvider The provider to use to get the pools when not in the cache.
     * @param cache Cache instance to hold cached pools.
     */
    constructor(chainId, poolProvider, 
    // Cache is block aware. For V2 pools we need to use the current blocks reserves values since
    // we compute quotes off-chain.
    // If no block is specified in the call to getPools we just return whatever is in the cache.
    cache) {
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
            const blockNumber = yield (providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber);
            for (const [tokenA, tokenB] of tokenPairs) {
                const { poolAddress, token0, token1 } = this.getPoolAddress(tokenA, tokenB);
                if (poolAddressSet.has(poolAddress)) {
                    continue;
                }
                poolAddressSet.add(poolAddress);
                const cachedPool = yield this.cache.get(this.POOL_KEY(this.chainId, poolAddress));
                if (cachedPool) {
                    // If a block was specified by the caller, ensure that the result in our cache matches the
                    // expected block number. If a block number is not specified, just return whatever is in the
                    // cache.
                    if (!blockNumber || (blockNumber && cachedPool.block == blockNumber)) {
                        poolAddressToPool[poolAddress] = cachedPool.pair;
                        continue;
                    }
                }
                poolsToGetTokenPairs.push([token0, token1]);
                poolsToGetAddresses.push(poolAddress);
            }
            log_1.log.info({
                poolsFound: lodash_1.default.map(Object.values(poolAddressToPool), (p) => p.token0.symbol + ' ' + p.token1.symbol),
                poolsToGetTokenPairs: lodash_1.default.map(poolsToGetTokenPairs, (t) => t[0].symbol + ' ' + t[1].symbol),
            }, `Found ${Object.keys(poolAddressToPool).length} V2 pools already in local cache for block ${blockNumber}. About to get reserves for ${poolsToGetTokenPairs.length} pools.`);
            if (poolsToGetAddresses.length > 0) {
                const poolAccessor = yield this.poolProvider.getPools(poolsToGetTokenPairs, Object.assign(Object.assign({}, providerConfig), { enableFeeOnTransferFeeFetching: true }));
                for (const address of poolsToGetAddresses) {
                    const pool = poolAccessor.getPoolByAddress(address);
                    if (pool) {
                        poolAddressToPool[address] = pool;
                        // We don't want to wait for this caching to complete before returning the pools.
                        this.cache.set(this.POOL_KEY(this.chainId, address), {
                            pair: pool,
                            block: blockNumber,
                        });
                    }
                }
            }
            return {
                getPool: (tokenA, tokenB) => {
                    const { poolAddress } = this.getPoolAddress(tokenA, tokenB);
                    return poolAddressToPool[poolAddress];
                },
                getPoolByAddress: (address) => poolAddressToPool[address],
                getAllPools: () => Object.values(poolAddressToPool),
            };
        });
    }
    getPoolAddress(tokenA, tokenB) {
        return this.poolProvider.getPoolAddress(tokenA, tokenB);
    }
}
exports.CachingV2PoolProvider = CachingV2PoolProvider;
