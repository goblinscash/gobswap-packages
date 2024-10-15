"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NATIVE_OVERHEAD = exports.NATIVE_UNWRAP_OVERHEAD = exports.NATIVE_WRAP_OVERHEAD = exports.TOKEN_OVERHEAD = exports.SINGLE_HOP_OVERHEAD = exports.COST_PER_HOP = exports.COST_PER_INIT_TICK = exports.BASE_SWAP_COST = exports.COST_PER_UNINIT_TICK = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const sdk_core_1 = require("@uniswap/sdk-core");
const providers_1 = require("../../../../providers");
// Cost for crossing an uninitialized tick.
exports.COST_PER_UNINIT_TICK = bignumber_1.BigNumber.from(0);
//l2 execution fee on optimism is roughly the same as mainnet
const BASE_SWAP_COST = (id) => {
    switch (id) {
        case sdk_core_1.ChainId.MAINNET:
        case sdk_core_1.ChainId.GOERLI:
        case sdk_core_1.ChainId.SEPOLIA:
        case sdk_core_1.ChainId.OPTIMISM:
        case sdk_core_1.ChainId.OPTIMISM_GOERLI:
        case sdk_core_1.ChainId.BNB:
        case sdk_core_1.ChainId.AVALANCHE:
        case sdk_core_1.ChainId.BASE:
        case sdk_core_1.ChainId.BASE_GOERLI:
        case sdk_core_1.ChainId.SMARTBCH:
            return bignumber_1.BigNumber.from(2000);
        case sdk_core_1.ChainId.ARBITRUM_ONE:
        case sdk_core_1.ChainId.ARBITRUM_GOERLI:
            return bignumber_1.BigNumber.from(5000);
        case sdk_core_1.ChainId.POLYGON:
        case sdk_core_1.ChainId.POLYGON_MUMBAI:
            return bignumber_1.BigNumber.from(2000);
        case sdk_core_1.ChainId.CELO:
        case sdk_core_1.ChainId.CELO_ALFAJORES:
            return bignumber_1.BigNumber.from(2000);
        //TODO determine if sufficient
        case sdk_core_1.ChainId.GNOSIS:
            return bignumber_1.BigNumber.from(2000);
        case sdk_core_1.ChainId.MOONBEAM:
            return bignumber_1.BigNumber.from(2000);
    }
};
exports.BASE_SWAP_COST = BASE_SWAP_COST;
const COST_PER_INIT_TICK = (id) => {
    switch (id) {
        case sdk_core_1.ChainId.MAINNET:
        case sdk_core_1.ChainId.GOERLI:
        case sdk_core_1.ChainId.SEPOLIA:
        case sdk_core_1.ChainId.BNB:
        case sdk_core_1.ChainId.AVALANCHE:
        case sdk_core_1.ChainId.SMARTBCH:
            return bignumber_1.BigNumber.from(31000);
        case sdk_core_1.ChainId.OPTIMISM:
        case sdk_core_1.ChainId.OPTIMISM_GOERLI:
        case sdk_core_1.ChainId.BASE:
        case sdk_core_1.ChainId.BASE_GOERLI:
            return bignumber_1.BigNumber.from(31000);
        case sdk_core_1.ChainId.ARBITRUM_ONE:
        case sdk_core_1.ChainId.ARBITRUM_GOERLI:
            return bignumber_1.BigNumber.from(31000);
        case sdk_core_1.ChainId.POLYGON:
        case sdk_core_1.ChainId.POLYGON_MUMBAI:
            return bignumber_1.BigNumber.from(31000);
        case sdk_core_1.ChainId.CELO:
        case sdk_core_1.ChainId.CELO_ALFAJORES:
            return bignumber_1.BigNumber.from(31000);
        case sdk_core_1.ChainId.GNOSIS:
            return bignumber_1.BigNumber.from(31000);
        case sdk_core_1.ChainId.MOONBEAM:
            return bignumber_1.BigNumber.from(31000);
    }
};
exports.COST_PER_INIT_TICK = COST_PER_INIT_TICK;
const COST_PER_HOP = (id) => {
    switch (id) {
        case sdk_core_1.ChainId.MAINNET:
        case sdk_core_1.ChainId.GOERLI:
        case sdk_core_1.ChainId.SEPOLIA:
        case sdk_core_1.ChainId.BNB:
        case sdk_core_1.ChainId.OPTIMISM:
        case sdk_core_1.ChainId.OPTIMISM_GOERLI:
        case sdk_core_1.ChainId.AVALANCHE:
        case sdk_core_1.ChainId.BASE:
        case sdk_core_1.ChainId.BASE_GOERLI:
        case sdk_core_1.ChainId.SMARTBCH:
            return bignumber_1.BigNumber.from(80000);
        case sdk_core_1.ChainId.ARBITRUM_ONE:
        case sdk_core_1.ChainId.ARBITRUM_GOERLI:
            return bignumber_1.BigNumber.from(80000);
        case sdk_core_1.ChainId.POLYGON:
        case sdk_core_1.ChainId.POLYGON_MUMBAI:
            return bignumber_1.BigNumber.from(80000);
        case sdk_core_1.ChainId.CELO:
        case sdk_core_1.ChainId.CELO_ALFAJORES:
            return bignumber_1.BigNumber.from(80000);
        case sdk_core_1.ChainId.GNOSIS:
            return bignumber_1.BigNumber.from(80000);
        case sdk_core_1.ChainId.MOONBEAM:
            return bignumber_1.BigNumber.from(80000);
    }
};
exports.COST_PER_HOP = COST_PER_HOP;
const SINGLE_HOP_OVERHEAD = (_id) => {
    return bignumber_1.BigNumber.from(15000);
};
exports.SINGLE_HOP_OVERHEAD = SINGLE_HOP_OVERHEAD;
const TOKEN_OVERHEAD = (id, route) => {
    const tokens = route.tokenPath;
    let overhead = bignumber_1.BigNumber.from(0);
    if (id == sdk_core_1.ChainId.MAINNET) {
        // AAVE's transfer contains expensive governance snapshotting logic. We estimate
        // it at around 150k.
        if (tokens.some((t) => t.equals(providers_1.AAVE_MAINNET))) {
            overhead = overhead.add(150000);
        }
        // LDO's reaches out to an external token controller which adds a large overhead
        // of around 150k.
        if (tokens.some((t) => t.equals(providers_1.LIDO_MAINNET))) {
            overhead = overhead.add(150000);
        }
    }
    return overhead;
};
exports.TOKEN_OVERHEAD = TOKEN_OVERHEAD;
// TODO: change per chain
const NATIVE_WRAP_OVERHEAD = (id) => {
    switch (id) {
        default:
            return bignumber_1.BigNumber.from(27938);
    }
};
exports.NATIVE_WRAP_OVERHEAD = NATIVE_WRAP_OVERHEAD;
const NATIVE_UNWRAP_OVERHEAD = (id) => {
    switch (id) {
        default:
            return bignumber_1.BigNumber.from(36000);
    }
};
exports.NATIVE_UNWRAP_OVERHEAD = NATIVE_UNWRAP_OVERHEAD;
const NATIVE_OVERHEAD = (chainId, amount, quote) => {
    if (amount.isNative) {
        // need to wrap eth in
        return (0, exports.NATIVE_WRAP_OVERHEAD)(chainId);
    }
    if (quote.isNative) {
        // need to unwrap eth out
        return (0, exports.NATIVE_UNWRAP_OVERHEAD)(chainId);
    }
    return bignumber_1.BigNumber.from(0);
};
exports.NATIVE_OVERHEAD = NATIVE_OVERHEAD;
