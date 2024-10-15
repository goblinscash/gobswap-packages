/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Token } from '@uniswap/sdk-core';
import axios from 'axios';
import { log } from '../util/log';
import { metric, MetricLoggerUnit } from '../util/metric';
export class CachingTokenListProvider {
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
    static async fromTokenListURI(chainId, tokenListURI, tokenCache) {
        const now = Date.now();
        const tokenList = await this.buildTokenList(tokenListURI);
        metric.putMetric('TokenListLoad', Date.now() - now, MetricLoggerUnit.Milliseconds);
        return new CachingTokenListProvider(chainId, tokenList, tokenCache);
    }
    static async buildTokenList(tokenListURI) {
        log.info(`Getting tokenList from ${tokenListURI}.`);
        const response = await axios.get(tokenListURI);
        log.info(`Got tokenList from ${tokenListURI}.`);
        const { data: tokenList, status } = response;
        if (status != 200) {
            log.error({ response }, `Unabled to get token list from ${tokenListURI}.`);
            throw new Error(`Unable to get token list from ${tokenListURI}`);
        }
        return tokenList;
    }
    static async fromTokenList(chainId, tokenList, tokenCache) {
        const now = Date.now();
        const tokenProvider = new CachingTokenListProvider(chainId, tokenList, tokenCache);
        metric.putMetric('TokenListLoad', Date.now() - now, MetricLoggerUnit.Milliseconds);
        return tokenProvider;
    }
    /**
     * If no addresses array is specified, all tokens in the token list are
     * returned.
     *
     * @param _addresses (optional) The token addresses to get.
     * @returns Promise<TokenAccessor> A token accessor with methods for accessing the tokens.
     */
    async getTokens(_addresses) {
        var _a;
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
                const token = await this.getTokenByAddress(address);
                addToken(token);
            }
        }
        else {
            const chainTokens = (_a = this.chainToTokenInfos.get(this.chainId.toString())) !== null && _a !== void 0 ? _a : [];
            for (const info of chainTokens) {
                const token = await this.buildToken(info);
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
    }
    async hasTokenBySymbol(_symbol) {
        return this.chainSymbolToTokenInfo.has(this.CHAIN_SYMBOL_KEY(this.chainId, _symbol));
    }
    async getTokenBySymbol(_symbol) {
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
        const token = await this.buildToken(tokenInfo);
        return token;
    }
    async hasTokenByAddress(address) {
        return this.chainAddressToTokenInfo.has(this.CHAIN_ADDRESS_KEY(this.chainId, address));
    }
    async getTokenByAddress(address) {
        const tokenInfo = this.chainAddressToTokenInfo.get(this.CHAIN_ADDRESS_KEY(this.chainId, address));
        if (!tokenInfo) {
            return undefined;
        }
        const token = await this.buildToken(tokenInfo);
        return token;
    }
    async buildToken(tokenInfo) {
        const cacheKey = this.CACHE_KEY(tokenInfo);
        const cachedToken = await this.tokenCache.get(cacheKey);
        if (cachedToken) {
            return cachedToken;
        }
        const token = new Token(this.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name);
        await this.tokenCache.set(cacheKey, token);
        return token;
    }
}
