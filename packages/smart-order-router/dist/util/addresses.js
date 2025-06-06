"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WETH9 = exports.constructSameAddressMap = exports.MULTICALL2_ADDRESS = exports.V3_MIGRATOR_ADDRESS = exports.NONFUNGIBLE_POSITION_MANAGER_ADDRESS = exports.TICK_LENS_ADDRESS = exports.ARB_GASINFO_ADDRESS = exports.OVM_GASPRICE_ADDRESS = exports.SWAP_ROUTER_02_ADDRESSES = exports.UNISWAP_MULTICALL_ADDRESSES = exports.MIXED_ROUTE_QUOTER_V1_ADDRESSES = exports.QUOTER_V2_ADDRESSES = exports.V3_CORE_FACTORY_ADDRESSES = exports.BCH_SWAP_ROUTER_02_ADDRESS = exports.BNB_V3_MIGRATOR_ADDRESS = exports.BNB_SWAP_ROUTER_02_ADDRESS = exports.BNB_NONFUNGIBLE_POSITION_MANAGER_ADDRESS = exports.BNB_TICK_LENS_ADDRESS = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const chains_1 = require("./chains");
exports.BNB_TICK_LENS_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].tickLensAddress;
exports.BNB_NONFUNGIBLE_POSITION_MANAGER_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].nonfungiblePositionManagerAddress;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
exports.BNB_SWAP_ROUTER_02_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].swapRouter02Address;
exports.BNB_V3_MIGRATOR_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].v3MigratorAddress;
exports.BCH_SWAP_ROUTER_02_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SMARTBCH].swapRouter02Address;
exports.V3_CORE_FACTORY_ADDRESSES = Object.assign(Object.assign({}, constructSameAddressMap(v3_sdk_1.FACTORY_ADDRESS)), { [sdk_core_1.ChainId.CELO]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.CELO].v3CoreFactoryAddress, [sdk_core_1.ChainId.CELO_ALFAJORES]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.CELO_ALFAJORES].v3CoreFactoryAddress, [sdk_core_1.ChainId.OPTIMISM_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.OPTIMISM_GOERLI].v3CoreFactoryAddress, [sdk_core_1.ChainId.SEPOLIA]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SEPOLIA].v3CoreFactoryAddress, [sdk_core_1.ChainId.ARBITRUM_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.ARBITRUM_GOERLI].v3CoreFactoryAddress, [sdk_core_1.ChainId.BNB]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].v3CoreFactoryAddress, [sdk_core_1.ChainId.AVALANCHE]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.AVALANCHE].v3CoreFactoryAddress, [sdk_core_1.ChainId.BASE_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BASE_GOERLI].v3CoreFactoryAddress, [sdk_core_1.ChainId.BASE]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BASE].v3CoreFactoryAddress, [sdk_core_1.ChainId.SMARTBCH]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SMARTBCH].v3CoreFactoryAddress });
exports.QUOTER_V2_ADDRESSES = Object.assign(Object.assign({}, constructSameAddressMap('0x61fFE014bA17989E743c5F6cB21bF9697530B21e')), { [sdk_core_1.ChainId.CELO]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.CELO].quoterAddress, [sdk_core_1.ChainId.CELO_ALFAJORES]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.CELO_ALFAJORES].quoterAddress, [sdk_core_1.ChainId.OPTIMISM_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.OPTIMISM_GOERLI].quoterAddress, [sdk_core_1.ChainId.SEPOLIA]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SEPOLIA].quoterAddress, [sdk_core_1.ChainId.ARBITRUM_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.ARBITRUM_GOERLI].quoterAddress, [sdk_core_1.ChainId.BNB]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].quoterAddress, [sdk_core_1.ChainId.AVALANCHE]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.AVALANCHE].quoterAddress, [sdk_core_1.ChainId.BASE_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BASE_GOERLI].quoterAddress, [sdk_core_1.ChainId.BASE]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BASE].quoterAddress, [sdk_core_1.ChainId.SMARTBCH]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SMARTBCH].quoterAddress });
exports.MIXED_ROUTE_QUOTER_V1_ADDRESSES = {
    [sdk_core_1.ChainId.MAINNET]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.MAINNET].v1MixedRouteQuoterAddress,
    [sdk_core_1.ChainId.GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.GOERLI].v1MixedRouteQuoterAddress,
};
exports.UNISWAP_MULTICALL_ADDRESSES = Object.assign(Object.assign({}, constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984')), { [sdk_core_1.ChainId.CELO]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.CELO].multicallAddress, [sdk_core_1.ChainId.CELO_ALFAJORES]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.CELO_ALFAJORES].multicallAddress, [sdk_core_1.ChainId.OPTIMISM_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.OPTIMISM_GOERLI].multicallAddress, [sdk_core_1.ChainId.SEPOLIA]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SEPOLIA].multicallAddress, [sdk_core_1.ChainId.ARBITRUM_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.ARBITRUM_GOERLI].multicallAddress, [sdk_core_1.ChainId.BNB]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BNB].multicallAddress, [sdk_core_1.ChainId.AVALANCHE]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.AVALANCHE].multicallAddress, [sdk_core_1.ChainId.BASE_GOERLI]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BASE_GOERLI].multicallAddress, [sdk_core_1.ChainId.BASE]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.BASE].multicallAddress, [sdk_core_1.ChainId.SMARTBCH]: sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.SMARTBCH].multicallAddress });
const SWAP_ROUTER_02_ADDRESSES = (chainId) => {
    if (chainId == sdk_core_1.ChainId.BNB) {
        return exports.BNB_SWAP_ROUTER_02_ADDRESS;
    }
    else if (chainId == sdk_core_1.ChainId.SMARTBCH) {
        return exports.BCH_SWAP_ROUTER_02_ADDRESS;
    }
    return '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
};
exports.SWAP_ROUTER_02_ADDRESSES = SWAP_ROUTER_02_ADDRESSES;
exports.OVM_GASPRICE_ADDRESS = '0x420000000000000000000000000000000000000F';
exports.ARB_GASINFO_ADDRESS = '0x000000000000000000000000000000000000006C';
exports.TICK_LENS_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.ARBITRUM_ONE].tickLensAddress;
exports.NONFUNGIBLE_POSITION_MANAGER_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.MAINNET].nonfungiblePositionManagerAddress;
exports.V3_MIGRATOR_ADDRESS = sdk_core_1.CHAIN_TO_ADDRESSES_MAP[sdk_core_1.ChainId.MAINNET].v3MigratorAddress;
exports.MULTICALL2_ADDRESS = '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696';
function constructSameAddressMap(address, additionalNetworks = []) {
    return chains_1.NETWORKS_WITH_SAME_UNISWAP_ADDRESSES.concat(additionalNetworks).reduce((memo, chainId) => {
        memo[chainId] = address;
        return memo;
    }, {});
}
exports.constructSameAddressMap = constructSameAddressMap;
// TODO: should we remove smartbch from this list
exports.WETH9 = {
    [sdk_core_1.ChainId.MAINNET]: new sdk_core_1.Token(sdk_core_1.ChainId.MAINNET, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.GOERLI]: new sdk_core_1.Token(sdk_core_1.ChainId.GOERLI, '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.SEPOLIA]: new sdk_core_1.Token(sdk_core_1.ChainId.SEPOLIA, '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.OPTIMISM]: new sdk_core_1.Token(sdk_core_1.ChainId.OPTIMISM, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.OPTIMISM_GOERLI]: new sdk_core_1.Token(sdk_core_1.ChainId.OPTIMISM_GOERLI, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.ARBITRUM_ONE]: new sdk_core_1.Token(sdk_core_1.ChainId.ARBITRUM_ONE, '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.ARBITRUM_GOERLI]: new sdk_core_1.Token(sdk_core_1.ChainId.ARBITRUM_GOERLI, '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.BASE_GOERLI]: new sdk_core_1.Token(sdk_core_1.ChainId.BASE_GOERLI, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    [sdk_core_1.ChainId.BASE]: new sdk_core_1.Token(sdk_core_1.ChainId.BASE, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    // TODO: change address for mainnet
    [sdk_core_1.ChainId.SMARTBCH]: new sdk_core_1.Token(sdk_core_1.ChainId.SMARTBCH, '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04', 18, 'WBCH', 'Wrapped BCH')
};
