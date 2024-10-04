import { ChainId } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import _ from 'lodash';
import { WRAPPED_NATIVE_CURRENCY } from '../../util/chains';
import { log } from '../../util/log';
import { DAI_MAINNET, USDC_MAINNET, USDT_MAINNET, WBTC_MAINNET } from '../token-provider';
const BASES_TO_CHECK_TRADES_AGAINST = {
    [ChainId.MAINNET]: [
        WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET],
        DAI_MAINNET,
        USDC_MAINNET,
        USDT_MAINNET,
        WBTC_MAINNET
    ],
    [ChainId.GOERLI]: [WRAPPED_NATIVE_CURRENCY[ChainId.GOERLI]],
    [ChainId.SEPOLIA]: [WRAPPED_NATIVE_CURRENCY[ChainId.SEPOLIA]],
    //v2 not deployed on [optimism, arbitrum, polygon, celo, gnosis, moonbeam, bnb, avalanche] and their testnets
    [ChainId.OPTIMISM]: [],
    [ChainId.ARBITRUM_ONE]: [],
    [ChainId.ARBITRUM_GOERLI]: [],
    [ChainId.OPTIMISM_GOERLI]: [],
    [ChainId.POLYGON]: [],
    [ChainId.POLYGON_MUMBAI]: [],
    [ChainId.CELO]: [],
    [ChainId.CELO_ALFAJORES]: [],
    [ChainId.GNOSIS]: [],
    [ChainId.MOONBEAM]: [],
    [ChainId.BNB]: [],
    [ChainId.AVALANCHE]: [],
    [ChainId.BASE_GOERLI]: [],
    [ChainId.BASE]: [],
    [ChainId.SMARTBCH]: []
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
export class StaticV2SubgraphProvider {
    constructor(chainId) {
        this.chainId = chainId;
    }
    async getPools(tokenIn, tokenOut) {
        log.info('In static subgraph provider for V2');
        const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId];
        const basePairs = _.flatMap(bases, (base) => bases.map((otherBase) => [base, otherBase]));
        if (tokenIn && tokenOut) {
            basePairs.push([tokenIn, tokenOut], ...bases.map((base) => [tokenIn, base]), ...bases.map((base) => [tokenOut, base]));
        }
        const pairs = _(basePairs)
            .filter((tokens) => Boolean(tokens[0] && tokens[1]))
            .filter(([tokenA, tokenB]) => tokenA.address !== tokenB.address && !tokenA.equals(tokenB))
            .value();
        const poolAddressSet = new Set();
        const subgraphPools = _(pairs)
            .map(([tokenA, tokenB]) => {
            const poolAddress = Pair.getAddress(tokenA, tokenB);
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
    }
}
