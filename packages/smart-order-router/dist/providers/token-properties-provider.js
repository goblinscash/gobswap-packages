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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenPropertiesProvider = exports.NEGATIVE_CACHE_ENTRY_TTL = exports.POSITIVE_CACHE_ENTRY_TTL = exports.DEFAULT_TOKEN_PROPERTIES_RESULT = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const util_1 = require("../util");
const token_fee_fetcher_1 = require("./token-fee-fetcher");
const token_validator_provider_1 = require("./token-validator-provider");
exports.DEFAULT_TOKEN_PROPERTIES_RESULT = {
    tokenFeeResult: token_fee_fetcher_1.DEFAULT_TOKEN_FEE_RESULT,
};
exports.POSITIVE_CACHE_ENTRY_TTL = 600; // 10 minutes in seconds
exports.NEGATIVE_CACHE_ENTRY_TTL = 600; // 10 minutes in seconds
class TokenPropertiesProvider {
    constructor(chainId, tokenPropertiesCache, tokenFeeFetcher, allowList = token_validator_provider_1.DEFAULT_ALLOWLIST, positiveCacheEntryTTL = exports.POSITIVE_CACHE_ENTRY_TTL, negativeCacheEntryTTL = exports.NEGATIVE_CACHE_ENTRY_TTL) {
        this.chainId = chainId;
        this.tokenPropertiesCache = tokenPropertiesCache;
        this.tokenFeeFetcher = tokenFeeFetcher;
        this.allowList = allowList;
        this.positiveCacheEntryTTL = positiveCacheEntryTTL;
        this.negativeCacheEntryTTL = negativeCacheEntryTTL;
        this.CACHE_KEY = (chainId, address) => `token-properties-${chainId}-${address}`;
    }
    getTokensProperties(tokens, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenToResult = {};
            if (!(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.enableFeeOnTransferFeeFetching) ||
                this.chainId !== sdk_core_1.ChainId.MAINNET) {
                return tokenToResult;
            }
            const addressesToFetchFeesOnchain = [];
            const addressesRaw = this.buildAddressesRaw(tokens);
            const tokenProperties = yield this.tokenPropertiesCache.batchGet(addressesRaw);
            // Check if we have cached token validation results for any tokens.
            for (const address of addressesRaw) {
                const cachedValue = tokenProperties[address];
                if (cachedValue) {
                    util_1.metric.putMetric('TokenPropertiesProviderBatchGetCacheHit', 1, util_1.MetricLoggerUnit.Count);
                    const tokenFee = cachedValue.tokenFeeResult;
                    const tokenFeeResultExists = tokenFee && (tokenFee.buyFeeBps || tokenFee.sellFeeBps);
                    if (tokenFeeResultExists) {
                        util_1.metric.putMetric(`TokenPropertiesProviderCacheHitTokenFeeResultExists${tokenFeeResultExists}`, 1, util_1.MetricLoggerUnit.Count);
                    }
                    else {
                        util_1.metric.putMetric(`TokenPropertiesProviderCacheHitTokenFeeResultNotExists`, 1, util_1.MetricLoggerUnit.Count);
                    }
                    tokenToResult[address] = cachedValue;
                }
                else if (this.allowList.has(address)) {
                    tokenToResult[address] = {
                        tokenValidationResult: token_validator_provider_1.TokenValidationResult.UNKN,
                    };
                }
                else {
                    addressesToFetchFeesOnchain.push(address);
                }
            }
            if (addressesToFetchFeesOnchain.length > 0) {
                let tokenFeeMap = {};
                try {
                    tokenFeeMap = yield this.tokenFeeFetcher.fetchFees(addressesToFetchFeesOnchain, providerConfig);
                }
                catch (err) {
                    util_1.log.error({ err }, `Error fetching fees for tokens ${addressesToFetchFeesOnchain}`);
                }
                yield Promise.all(addressesToFetchFeesOnchain.map((address) => {
                    const tokenFee = tokenFeeMap[address];
                    const tokenFeeResultExists = tokenFee && (tokenFee.buyFeeBps || tokenFee.sellFeeBps);
                    if (tokenFeeResultExists) {
                        // we will leverage the metric to log the token fee result, if it exists
                        // the idea is that the token fee should not differ by too much across tokens,
                        // so that we can accurately log the token fee for a particular quote request (without breaching metrics dimensionality limit)
                        // in the form of metrics.
                        // if we log as logging, given prod traffic volume, the logging volume will be high.
                        util_1.metric.putMetric(`TokenPropertiesProviderTokenFeeResultCacheMissExists${tokenFeeResultExists}`, 1, util_1.MetricLoggerUnit.Count);
                        const tokenPropertiesResult = {
                            tokenFeeResult: tokenFee,
                            tokenValidationResult: token_validator_provider_1.TokenValidationResult.FOT,
                        };
                        tokenToResult[address] = tokenPropertiesResult;
                        util_1.metric.putMetric('TokenPropertiesProviderBatchGetCacheMiss', 1, util_1.MetricLoggerUnit.Count);
                        // update cache concurrently
                        // at this point, we are confident that the tokens are FOT, so we can hardcode the validation result
                        return this.tokenPropertiesCache.set(this.CACHE_KEY(this.chainId, address), tokenPropertiesResult, this.positiveCacheEntryTTL);
                    }
                    else {
                        util_1.metric.putMetric(`TokenPropertiesProviderTokenFeeResultCacheMissNotExists`, 1, util_1.MetricLoggerUnit.Count);
                        const tokenPropertiesResult = {
                            tokenFeeResult: undefined,
                            tokenValidationResult: undefined,
                        };
                        tokenToResult[address] = tokenPropertiesResult;
                        return this.tokenPropertiesCache.set(this.CACHE_KEY(this.chainId, address), tokenPropertiesResult, this.negativeCacheEntryTTL);
                    }
                }));
            }
            return tokenToResult;
        });
    }
    buildAddressesRaw(tokens) {
        const addressesRaw = new Set();
        for (const token of tokens) {
            const address = token.address.toLowerCase();
            if (!addressesRaw.has(address)) {
                addressesRaw.add(address);
            }
        }
        return addressesRaw;
    }
}
exports.TokenPropertiesProvider = TokenPropertiesProvider;
