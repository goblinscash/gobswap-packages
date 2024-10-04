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
exports.StaticV2SubgraphProvider = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const v2_sdk_1 = require("@uniswap/v2-sdk");
const lodash_1 = __importDefault(require("lodash"));
const chains_1 = require("../../util/chains");
const log_1 = require("../../util/log");
const token_provider_1 = require("../token-provider");
const BASES_TO_CHECK_TRADES_AGAINST = {
    [sdk_core_1.ChainId.MAINNET]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MAINNET],
        token_provider_1.DAI_MAINNET,
        token_provider_1.USDC_MAINNET,
        token_provider_1.USDT_MAINNET,
        token_provider_1.WBTC_MAINNET
    ],
    [sdk_core_1.ChainId.GOERLI]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.GOERLI]],
    [sdk_core_1.ChainId.SEPOLIA]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.SEPOLIA]],
    //v2 not deployed on [optimism, arbitrum, polygon, celo, gnosis, moonbeam, bnb, avalanche] and their testnets
    [sdk_core_1.ChainId.OPTIMISM]: [],
    [sdk_core_1.ChainId.ARBITRUM_ONE]: [],
    [sdk_core_1.ChainId.ARBITRUM_GOERLI]: [],
    [sdk_core_1.ChainId.OPTIMISM_GOERLI]: [],
    [sdk_core_1.ChainId.POLYGON]: [],
    [sdk_core_1.ChainId.POLYGON_MUMBAI]: [],
    [sdk_core_1.ChainId.CELO]: [],
    [sdk_core_1.ChainId.CELO_ALFAJORES]: [],
    [sdk_core_1.ChainId.GNOSIS]: [],
    [sdk_core_1.ChainId.MOONBEAM]: [],
    [sdk_core_1.ChainId.BNB]: [],
    [sdk_core_1.ChainId.AVALANCHE]: [],
    [sdk_core_1.ChainId.BASE_GOERLI]: [],
    [sdk_core_1.ChainId.BASE]: [],
    [sdk_core_1.ChainId.SMARTBCH]: []
};
/**
 * Provider that does not get data from an external source and instead returns
 * a hardcoded list of Subgraph pools.
 *
 * Since the pools are hardcoded, the liquidity/price values are dummys and should not
 * be depended on.
 *
 * Useful for instances where other data sources are unavailable. E.g. subgraph not available.
 *
 * @export
 * @class StaticV2SubgraphProvider
 */
class StaticV2SubgraphProvider {
    constructor(chainId) {
        this.chainId = chainId;
    }
    getPools(tokenIn, tokenOut) {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.info('In static subgraph provider for V2');
            const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId];
            const basePairs = lodash_1.default.flatMap(bases, (base) => bases.map((otherBase) => [base, otherBase]));
            if (tokenIn && tokenOut) {
                basePairs.push([tokenIn, tokenOut], ...bases.map((base) => [tokenIn, base]), ...bases.map((base) => [tokenOut, base]));
            }
            const pairs = (0, lodash_1.default)(basePairs)
                .filter((tokens) => Boolean(tokens[0] && tokens[1]))
                .filter(([tokenA, tokenB]) => tokenA.address !== tokenB.address && !tokenA.equals(tokenB))
                .value();
            const poolAddressSet = new Set();
            const subgraphPools = (0, lodash_1.default)(pairs)
                .map(([tokenA, tokenB]) => {
                const poolAddress = v2_sdk_1.Pair.getAddress(tokenA, tokenB);
                if (poolAddressSet.has(poolAddress)) {
                    return undefined;
                }
                poolAddressSet.add(poolAddress);
                const [token0, token1] = tokenA.sortsBefore(tokenB)
                    ? [tokenA, tokenB]
                    : [tokenB, tokenA];
                return {
                    id: poolAddress,
                    liquidity: '100',
                    token0: {
                        id: token0.address
                    },
                    token1: {
                        id: token1.address
                    },
                    supply: 100,
                    reserve: 100,
                    reserveUSD: 100
                };
            })
                .compact()
                .value();
            return subgraphPools;
        });
    }
}
exports.StaticV2SubgraphProvider = StaticV2SubgraphProvider;
