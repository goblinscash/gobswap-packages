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
exports.TokenValidatorProvider = exports.TokenValidationResult = exports.DEFAULT_ALLOWLIST = void 0;
const lodash_1 = __importDefault(require("lodash"));
const ITokenValidator__factory_1 = require("../types/other/factories/ITokenValidator__factory");
const util_1 = require("../util");
exports.DEFAULT_ALLOWLIST = new Set([
    // RYOSHI. Does not allow transfers between contracts so fails validation.
    '0x777E2ae845272a2F540ebf6a3D03734A5a8f618e'.toLowerCase(),
]);
var TokenValidationResult;
(function (TokenValidationResult) {
    TokenValidationResult[TokenValidationResult["UNKN"] = 0] = "UNKN";
    TokenValidationResult[TokenValidationResult["FOT"] = 1] = "FOT";
    TokenValidationResult[TokenValidationResult["STF"] = 2] = "STF";
})(TokenValidationResult = exports.TokenValidationResult || (exports.TokenValidationResult = {}));
const TOKEN_VALIDATOR_ADDRESS = '0xb5ee1690b7dcc7859771148d0889be838fe108e0';
const AMOUNT_TO_FLASH_BORROW = '1000';
const GAS_LIMIT_PER_VALIDATE = 1000000;
class TokenValidatorProvider {
    constructor(chainId, multicall2Provider, tokenValidationCache, tokenValidatorAddress = TOKEN_VALIDATOR_ADDRESS, gasLimitPerCall = GAS_LIMIT_PER_VALIDATE, amountToFlashBorrow = AMOUNT_TO_FLASH_BORROW, allowList = exports.DEFAULT_ALLOWLIST) {
        this.chainId = chainId;
        this.multicall2Provider = multicall2Provider;
        this.tokenValidationCache = tokenValidationCache;
        this.tokenValidatorAddress = tokenValidatorAddress;
        this.gasLimitPerCall = gasLimitPerCall;
        this.amountToFlashBorrow = amountToFlashBorrow;
        this.allowList = allowList;
        this.CACHE_KEY = (chainId, address) => `token-${chainId}-${address}`;
        this.BASES = [util_1.WRAPPED_NATIVE_CURRENCY[this.chainId].address];
    }
    validateTokens(tokens, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenAddressToToken = lodash_1.default.keyBy(tokens, 'address');
            const addressesRaw = (0, lodash_1.default)(tokens)
                .map((token) => token.address)
                .uniq()
                .value();
            const addresses = [];
            const tokenToResult = {};
            // Check if we have cached token validation results for any tokens.
            for (const address of addressesRaw) {
                if (yield this.tokenValidationCache.has(this.CACHE_KEY(this.chainId, address))) {
                    tokenToResult[address.toLowerCase()] =
                        (yield this.tokenValidationCache.get(this.CACHE_KEY(this.chainId, address)));
                    util_1.metric.putMetric(`TokenValidatorProviderValidateCacheHitResult${tokenToResult[address.toLowerCase()]}`, 1, util_1.MetricLoggerUnit.Count);
                }
                else {
                    addresses.push(address);
                }
            }
            util_1.log.info(`Got token validation results for ${addressesRaw.length - addresses.length} tokens from cache. Getting ${addresses.length} on-chain.`);
            const functionParams = (0, lodash_1.default)(addresses)
                .map((address) => [address, this.BASES, this.amountToFlashBorrow])
                .value();
            // We use the validate function instead of batchValidate to avoid poison pill problem.
            // One token that consumes too much gas could cause the entire batch to fail.
            const multicallResult = yield this.multicall2Provider.callSameFunctionOnContractWithMultipleParams({
                address: this.tokenValidatorAddress,
                contractInterface: ITokenValidator__factory_1.ITokenValidator__factory.createInterface(),
                functionName: 'validate',
                functionParams: functionParams,
                providerConfig,
                additionalConfig: {
                    gasLimitPerCallOverride: this.gasLimitPerCall,
                },
            });
            for (let i = 0; i < multicallResult.results.length; i++) {
                const resultWrapper = multicallResult.results[i];
                const tokenAddress = addresses[i];
                const token = tokenAddressToToken[tokenAddress];
                if (this.allowList.has(token.address.toLowerCase())) {
                    tokenToResult[token.address.toLowerCase()] = TokenValidationResult.UNKN;
                    yield this.tokenValidationCache.set(this.CACHE_KEY(this.chainId, token.address.toLowerCase()), tokenToResult[token.address.toLowerCase()]);
                    continue;
                }
                // Could happen if the tokens transfer consumes too much gas so we revert. Just
                // drop the token in that case.
                if (!resultWrapper.success) {
                    util_1.metric.putMetric("TokenValidatorProviderValidateFailed", 1, util_1.MetricLoggerUnit.Count);
                    util_1.log.error({ result: resultWrapper }, `Failed to validate token ${token.symbol}`);
                    continue;
                }
                util_1.metric.putMetric("TokenValidatorProviderValidateSuccess", 1, util_1.MetricLoggerUnit.Count);
                const validationResult = resultWrapper.result[0];
                tokenToResult[token.address.toLowerCase()] =
                    validationResult;
                yield this.tokenValidationCache.set(this.CACHE_KEY(this.chainId, token.address.toLowerCase()), tokenToResult[token.address.toLowerCase()]);
                util_1.metric.putMetric(`TokenValidatorProviderValidateCacheMissResult${validationResult}`, 1, util_1.MetricLoggerUnit.Count);
            }
            return {
                getValidationByToken: (token) => tokenToResult[token.address.toLowerCase()],
            };
        });
    }
}
exports.TokenValidatorProvider = TokenValidatorProvider;
