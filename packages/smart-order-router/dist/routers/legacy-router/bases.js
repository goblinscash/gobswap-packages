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
exports.CUSTOM_BASES = exports.ADDITIONAL_BASES = exports.BASES_TO_CHECK_TRADES_AGAINST = void 0;
const token_provider_1 = require("./../../providers/token-provider");
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const sdk_core_1 = require("@uniswap/sdk-core");
const token_provider_2 = require("../../providers/token-provider");
const chains_1 = require("../../util/chains");
const BASES_TO_CHECK_TRADES_AGAINST = (_tokenProvider) => {
    return {
        [sdk_core_1.ChainId.MAINNET]: [
            chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MAINNET],
            token_provider_2.DAI_MAINNET,
            token_provider_2.USDC_MAINNET,
            token_provider_2.USDT_MAINNET,
            token_provider_2.WBTC_MAINNET,
        ],
        [sdk_core_1.ChainId.GOERLI]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.GOERLI]],
        [sdk_core_1.ChainId.SEPOLIA]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.SEPOLIA]],
        [sdk_core_1.ChainId.OPTIMISM]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.OPTIMISM]],
        [sdk_core_1.ChainId.OPTIMISM_GOERLI]: [
            chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.OPTIMISM_GOERLI],
        ],
        [sdk_core_1.ChainId.ARBITRUM_ONE]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.ARBITRUM_ONE]],
        [sdk_core_1.ChainId.ARBITRUM_GOERLI]: [
            chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.ARBITRUM_GOERLI],
        ],
        [sdk_core_1.ChainId.POLYGON]: [token_provider_2.WMATIC_POLYGON],
        [sdk_core_1.ChainId.POLYGON_MUMBAI]: [token_provider_2.WMATIC_POLYGON_MUMBAI],
        [sdk_core_1.ChainId.CELO]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.CELO]],
        [sdk_core_1.ChainId.CELO_ALFAJORES]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.CELO_ALFAJORES]],
        [sdk_core_1.ChainId.GNOSIS]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.GNOSIS]],
        [sdk_core_1.ChainId.MOONBEAM]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MOONBEAM]],
        [sdk_core_1.ChainId.BNB]: [
            chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BNB],
            token_provider_2.BUSD_BNB,
            token_provider_2.DAI_BNB,
            token_provider_2.USDC_BNB,
            token_provider_2.USDT_BNB,
            token_provider_2.BTC_BNB,
            token_provider_2.BCH_BNB
        ],
        [sdk_core_1.ChainId.AVALANCHE]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.AVALANCHE], token_provider_2.USDC_AVAX, token_provider_2.DAI_AVAX],
        [sdk_core_1.ChainId.BASE]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BASE], token_provider_2.USDC_BASE],
        [sdk_core_1.ChainId.BASE_GOERLI]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BASE_GOERLI]],
        [sdk_core_1.ChainId.SMARTBCH]: [token_provider_1.GOB, chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.SMARTBCH], token_provider_2.BC_BCH],
    };
};
exports.BASES_TO_CHECK_TRADES_AGAINST = BASES_TO_CHECK_TRADES_AGAINST;
const getBasePairByAddress = (tokenProvider, _chainId, fromAddress, toAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const accessor = yield tokenProvider.getTokens([toAddress]);
    const toToken = accessor.getTokenByAddress(toAddress);
    if (!toToken)
        return {};
    return {
        [fromAddress]: [toToken],
    };
});
const ADDITIONAL_BASES = (tokenProvider) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        [sdk_core_1.ChainId.MAINNET]: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0xA948E86885e12Fb09AfEF8C52142EBDbDf73cD18', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0x561a4717537ff4AF5c687328c0f7E90a319705C0', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0x956F47F50A910163D8BF957Cf5846D573E7f87CA', '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', '0x956F47F50A910163D8BF957Cf5846D573E7f87CA'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0x853d955acef822db058eb8505911ed77f175b99e', '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x853d955acef822db058eb8505911ed77f175b99e'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d'))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'))),
    };
});
exports.ADDITIONAL_BASES = ADDITIONAL_BASES;
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
const CUSTOM_BASES = (tokenProvider) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        [sdk_core_1.ChainId.MAINNET]: Object.assign(Object.assign({}, (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0xd46ba6d942050d489dbd938a2c909a5d5039a161', token_provider_2.DAI_MAINNET.address))), (yield getBasePairByAddress(tokenProvider, sdk_core_1.ChainId.MAINNET, '0xd46ba6d942050d489dbd938a2c909a5d5039a161', chains_1.WRAPPED_NATIVE_CURRENCY[1].address))),
    };
});
exports.CUSTOM_BASES = CUSTOM_BASES;
