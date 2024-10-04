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
exports.V3PoolProvider = void 0;
const v3_sdk_1 = require("@uniswap/v3-sdk");
const async_retry_1 = __importDefault(require("async-retry"));
const lodash_1 = __importDefault(require("lodash"));
const IUniswapV3PoolState__factory_1 = require("../../types/v3/factories/IUniswapV3PoolState__factory");
const addresses_1 = require("../../util/addresses");
const log_1 = require("../../util/log");
const routes_1 = require("../../util/routes");
class V3PoolProvider {
    /**
     * Creates an instance of V3PoolProvider.
     * @param chainId The chain id to use.
     * @param multicall2Provider The multicall provider to use to get the pools.
     * @param retryOptions The retry options for each call to the multicall.
     */
    constructor(chainId, multicall2Provider, retryOptions = {
        retries: 2,
        minTimeout: 50,
        maxTimeout: 500,
    }) {
        this.chainId = chainId;
        this.multicall2Provider = multicall2Provider;
        this.retryOptions = retryOptions;
        // Computing pool addresses is slow as it requires hashing, encoding etc.
        // Addresses never change so can always be cached.
        this.POOL_ADDRESS_CACHE = {};
    }
    getPools(tokenPairs, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const poolAddressSet = new Set();
            const sortedTokenPairs = [];
            const sortedPoolAddresses = [];
            for (const tokenPair of tokenPairs) {
                const [tokenA, tokenB, feeAmount] = tokenPair;
                const { poolAddress, token0, token1 } = this.getPoolAddress(tokenA, tokenB, feeAmount);
                if (poolAddressSet.has(poolAddress)) {
                    continue;
                }
                poolAddressSet.add(poolAddress);
                sortedTokenPairs.push([token0, token1, feeAmount]);
                sortedPoolAddresses.push(poolAddress);
            }
            log_1.log.debug(`getPools called with ${tokenPairs.length} token pairs. Deduped down to ${poolAddressSet.size}`);
            const [slot0Results, liquidityResults] = yield Promise.all([
                this.getPoolsData(sortedPoolAddresses, 'slot0', providerConfig),
                this.getPoolsData(sortedPoolAddresses, 'liquidity', providerConfig),
            ]);
            log_1.log.info(`Got liquidity and slot0s for ${poolAddressSet.size} pools ${(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber)
                ? `as of block: ${providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber}.`
                : ``}`);
            const poolAddressToPool = {};
            const invalidPools = [];
            for (let i = 0; i < sortedPoolAddresses.length; i++) {
                const slot0Result = slot0Results[i];
                const liquidityResult = liquidityResults[i];
                // These properties tell us if a pool is valid and initialized or not.
                if (!(slot0Result === null || slot0Result === void 0 ? void 0 : slot0Result.success) ||
                    !(liquidityResult === null || liquidityResult === void 0 ? void 0 : liquidityResult.success) ||
                    slot0Result.result.sqrtPriceX96.eq(0)) {
                    const [token0, token1, fee] = sortedTokenPairs[i];
                    invalidPools.push([token0, token1, fee]);
                    continue;
                }
                const [token0, token1, fee] = sortedTokenPairs[i];
                const slot0 = slot0Result.result;
                const liquidity = liquidityResult.result[0];
                const pool = new v3_sdk_1.Pool(token0, token1, fee, slot0.sqrtPriceX96.toString(), liquidity.toString(), slot0.tick);
                const poolAddress = sortedPoolAddresses[i];
                poolAddressToPool[poolAddress] = pool;
            }
            if (invalidPools.length > 0) {
                log_1.log.info({
                    invalidPools: lodash_1.default.map(invalidPools, ([token0, token1, fee]) => `${token0.symbol}/${token1.symbol}/${fee / 10000}%`),
                }, `${invalidPools.length} pools invalid after checking their slot0 and liquidity results. Dropping.`);
            }
            const poolStrs = lodash_1.default.map(Object.values(poolAddressToPool), routes_1.poolToString);
            log_1.log.debug({ poolStrs }, `Found ${poolStrs.length} valid pools`);
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
        const [token0, token1] = tokenA.sortsBefore(tokenB)
            ? [tokenA, tokenB]
            : [tokenB, tokenA];
        const cacheKey = `${this.chainId}/${token0.address}/${token1.address}/${feeAmount}`;
        const cachedAddress = this.POOL_ADDRESS_CACHE[cacheKey];
        if (cachedAddress) {
            return { poolAddress: cachedAddress, token0, token1 };
        }
        const poolAddress = (0, v3_sdk_1.computePoolAddress)({
            factoryAddress: addresses_1.V3_CORE_FACTORY_ADDRESSES[this.chainId],
            tokenA: token0,
            tokenB: token1,
            fee: feeAmount,
        });
        this.POOL_ADDRESS_CACHE[cacheKey] = poolAddress;
        return { poolAddress, token0, token1 };
    }
    getPoolsData(poolAddresses, functionName, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { results, blockNumber } = yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                return this.multicall2Provider.callSameFunctionOnMultipleContracts({
                    addresses: poolAddresses,
                    contractInterface: IUniswapV3PoolState__factory_1.IUniswapV3PoolState__factory.createInterface(),
                    functionName: functionName,
                    providerConfig,
                });
            }), this.retryOptions);
            log_1.log.debug(`Pool data fetched as of block ${blockNumber}`);
            return results;
        });
    }
}
exports.V3PoolProvider = V3PoolProvider;
