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
exports.StaticV3SubgraphProvider = void 0;
const token_provider_1 = require("./../token-provider");
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_1 = __importDefault(require("lodash"));
const amounts_1 = require("../../util/amounts");
const chains_1 = require("../../util/chains");
const log_1 = require("../../util/log");
const token_provider_2 = require("../token-provider");
const BASES_TO_CHECK_TRADES_AGAINST = {
    [sdk_core_1.ChainId.MAINNET]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MAINNET],
        token_provider_2.DAI_MAINNET,
        token_provider_2.USDC_MAINNET,
        token_provider_2.USDT_MAINNET,
        token_provider_2.WBTC_MAINNET
    ],
    [sdk_core_1.ChainId.GOERLI]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.GOERLI],
        token_provider_2.USDT_GOERLI,
        token_provider_2.USDC_GOERLI,
        token_provider_2.WBTC_GOERLI,
        token_provider_2.DAI_GOERLI
    ],
    [sdk_core_1.ChainId.SEPOLIA]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.SEPOLIA], token_provider_2.USDC_SEPOLIA],
    [sdk_core_1.ChainId.OPTIMISM]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.OPTIMISM],
        token_provider_2.USDC_OPTIMISM,
        token_provider_2.DAI_OPTIMISM,
        token_provider_2.USDT_OPTIMISM,
        token_provider_2.WBTC_OPTIMISM,
        token_provider_2.OP_OPTIMISM
    ],
    [sdk_core_1.ChainId.ARBITRUM_ONE]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.ARBITRUM_ONE],
        token_provider_2.WBTC_ARBITRUM,
        token_provider_2.DAI_ARBITRUM,
        token_provider_2.USDC_ARBITRUM,
        token_provider_2.USDT_ARBITRUM,
        token_provider_2.ARB_ARBITRUM
    ],
    [sdk_core_1.ChainId.ARBITRUM_GOERLI]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.ARBITRUM_GOERLI],
        token_provider_2.USDC_ARBITRUM_GOERLI
    ],
    [sdk_core_1.ChainId.OPTIMISM_GOERLI]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.OPTIMISM_GOERLI],
        token_provider_2.USDC_OPTIMISM_GOERLI,
        token_provider_2.DAI_OPTIMISM_GOERLI,
        token_provider_2.USDT_OPTIMISM_GOERLI,
        token_provider_2.WBTC_OPTIMISM_GOERLI
    ],
    [sdk_core_1.ChainId.POLYGON]: [token_provider_2.USDC_POLYGON, token_provider_2.WETH_POLYGON, token_provider_2.WMATIC_POLYGON],
    [sdk_core_1.ChainId.POLYGON_MUMBAI]: [
        token_provider_2.DAI_POLYGON_MUMBAI,
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.POLYGON_MUMBAI],
        token_provider_2.WMATIC_POLYGON_MUMBAI
    ],
    [sdk_core_1.ChainId.CELO]: [token_provider_2.CELO, token_provider_2.CUSD_CELO, token_provider_2.CEUR_CELO, token_provider_2.DAI_CELO],
    [sdk_core_1.ChainId.CELO_ALFAJORES]: [
        token_provider_2.CELO_ALFAJORES,
        token_provider_2.CUSD_CELO_ALFAJORES,
        token_provider_2.CEUR_CELO_ALFAJORES,
        token_provider_2.DAI_CELO_ALFAJORES
    ],
    [sdk_core_1.ChainId.GNOSIS]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.GNOSIS],
        token_provider_2.WBTC_GNOSIS,
        token_provider_2.WXDAI_GNOSIS,
        token_provider_2.USDC_ETHEREUM_GNOSIS
    ],
    [sdk_core_1.ChainId.BNB]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BNB],
        token_provider_2.BUSD_BNB,
        token_provider_2.DAI_BNB,
        token_provider_2.USDC_BNB,
        token_provider_2.USDT_BNB,
        token_provider_2.BTC_BNB,
        token_provider_2.ETH_BNB,
        token_provider_1.BCH_BNB
    ],
    [sdk_core_1.ChainId.AVALANCHE]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.AVALANCHE],
        token_provider_2.USDC_AVAX,
        token_provider_2.DAI_AVAX
    ],
    [sdk_core_1.ChainId.MOONBEAM]: [
        chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.MOONBEAM],
        token_provider_2.DAI_MOONBEAM,
        token_provider_2.USDC_MOONBEAM,
        token_provider_2.WBTC_MOONBEAM
    ],
    [sdk_core_1.ChainId.BASE_GOERLI]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BASE_GOERLI]],
    [sdk_core_1.ChainId.BASE]: [chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.BASE], token_provider_2.USDC_BASE],
    [sdk_core_1.ChainId.SMARTBCH]: [token_provider_1.GOB, token_provider_2.BC_BCH, chains_1.WRAPPED_NATIVE_CURRENCY[sdk_core_1.ChainId.SMARTBCH]],
};
/**
 * Provider that uses a hardcoded list of V3 pools to generate a list of subgraph pools.
 *
 * Since the pools are hardcoded and the data does not come from the Subgraph, the TVL values
 * are dummys and should not be depended on.
 *
 * Useful for instances where other data sources are unavailable. E.g. Subgraph not available.
 *
 * @export
 * @class StaticV3SubgraphProvider
 */
class StaticV3SubgraphProvider {
    constructor(chainId, poolProvider) {
        this.chainId = chainId;
        this.poolProvider = poolProvider;
    }
    getPools(tokenIn, tokenOut, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.info('In static subgraph provider for V3');
            const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId];
            const basePairs = lodash_1.default.flatMap(bases, (base) => bases.map((otherBase) => [base, otherBase]));
            if (tokenIn && tokenOut) {
                basePairs.push([tokenIn, tokenOut], ...bases.map((base) => [tokenIn, base]), ...bases.map((base) => [tokenOut, base]));
            }
            const pairs = (0, lodash_1.default)(basePairs)
                .filter((tokens) => Boolean(tokens[0] && tokens[1]))
                .filter(([tokenA, tokenB]) => tokenA.address !== tokenB.address && !tokenA.equals(tokenB))
                .flatMap(([tokenA, tokenB]) => {
                return [
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.LOWEST],
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.LOW],
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.MEDIUM],
                    [tokenA, tokenB, v3_sdk_1.FeeAmount.HIGH]
                ];
            })
                .value();
            log_1.log.info(`V3 Static subgraph provider about to get ${pairs.length} pools on-chain`);
            const poolAccessor = yield this.poolProvider.getPools(pairs, providerConfig);
            const pools = poolAccessor.getAllPools();
            const poolAddressSet = new Set();
            const subgraphPools = (0, lodash_1.default)(pools)
                .map((pool) => {
                const { token0, token1, fee, liquidity } = pool;
                const poolAddress = v3_sdk_1.Pool.getAddress(pool.token0, pool.token1, pool.fee);
                if (poolAddressSet.has(poolAddress)) {
                    return undefined;
                }
                poolAddressSet.add(poolAddress);
                const liquidityNumber = jsbi_1.default.toNumber(liquidity);
                return {
                    id: poolAddress,
                    feeTier: (0, amounts_1.unparseFeeAmount)(fee),
                    liquidity: liquidity.toString(),
                    token0: {
                        id: token0.address
                    },
                    token1: {
                        id: token1.address
                    },
                    // As a very rough proxy we just use liquidity for TVL.
                    tvlETH: liquidityNumber,
                    tvlUSD: liquidityNumber
                };
            })
                .compact()
                .value();
            return subgraphPools;
        });
    }
}
exports.StaticV3SubgraphProvider = StaticV3SubgraphProvider;
