import { GOB } from './../token-provider';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChainId } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import _ from 'lodash';
import { unparseFeeAmount } from '../../util/amounts';
import { WRAPPED_NATIVE_CURRENCY } from '../../util/chains';
import { log } from '../../util/log';
import { ARB_ARBITRUM, BC_BCH, BTC_BNB, BUSD_BNB, CELO, CELO_ALFAJORES, CEUR_CELO, CEUR_CELO_ALFAJORES, CUSD_CELO, CUSD_CELO_ALFAJORES, DAI_ARBITRUM, DAI_AVAX, DAI_BNB, DAI_CELO, DAI_CELO_ALFAJORES, DAI_GOERLI, DAI_MAINNET, DAI_MOONBEAM, DAI_OPTIMISM, DAI_OPTIMISM_GOERLI, DAI_POLYGON_MUMBAI, ETH_BNB, OP_OPTIMISM, USDC_ARBITRUM, USDC_ARBITRUM_GOERLI, USDC_AVAX, USDC_BASE, USDC_BNB, USDC_ETHEREUM_GNOSIS, USDC_GOERLI, USDC_MAINNET, USDC_MOONBEAM, USDC_OPTIMISM, USDC_OPTIMISM_GOERLI, USDC_POLYGON, USDC_SEPOLIA, USDT_ARBITRUM, USDT_BNB, USDT_GOERLI, USDT_MAINNET, USDT_OPTIMISM, USDT_OPTIMISM_GOERLI, WBTC_ARBITRUM, WBTC_GNOSIS, WBTC_GOERLI, WBTC_MAINNET, WBTC_MOONBEAM, WBTC_OPTIMISM, WBTC_OPTIMISM_GOERLI, WETH_POLYGON, WMATIC_POLYGON, WMATIC_POLYGON_MUMBAI, WXDAI_GNOSIS } from '../token-provider';
const BASES_TO_CHECK_TRADES_AGAINST = {
    [ChainId.MAINNET]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET],
        DAI_MAINNET,
        USDC_MAINNET,
        USDT_MAINNET,
        WBTC_MAINNET
    ],
    [ChainId.GOERLI]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.GOERLI],
        USDT_GOERLI,
        USDC_GOERLI,
        WBTC_GOERLI,
        DAI_GOERLI
    ],
    [ChainId.SEPOLIA]: [WRAPPED_NATIVE_CURRENCY[ChainId.SEPOLIA], USDC_SEPOLIA],
    [ChainId.OPTIMISM]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISM],
        USDC_OPTIMISM,
        DAI_OPTIMISM,
        USDT_OPTIMISM,
        WBTC_OPTIMISM,
        OP_OPTIMISM
    ],
    [ChainId.ARBITRUM_ONE]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_ONE],
        WBTC_ARBITRUM,
        DAI_ARBITRUM,
        USDC_ARBITRUM,
        USDT_ARBITRUM,
        ARB_ARBITRUM
    ],
    [ChainId.ARBITRUM_GOERLI]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_GOERLI],
        USDC_ARBITRUM_GOERLI
    ],
    [ChainId.OPTIMISM_GOERLI]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISM_GOERLI],
        USDC_OPTIMISM_GOERLI,
        DAI_OPTIMISM_GOERLI,
        USDT_OPTIMISM_GOERLI,
        WBTC_OPTIMISM_GOERLI
    ],
    [ChainId.POLYGON]: [USDC_POLYGON, WETH_POLYGON, WMATIC_POLYGON],
    [ChainId.POLYGON_MUMBAI]: [
        DAI_POLYGON_MUMBAI,
        WRAPPED_NATIVE_CURRENCY[ChainId.POLYGON_MUMBAI],
        WMATIC_POLYGON_MUMBAI
    ],
    [ChainId.CELO]: [CELO, CUSD_CELO, CEUR_CELO, DAI_CELO],
    [ChainId.CELO_ALFAJORES]: [
        CELO_ALFAJORES,
        CUSD_CELO_ALFAJORES,
        CEUR_CELO_ALFAJORES,
        DAI_CELO_ALFAJORES
    ],
    [ChainId.GNOSIS]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.GNOSIS],
        WBTC_GNOSIS,
        WXDAI_GNOSIS,
        USDC_ETHEREUM_GNOSIS
    ],
    [ChainId.BNB]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.BNB],
        BUSD_BNB,
        DAI_BNB,
        USDC_BNB,
        USDT_BNB,
        BTC_BNB,
        ETH_BNB,
        // BCH_BNB
    ],
    [ChainId.AVALANCHE]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.AVALANCHE],
        USDC_AVAX,
        DAI_AVAX
    ],
    [ChainId.MOONBEAM]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.MOONBEAM],
        DAI_MOONBEAM,
        USDC_MOONBEAM,
        WBTC_MOONBEAM
    ],
    [ChainId.BASE_GOERLI]: [WRAPPED_NATIVE_CURRENCY[ChainId.BASE_GOERLI]],
    [ChainId.BASE]: [WRAPPED_NATIVE_CURRENCY[ChainId.BASE], USDC_BASE],
    [ChainId.SMARTBCH]: [GOB, BC_BCH, WRAPPED_NATIVE_CURRENCY[ChainId.SMARTBCH]],
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
export class StaticV3SubgraphProvider {
    constructor(chainId, poolProvider) {
        this.chainId = chainId;
        this.poolProvider = poolProvider;
    }
    async getPools(tokenIn, tokenOut, providerConfig) {
        log.info('In static subgraph provider for V3');
        const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId];
        const basePairs = _.flatMap(bases, (base) => bases.map((otherBase) => [base, otherBase]));
        if (tokenIn && tokenOut) {
            basePairs.push([tokenIn, tokenOut], ...bases.map((base) => [tokenIn, base]), ...bases.map((base) => [tokenOut, base]));
        }
        const pairs = _(basePairs)
            .filter((tokens) => Boolean(tokens[0] && tokens[1]))
            .filter(([tokenA, tokenB]) => tokenA.address !== tokenB.address && !tokenA.equals(tokenB))
            .flatMap(([tokenA, tokenB]) => {
            return [
                [tokenA, tokenB, FeeAmount.LOWEST],
                [tokenA, tokenB, FeeAmount.LOW],
                [tokenA, tokenB, FeeAmount.MEDIUM],
                [tokenA, tokenB, FeeAmount.HIGH]
            ];
        })
            .value();
        log.info(`V3 Static subgraph provider about to get ${pairs.length} pools on-chain`);
        const poolAccessor = await this.poolProvider.getPools(pairs, providerConfig);
        const pools = poolAccessor.getAllPools();
        const poolAddressSet = new Set();
        const subgraphPools = _(pools)
            .map((pool) => {
            const { token0, token1, fee, liquidity } = pool;
            const poolAddress = Pool.getAddress(pool.token0, pool.token1, pool.fee);
            if (poolAddressSet.has(poolAddress)) {
                return undefined;
            }
            poolAddressSet.add(poolAddress);
            const liquidityNumber = JSBI.toNumber(liquidity);
            return {
                id: poolAddress,
                feeTier: unparseFeeAmount(fee),
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
    }
}
