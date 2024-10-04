import { ChainId } from '@uniswap/sdk-core';
import { CUSD_CELO, CUSD_CELO_ALFAJORES, DAI_ARBITRUM, DAI_AVAX, DAI_BNB, DAI_GOERLI, DAI_MAINNET, DAI_OPTIMISM, DAI_OPTIMISM_GOERLI, DAI_POLYGON_MUMBAI, DAI_SEPOLIA, USDC_ARBITRUM, USDC_ARBITRUM_GOERLI, USDC_AVAX, USDC_BASE, USDC_BNB, USDC_ETHEREUM_GNOSIS, USDC_GOERLI, USDC_MAINNET, USDC_MOONBEAM, USDC_OPTIMISM, USDC_OPTIMISM_GOERLI, USDC_POLYGON, USDC_SEPOLIA, USDT_ARBITRUM, USDT_BNB, BCH_BNB, USDT_GOERLI, USDT_MAINNET, USDT_OPTIMISM, USDT_OPTIMISM_GOERLI, USDT_SBCH, WBTC_GOERLI, } from '../../../providers/token-provider';
// When adding new usd gas tokens, ensure the tokens are ordered
// from tokens with highest decimals to lowest decimals. For example,
// DAI_AVAX has 18 decimals and comes before USDC_AVAX which has 6 decimals.
export const usdGasTokensByChain = {
    [ChainId.MAINNET]: [DAI_MAINNET, USDC_MAINNET, USDT_MAINNET],
    [ChainId.ARBITRUM_ONE]: [DAI_ARBITRUM, USDC_ARBITRUM, USDT_ARBITRUM],
    [ChainId.OPTIMISM]: [DAI_OPTIMISM, USDC_OPTIMISM, USDT_OPTIMISM],
    [ChainId.OPTIMISM_GOERLI]: [
        DAI_OPTIMISM_GOERLI,
        USDC_OPTIMISM_GOERLI,
        USDT_OPTIMISM_GOERLI,
    ],
    [ChainId.ARBITRUM_GOERLI]: [USDC_ARBITRUM_GOERLI],
    [ChainId.GOERLI]: [DAI_GOERLI, USDC_GOERLI, USDT_GOERLI, WBTC_GOERLI],
    [ChainId.SEPOLIA]: [USDC_SEPOLIA, DAI_SEPOLIA],
    [ChainId.POLYGON]: [USDC_POLYGON],
    [ChainId.POLYGON_MUMBAI]: [DAI_POLYGON_MUMBAI],
    [ChainId.CELO]: [CUSD_CELO],
    [ChainId.CELO_ALFAJORES]: [CUSD_CELO_ALFAJORES],
    [ChainId.GNOSIS]: [USDC_ETHEREUM_GNOSIS],
    [ChainId.MOONBEAM]: [USDC_MOONBEAM],
    [ChainId.BNB]: [USDT_BNB, USDC_BNB, DAI_BNB, BCH_BNB],
    [ChainId.AVALANCHE]: [DAI_AVAX, USDC_AVAX],
    [ChainId.BASE]: [USDC_BASE],
    [ChainId.SMARTBCH]: [USDT_SBCH]
};
/**
 * Factory for building gas models that can be used with any route to generate
 * gas estimates.
 *
 * Factory model is used so that any supporting data can be fetched once and
 * returned as part of the model.
 *
 * @export
 * @abstract
 * @class IV2GasModelFactory
 */
export class IV2GasModelFactory {
}
/**
 * Factory for building gas models that can be used with any route to generate
 * gas estimates.
 *
 * Factory model is used so that any supporting data can be fetched once and
 * returned as part of the model.
 *
 * @export
 * @abstract
 * @class IOnChainGasModelFactory
 */
export class IOnChainGasModelFactory {
}
