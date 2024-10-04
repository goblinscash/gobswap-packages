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
exports.V2PoolProvider = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const v2_sdk_1 = require("@uniswap/v2-sdk");
const async_retry_1 = __importDefault(require("async-retry"));
const lodash_1 = __importDefault(require("lodash"));
const IUniswapV2Pair__factory_1 = require("../../types/v2/factories/IUniswapV2Pair__factory");
const util_1 = require("../../util");
const log_1 = require("../../util/log");
const routes_1 = require("../../util/routes");
const token_validator_provider_1 = require("../token-validator-provider");
class V2PoolProvider {
    /**
     * Creates an instance of V2PoolProvider.
     * @param chainId The chain id to use.
     * @param multicall2Provider The multicall provider to use to get the pools.
     * @param tokenPropertiesProvider The token properties provider to use to get token properties.
     * @param retryOptions The retry options for each call to the multicall.
     */
    constructor(chainId, multicall2Provider, tokenPropertiesProvider, retryOptions = {
        retries: 2,
        minTimeout: 50,
        maxTimeout: 500,
    }) {
        this.chainId = chainId;
        this.multicall2Provider = multicall2Provider;
        this.tokenPropertiesProvider = tokenPropertiesProvider;
        this.retryOptions = retryOptions;
        // Computing pool addresses is slow as it requires hashing, encoding etc.
        // Addresses never change so can always be cached.
        this.POOL_ADDRESS_CACHE = {};
    }
    getPools(tokenPairs, providerConfig) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function* () {
            const poolAddressSet = new Set();
            const sortedTokenPairs = [];
            const sortedPoolAddresses = [];
            for (const tokenPair of tokenPairs) {
                const [tokenA, tokenB] = tokenPair;
                const { poolAddress, token0, token1 } = this.getPoolAddress(tokenA, tokenB);
                if (poolAddressSet.has(poolAddress)) {
                    continue;
                }
                poolAddressSet.add(poolAddress);
                sortedTokenPairs.push([token0, token1]);
                sortedPoolAddresses.push(poolAddress);
            }
            log_1.log.debug(`getPools called with ${tokenPairs.length} token pairs. Deduped down to ${poolAddressSet.size}`);
            util_1.metric.putMetric('V2_RPC_POOL_RPC_CALL', 1, util_1.MetricLoggerUnit.None);
            util_1.metric.putMetric('V2GetReservesBatchSize', sortedPoolAddresses.length, util_1.MetricLoggerUnit.Count);
            util_1.metric.putMetric(`V2GetReservesBatchSize_${(0, util_1.ID_TO_NETWORK_NAME)(this.chainId)}`, sortedPoolAddresses.length, util_1.MetricLoggerUnit.Count);
            const [reservesResults, tokenPropertiesMap] = yield Promise.all([
                this.getPoolsData(sortedPoolAddresses, 'getReserves', providerConfig),
                this.tokenPropertiesProvider.getTokensProperties(this.flatten(tokenPairs), providerConfig),
            ]);
            log_1.log.info(`Got reserves for ${poolAddressSet.size} pools ${(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber)
                ? `as of block: ${yield (providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber)}.`
                : ``}`);
            const poolAddressToPool = {};
            const invalidPools = [];
            for (let i = 0; i < sortedPoolAddresses.length; i++) {
                const reservesResult = reservesResults[i];
                if (!(reservesResult === null || reservesResult === void 0 ? void 0 : reservesResult.success)) {
                    const [token0, token1] = sortedTokenPairs[i];
                    invalidPools.push([token0, token1]);
                    continue;
                }
                let [token0, token1] = sortedTokenPairs[i];
                if (((_a = tokenPropertiesMap[token0.address.toLowerCase()]) === null || _a === void 0 ? void 0 : _a.tokenValidationResult) === token_validator_provider_1.TokenValidationResult.FOT) {
                    token0 = new sdk_core_1.Token(token0.chainId, token0.address, token0.decimals, token0.symbol, token0.name, true, // at this point we know it's valid token address
                    (_c = (_b = tokenPropertiesMap[token0.address.toLowerCase()]) === null || _b === void 0 ? void 0 : _b.tokenFeeResult) === null || _c === void 0 ? void 0 : _c.buyFeeBps, (_e = (_d = tokenPropertiesMap[token0.address.toLowerCase()]) === null || _d === void 0 ? void 0 : _d.tokenFeeResult) === null || _e === void 0 ? void 0 : _e.sellFeeBps);
                }
                if (((_f = tokenPropertiesMap[token1.address.toLowerCase()]) === null || _f === void 0 ? void 0 : _f.tokenValidationResult) === token_validator_provider_1.TokenValidationResult.FOT) {
                    token1 = new sdk_core_1.Token(token1.chainId, token1.address, token1.decimals, token1.symbol, token1.name, true, // at this point we know it's valid token address
                    (_h = (_g = tokenPropertiesMap[token1.address.toLowerCase()]) === null || _g === void 0 ? void 0 : _g.tokenFeeResult) === null || _h === void 0 ? void 0 : _h.buyFeeBps, (_k = (_j = tokenPropertiesMap[token1.address.toLowerCase()]) === null || _j === void 0 ? void 0 : _j.tokenFeeResult) === null || _k === void 0 ? void 0 : _k.sellFeeBps);
                }
                const { reserve0, reserve1 } = reservesResult.result;
                const pool = new v2_sdk_1.Pair(util_1.CurrencyAmount.fromRawAmount(token0, reserve0.toString()), util_1.CurrencyAmount.fromRawAmount(token1, reserve1.toString()));
                const poolAddress = sortedPoolAddresses[i];
                poolAddressToPool[poolAddress] = pool;
            }
            if (invalidPools.length > 0) {
                log_1.log.info({
                    invalidPools: lodash_1.default.map(invalidPools, ([token0, token1]) => `${token0.symbol}/${token1.symbol}`),
                }, `${invalidPools.length} pools invalid after checking their slot0 and liquidity results. Dropping.`);
            }
            const poolStrs = lodash_1.default.map(Object.values(poolAddressToPool), routes_1.poolToString);
            log_1.log.debug({ poolStrs }, `Found ${poolStrs.length} valid pools`);
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
        const [token0, token1] = tokenA.sortsBefore(tokenB)
            ? [tokenA, tokenB]
            : [tokenB, tokenA];
        const cacheKey = `${this.chainId}/${token0.address}/${token1.address}`;
        const cachedAddress = this.POOL_ADDRESS_CACHE[cacheKey];
        if (cachedAddress) {
            return { poolAddress: cachedAddress, token0, token1 };
        }
        const poolAddress = v2_sdk_1.Pair.getAddress(token0, token1);
        this.POOL_ADDRESS_CACHE[cacheKey] = poolAddress;
        return { poolAddress, token0, token1 };
    }
    getPoolsData(poolAddresses, functionName, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { results, blockNumber } = yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                return this.multicall2Provider.callSameFunctionOnMultipleContracts({
                    addresses: poolAddresses,
                    contractInterface: IUniswapV2Pair__factory_1.IUniswapV2Pair__factory.createInterface(),
                    functionName: functionName,
                    providerConfig,
                });
            }), this.retryOptions);
            log_1.log.debug(`Pool data fetched as of block ${blockNumber}`);
            return results;
        });
    }
    // We are using ES2017. ES2019 has native flatMap support
    flatten(tokenPairs) {
        const tokens = new Array();
        for (const [tokenA, tokenB] of tokenPairs) {
            tokens.push(tokenA);
            tokens.push(tokenB);
        }
        return tokens;
    }
}
exports.V2PoolProvider = V2PoolProvider;
