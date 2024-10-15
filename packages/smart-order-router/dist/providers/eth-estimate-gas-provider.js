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
exports.EthEstimateGasSimulator = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const routers_1 = require("../routers");
const util_1 = require("../util");
const gas_factory_helpers_1 = require("../util/gas-factory-helpers");
const simulation_provider_1 = require("./simulation-provider");
// We multiply eth estimate gas by this to add a buffer for gas limits
const DEFAULT_ESTIMATE_MULTIPLIER = 1.2;
class EthEstimateGasSimulator extends simulation_provider_1.Simulator {
    constructor(chainId, provider, v2PoolProvider, v3PoolProvider, portionProvider, overrideEstimateMultiplier) {
        super(provider, portionProvider, chainId);
        this.v2PoolProvider = v2PoolProvider;
        this.v3PoolProvider = v3PoolProvider;
        this.overrideEstimateMultiplier = overrideEstimateMultiplier !== null && overrideEstimateMultiplier !== void 0 ? overrideEstimateMultiplier : {};
    }
    ethEstimateGas(fromAddress, swapOptions, route, l2GasData, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const currencyIn = route.trade.inputAmount.currency;
            let estimatedGasUsed;
            if (swapOptions.type == routers_1.SwapType.UNIVERSAL_ROUTER) {
                util_1.log.info({ methodParameters: route.methodParameters }, 'Simulating using eth_estimateGas on Universal Router');
                try {
                    estimatedGasUsed = yield this.provider.estimateGas({
                        data: route.methodParameters.calldata,
                        to: route.methodParameters.to,
                        from: fromAddress,
                        value: bignumber_1.BigNumber.from(currencyIn.isNative ? route.methodParameters.value : '0'),
                    });
                }
                catch (e) {
                    util_1.log.error({ e }, 'Error estimating gas');
                    return Object.assign(Object.assign({}, route), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
                }
            }
            else if (swapOptions.type == routers_1.SwapType.SWAP_ROUTER_02) {
                try {
                    estimatedGasUsed = yield this.provider.estimateGas({
                        data: route.methodParameters.calldata,
                        to: route.methodParameters.to,
                        from: fromAddress,
                        value: bignumber_1.BigNumber.from(currencyIn.isNative ? route.methodParameters.value : '0'),
                    });
                }
                catch (e) {
                    util_1.log.error({ e }, 'Error estimating gas');
                    return Object.assign(Object.assign({}, route), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
                }
            }
            else {
                throw new Error(`Unsupported swap type ${swapOptions}`);
            }
            estimatedGasUsed = this.adjustGasEstimate(estimatedGasUsed);
            util_1.log.info({
                methodParameters: route.methodParameters,
                estimatedGasUsed: estimatedGasUsed.toString(),
            }, 'Simulated using eth_estimateGas on SwapRouter02');
            const { estimatedGasUsedUSD, estimatedGasUsedQuoteToken, quoteGasAdjusted, } = yield (0, gas_factory_helpers_1.calculateGasUsed)(route.quote.currency.chainId, route, estimatedGasUsed, this.v2PoolProvider, this.v3PoolProvider, l2GasData, providerConfig);
            return Object.assign(Object.assign({}, (0, gas_factory_helpers_1.initSwapRouteFromExisting)(route, this.v2PoolProvider, this.v3PoolProvider, this.portionProvider, quoteGasAdjusted, estimatedGasUsed, estimatedGasUsedQuoteToken, estimatedGasUsedUSD, swapOptions)), { simulationStatus: simulation_provider_1.SimulationStatus.Succeeded });
        });
    }
    adjustGasEstimate(gasLimit) {
        var _a;
        const estimateMultiplier = (_a = this.overrideEstimateMultiplier[this.chainId]) !== null && _a !== void 0 ? _a : DEFAULT_ESTIMATE_MULTIPLIER;
        const adjustedGasEstimate = bignumber_1.BigNumber.from(gasLimit)
            .mul(estimateMultiplier * 100)
            .div(100);
        return adjustedGasEstimate;
    }
    simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputAmount = swapRoute.trade.inputAmount;
            if (inputAmount.currency.isNative ||
                (yield this.checkTokenApproved(fromAddress, inputAmount, swapOptions, this.provider))) {
                return yield this.ethEstimateGas(fromAddress, swapOptions, swapRoute, l2GasData);
            }
            else {
                util_1.log.info('Token not approved, skipping simulation');
                return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.NotApproved });
            }
        });
    }
}
exports.EthEstimateGasSimulator = EthEstimateGasSimulator;
