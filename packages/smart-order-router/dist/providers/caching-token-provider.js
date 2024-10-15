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
exports.CachingTokenProviderWithFallback = exports.CACHE_SEED_TOKENS = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("../util");
const token_provider_1 = require("./token-provider");
// These tokens will added to the Token cache on initialization.
exports.CACHE_SEED_TOKENS = {
    [sdk_core_1.ChainId.MAINNET]: {
        WETH: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MAINNET],
        USDC: token_provider_1.USDC_MAINNET,
        USDT: token_provider_1.USDT_MAINNET,
        WBTC: token_provider_1.WBTC_MAINNET,
        DAI: token_provider_1.DAI_MAINNET,
        // This token stores its symbol as bytes32, therefore can not be fetched on-chain using
        // our token providers.
        // This workaround adds it to the cache, so we won't try to fetch it on-chain.
        RING: new sdk_core_1.Token(sdk_core_1.ChainId.MAINNET, '0x9469D013805bFfB7D3DEBe5E7839237e535ec483', 18, 'RING', 'RING'),
    },
    [sdk_core_1.ChainId.SEPOLIA]: {
        USDC: token_provider_1.USDC_SEPOLIA,
    },
    [sdk_core_1.ChainId.OPTIMISM]: {
        USDC: token_provider_1.USDC_OPTIMISM,
        USDT: token_provider_1.USDT_OPTIMISM,
        WBTC: token_provider_1.WBTC_OPTIMISM,
        DAI: token_provider_1.DAI_OPTIMISM,
    },
    [sdk_core_1.ChainId.OPTIMISM_GOERLI]: {
        USDC: token_provider_1.USDC_OPTIMISM_GOERLI,
        USDT: token_provider_1.USDT_OPTIMISM_GOERLI,
        WBTC: token_provider_1.WBTC_OPTIMISM_GOERLI,
        DAI: token_provider_1.DAI_OPTIMISM_GOERLI,
    },
    [sdk_core_1.ChainId.ARBITRUM_ONE]: {
        USDC: token_provider_1.USDC_ARBITRUM,
        USDT: token_provider_1.USDT_ARBITRUM,
        WBTC: token_provider_1.WBTC_ARBITRUM,
        DAI: token_provider_1.DAI_ARBITRUM,
    },
    [sdk_core_1.ChainId.ARBITRUM_GOERLI]: {
        USDC: token_provider_1.USDC_ARBITRUM_GOERLI,
    },
    [sdk_core_1.ChainId.POLYGON]: {
        WMATIC: token_provider_1.WMATIC_POLYGON,
        USDC: token_provider_1.USDC_POLYGON,
    },
    [sdk_core_1.ChainId.POLYGON_MUMBAI]: {
        WMATIC: token_provider_1.WMATIC_POLYGON_MUMBAI,
        DAI: token_provider_1.DAI_POLYGON_MUMBAI,
    },
    [sdk_core_1.ChainId.CELO]: {
        CELO: token_provider_1.CELO,
        CUSD: token_provider_1.CUSD_CELO,
        CEUR: token_provider_1.CEUR_CELO,
        DAI: token_provider_1.DAI_CELO,
    },
    [sdk_core_1.ChainId.CELO_ALFAJORES]: {
        CELO: token_provider_1.CELO_ALFAJORES,
        CUSD: token_provider_1.CUSD_CELO_ALFAJORES,
        CEUR: token_provider_1.CUSD_CELO_ALFAJORES,
        DAI: token_provider_1.DAI_CELO_ALFAJORES,
    },
    [sdk_core_1.ChainId.GNOSIS]: {
        WXDAI: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.GNOSIS],
        USDC_ETHEREUM_GNOSIS: token_provider_1.USDC_ETHEREUM_GNOSIS,
    },
    [sdk_core_1.ChainId.MOONBEAM]: {
        USDC: token_provider_1.USDC_MOONBEAM,
        DAI: token_provider_1.DAI_MOONBEAM,
        WBTC: token_provider_1.WBTC_MOONBEAM,
        WGLMR: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MOONBEAM],
    },
    [sdk_core_1.ChainId.BNB]: {
        USDC: token_provider_1.USDC_BNB,
        USDT: token_provider_1.USDT_BNB,
        BUSD: token_provider_1.BUSD_BNB,
        ETH: token_provider_1.ETH_BNB,
        DAI: token_provider_1.DAI_BNB,
        BTC: token_provider_1.BTC_BNB,
        WBNB: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BNB],
    },
    [sdk_core_1.ChainId.AVALANCHE]: {
        USDC: token_provider_1.USDC_AVAX,
        DAI: token_provider_1.DAI_AVAX,
        WAVAX: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.AVALANCHE],
    },
    [sdk_core_1.ChainId.BASE]: {
        USDC: token_provider_1.USDC_BASE,
        WETH: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BASE],
    },
    [sdk_core_1.ChainId.SMARTBCH]: {
        USDT: token_provider_1.USDT_SBCH,
        GOB: token_provider_1.GOB,
        BCBCH: token_provider_1.BC_BCH,
        WBCH: util_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.SMARTBCH],
    }
    // Currently we do not have providers for Moonbeam mainnet or Gnosis testnet
};
/**
 * Provider for getting token metadata that falls back to a different provider
 * in the event of failure.
 *
 * @export
 * @class CachingTokenProviderWithFallback
 */
class CachingTokenProviderWithFallback {
    constructor(chainId, 
    // Token metadata (e.g. symbol and decimals) don't change so can be cached indefinitely.
    // Constructing a new token object is slow as sdk-core does checksumming.
    tokenCache, primaryTokenProvider, fallbackTokenProvider) {
        this.chainId = chainId;
        this.tokenCache = tokenCache;
        this.primaryTokenProvider = primaryTokenProvider;
        this.fallbackTokenProvider = fallbackTokenProvider;
        this.CACHE_KEY = (chainId, address) => `token-${chainId}-${address}`;
    }
    getTokens(_addresses) {
        return __awaiter(this, void 0, void 0, function* () {
            const seedTokens = exports.CACHE_SEED_TOKENS[this.chainId];
            if (seedTokens) {
                for (const token of Object.values(seedTokens)) {
                    yield this.tokenCache.set(this.CACHE_KEY(this.chainId, token.address.toLowerCase()), token);
                }
            }
            const addressToToken = {};
            const symbolToToken = {};
            const addresses = (0, lodash_1.default)(_addresses)
                .map((address) => address.toLowerCase())
                .uniq()
                .value();
            const addressesToFindInPrimary = [];
            const addressesToFindInSecondary = [];
            for (const address of addresses) {
                if (yield this.tokenCache.has(this.CACHE_KEY(this.chainId, address))) {
                    addressToToken[address.toLowerCase()] = (yield this.tokenCache.get(this.CACHE_KEY(this.chainId, address)));
                    symbolToToken[addressToToken[address].symbol] =
                        (yield this.tokenCache.get(this.CACHE_KEY(this.chainId, address)));
                }
                else {
                    addressesToFindInPrimary.push(address);
                }
            }
            util_1.log.info({ addressesToFindInPrimary }, `Found ${addresses.length - addressesToFindInPrimary.length} out of ${addresses.length} tokens in local cache. ${addressesToFindInPrimary.length > 0
                ? `Checking primary token provider for ${addressesToFindInPrimary.length} tokens`
                : ``}
      `);
            if (addressesToFindInPrimary.length > 0) {
                const primaryTokenAccessor = yield this.primaryTokenProvider.getTokens(addressesToFindInPrimary);
                for (const address of addressesToFindInPrimary) {
                    const token = primaryTokenAccessor.getTokenByAddress(address);
                    if (token) {
                        addressToToken[address.toLowerCase()] = token;
                        symbolToToken[addressToToken[address].symbol] = token;
                        yield this.tokenCache.set(this.CACHE_KEY(this.chainId, address.toLowerCase()), addressToToken[address]);
                    }
                    else {
                        addressesToFindInSecondary.push(address);
                    }
                }
                util_1.log.info({ addressesToFindInSecondary }, `Found ${addressesToFindInPrimary.length - addressesToFindInSecondary.length} tokens in primary. ${this.fallbackTokenProvider
                    ? `Checking secondary token provider for ${addressesToFindInSecondary.length} tokens`
                    : `No fallback token provider specified. About to return.`}`);
            }
            if (this.fallbackTokenProvider && addressesToFindInSecondary.length > 0) {
                const secondaryTokenAccessor = yield this.fallbackTokenProvider.getTokens(addressesToFindInSecondary);
                for (const address of addressesToFindInSecondary) {
                    const token = secondaryTokenAccessor.getTokenByAddress(address);
                    if (token) {
                        addressToToken[address.toLowerCase()] = token;
                        symbolToToken[addressToToken[address].symbol] = token;
                        yield this.tokenCache.set(this.CACHE_KEY(this.chainId, address.toLowerCase()), addressToToken[address]);
                    }
                }
            }
            return {
                getTokenByAddress: (address) => {
                    return addressToToken[address.toLowerCase()];
                },
                getTokenBySymbol: (symbol) => {
                    return symbolToToken[symbol.toLowerCase()];
                },
                getAllTokens: () => {
                    return Object.values(addressToToken);
                },
            };
        });
    }
}
exports.CachingTokenProviderWithFallback = CachingTokenProviderWithFallback;
