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
exports.CachingTokenListProvider = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const sdk_core_1 = require("@uniswap/sdk-core");
const axios_1 = __importDefault(require("axios"));
const log_1 = require("../util/log");
const metric_1 = require("../util/metric");
class CachingTokenListProvider {
    /**
     * Creates an instance of CachingTokenListProvider.
     * Token metadata (e.g. symbol and decimals) generally don't change so can be cached indefinitely.
     *
     * @param chainId The chain id to use.
     * @param tokenList The token list to get the tokens from.
     * @param tokenCache Cache instance to hold cached tokens.
     */
    constructor(chainId, tokenList, tokenCache) {
        this.tokenCache = tokenCache;
        this.CACHE_KEY = (tokenInfo) => `token-list-token-${this.chainId}/${this.tokenList.name}/${this.tokenList.timestamp}/${this.tokenList.version}/${tokenInfo.address.toLowerCase()}/${tokenInfo.decimals}/${tokenInfo.symbol}/${tokenInfo.name}`;
        this.CHAIN_SYMBOL_KEY = (chainId, symbol) => `${chainId.toString()}/${symbol}`;
        this.CHAIN_ADDRESS_KEY = (chainId, address) => `${chainId.toString()}/${address.toLowerCase()}`;
        this.chainId = chainId;
        this.tokenList = tokenList;
        this.chainToTokenInfos = new Map();
        this.chainSymbolToTokenInfo = new Map();
        this.chainAddressToTokenInfo = new Map();
        for (const tokenInfo of this.tokenList.tokens) {
            const chainId = tokenInfo.chainId;
            const chainIdString = chainId.toString();
            const symbol = tokenInfo.symbol;
            const address = tokenInfo.address.toLowerCase();
            if (!this.chainToTokenInfos.has(chainIdString)) {
                this.chainToTokenInfos.set(chainIdString, []);
            }
            this.chainToTokenInfos.get(chainIdString).push(tokenInfo);
            this.chainSymbolToTokenInfo.set(this.CHAIN_SYMBOL_KEY(chainId, symbol), tokenInfo);
            this.chainAddressToTokenInfo.set(this.CHAIN_ADDRESS_KEY(chainId, address), tokenInfo);
        }
    }
    static fromTokenListURI(chainId, tokenListURI, tokenCache) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const tokenList = yield this.buildTokenList(tokenListURI);
            metric_1.metric.putMetric('TokenListLoad', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
            return new CachingTokenListProvider(chainId, tokenList, tokenCache);
        });
    }
    static buildTokenList(tokenListURI) {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.info(`Getting tokenList from ${tokenListURI}.`);
            const response = yield axios_1.default.get(tokenListURI);
            log_1.log.info(`Got tokenList from ${tokenListURI}.`);
            const { data: tokenList, status } = response;
            if (status != 200) {
                log_1.log.error({ response }, `Unabled to get token list from ${tokenListURI}.`);
                throw new Error(`Unable to get token list from ${tokenListURI}`);
            }
            return tokenList;
        });
    }
    static fromTokenList(chainId, tokenList, tokenCache) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const tokenProvider = new CachingTokenListProvider(chainId, tokenList, tokenCache);
            metric_1.metric.putMetric('TokenListLoad', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
            return tokenProvider;
        });
    }
    /**
     * If no addresses array is specified, all tokens in the token list are
     * returned.
     *
     * @param _addresses (optional) The token addresses to get.
     * @returns Promise<TokenAccessor> A token accessor with methods for accessing the tokens.
     */
    getTokens(_addresses) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const addressToToken = new Map();
            const symbolToToken = new Map();
            const addToken = (token) => {
                if (!token)
                    return;
                addressToToken.set(token.address.toLowerCase(), token);
                if (token.symbol !== undefined) {
                    symbolToToken.set(token.symbol.toLowerCase(), token);
                }
            };
            if (_addresses) {
                for (const address of _addresses) {
                    const token = yield this.getTokenByAddress(address);
                    addToken(token);
                }
            }
            else {
                const chainTokens = (_a = this.chainToTokenInfos.get(this.chainId.toString())) !== null && _a !== void 0 ? _a : [];
                for (const info of chainTokens) {
                    const token = yield this.buildToken(info);
                    addToken(token);
                }
            }
            return {
                getTokenByAddress: (address) => addressToToken.get(address.toLowerCase()),
                getTokenBySymbol: (symbol) => symbolToToken.get(symbol.toLowerCase()),
                getAllTokens: () => {
                    return Array.from(addressToToken.values());
                },
            };
        });
    }
    hasTokenBySymbol(_symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.chainSymbolToTokenInfo.has(this.CHAIN_SYMBOL_KEY(this.chainId, _symbol));
        });
    }
    getTokenBySymbol(_symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            let symbol = _symbol;
            // We consider ETH as a regular ERC20 Token throughout this package. We don't use the NativeCurrency object from the sdk.
            // When we build the calldata for swapping we insert wrapping/unwrapping as needed.
            if (_symbol == 'ETH') {
                symbol = 'WETH';
            }
            const tokenInfo = this.chainSymbolToTokenInfo.get(this.CHAIN_SYMBOL_KEY(this.chainId, symbol));
            if (!tokenInfo) {
                return undefined;
            }
            const token = yield this.buildToken(tokenInfo);
            return token;
        });
    }
    hasTokenByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.chainAddressToTokenInfo.has(this.CHAIN_ADDRESS_KEY(this.chainId, address));
        });
    }
    getTokenByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenInfo = this.chainAddressToTokenInfo.get(this.CHAIN_ADDRESS_KEY(this.chainId, address));
            if (!tokenInfo) {
                return undefined;
            }
            const token = yield this.buildToken(tokenInfo);
            return token;
        });
    }
    buildToken(tokenInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.CACHE_KEY(tokenInfo);
            const cachedToken = yield this.tokenCache.get(cacheKey);
            if (cachedToken) {
                return cachedToken;
            }
            const token = new sdk_core_1.Token(this.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name);
            yield this.tokenCache.set(cacheKey, token);
            return token;
        });
    }
}
exports.CachingTokenListProvider = CachingTokenListProvider;
