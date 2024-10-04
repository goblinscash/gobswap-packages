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
exports.TenderlySimulator = exports.FallbackTenderlySimulator = void 0;
const constants_1 = require("@ethersproject/constants");
const sdk_core_1 = require("@uniswap/sdk-core");
const universal_router_sdk_1 = require("@uniswap/universal-router-sdk");
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers/lib/ethers");
const routers_1 = require("../routers");
const Erc20__factory_1 = require("../types/other/factories/Erc20__factory");
const Permit2__factory_1 = require("../types/other/factories/Permit2__factory");
const util_1 = require("../util");
const callData_1 = require("../util/callData");
const gas_factory_helpers_1 = require("../util/gas-factory-helpers");
const simulation_provider_1 = require("./simulation-provider");
var TenderlySimulationType;
(function (TenderlySimulationType) {
    TenderlySimulationType["QUICK"] = "quick";
    TenderlySimulationType["FULL"] = "full";
    TenderlySimulationType["ABI"] = "abi";
})(TenderlySimulationType || (TenderlySimulationType = {}));
const TENDERLY_BATCH_SIMULATE_API = (tenderlyBaseUrl, tenderlyUser, tenderlyProject) => `${tenderlyBaseUrl}/api/v1/account/${tenderlyUser}/project/${tenderlyProject}/simulate-batch`;
// We multiply tenderly gas limit by this to overestimate gas limit
const DEFAULT_ESTIMATE_MULTIPLIER = 1.3;
class FallbackTenderlySimulator extends simulation_provider_1.Simulator {
    constructor(chainId, provider, portionProvider, tenderlySimulator, ethEstimateGasSimulator) {
        super(provider, portionProvider, chainId);
        this.tenderlySimulator = tenderlySimulator;
        this.ethEstimateGasSimulator = ethEstimateGasSimulator;
    }
    simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            // Make call to eth estimate gas if possible
            // For erc20s, we must check if the token allowance is sufficient
            const inputAmount = swapRoute.trade.inputAmount;
            if (inputAmount.currency.isNative ||
                (yield this.checkTokenApproved(fromAddress, inputAmount, swapOptions, this.provider))) {
                util_1.log.info('Simulating with eth_estimateGas since token is native or approved.');
                try {
                    const swapRouteWithGasEstimate = yield this.ethEstimateGasSimulator.ethEstimateGas(fromAddress, swapOptions, swapRoute, l2GasData, providerConfig);
                    return swapRouteWithGasEstimate;
                }
                catch (err) {
                    util_1.log.info({ err: err }, 'Error simulating using eth_estimateGas');
                    return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
                }
            }
            try {
                return yield this.tenderlySimulator.simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, providerConfig);
            }
            catch (err) {
                util_1.log.info({ err: err }, 'Failed to simulate via Tenderly');
                return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
            }
        });
    }
}
exports.FallbackTenderlySimulator = FallbackTenderlySimulator;
class TenderlySimulator extends simulation_provider_1.Simulator {
    constructor(chainId, tenderlyBaseUrl, tenderlyUser, tenderlyProject, tenderlyAccessKey, v2PoolProvider, v3PoolProvider, provider, portionProvider, overrideEstimateMultiplier, tenderlyRequestTimeout) {
        super(provider, portionProvider, chainId);
        this.tenderlyBaseUrl = tenderlyBaseUrl;
        this.tenderlyUser = tenderlyUser;
        this.tenderlyProject = tenderlyProject;
        this.tenderlyAccessKey = tenderlyAccessKey;
        this.v2PoolProvider = v2PoolProvider;
        this.v3PoolProvider = v3PoolProvider;
        this.overrideEstimateMultiplier = overrideEstimateMultiplier !== null && overrideEstimateMultiplier !== void 0 ? overrideEstimateMultiplier : {};
        this.tenderlyRequestTimeout = tenderlyRequestTimeout;
    }
    simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, providerConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const currencyIn = swapRoute.trade.inputAmount.currency;
            const tokenIn = currencyIn.wrapped;
            const chainId = this.chainId;
            if ([sdk_core_1.ChainId.CELO, sdk_core_1.ChainId.CELO_ALFAJORES].includes(chainId)) {
                const msg = 'Celo not supported by Tenderly!';
                util_1.log.info(msg);
                return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.NotSupported });
            }
            if (!swapRoute.methodParameters) {
                const msg = 'No calldata provided to simulate transaction';
                util_1.log.info(msg);
                throw new Error(msg);
            }
            const { calldata } = swapRoute.methodParameters;
            util_1.log.info({
                calldata: swapRoute.methodParameters.calldata,
                fromAddress: fromAddress,
                chainId: chainId,
                tokenInAddress: tokenIn.address,
                router: swapOptions.type,
            }, 'Simulating transaction on Tenderly');
            const blockNumber = yield (providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber);
            let estimatedGasUsed;
            const estimateMultiplier = (_a = this.overrideEstimateMultiplier[chainId]) !== null && _a !== void 0 ? _a : DEFAULT_ESTIMATE_MULTIPLIER;
            if (swapOptions.type == routers_1.SwapType.UNIVERSAL_ROUTER) {
                // Do initial onboarding approval of Permit2.
                const erc20Interface = Erc20__factory_1.Erc20__factory.createInterface();
                const approvePermit2Calldata = erc20Interface.encodeFunctionData('approve', [universal_router_sdk_1.PERMIT2_ADDRESS, constants_1.MaxUint256]);
                // We are unsure if the users calldata contains a permit or not. We just
                // max approve the Univeral Router from Permit2 instead, which will cover both cases.
                const permit2Interface = Permit2__factory_1.Permit2__factory.createInterface();
                const approveUniversalRouterCallData = permit2Interface.encodeFunctionData('approve', [
                    tokenIn.address,
                    (0, universal_router_sdk_1.UNIVERSAL_ROUTER_ADDRESS)(this.chainId),
                    util_1.MAX_UINT160,
                    Math.floor(new Date().getTime() / 1000) + 10000000,
                ]);
                const approvePermit2 = {
                    network_id: chainId,
                    estimate_gas: true,
                    input: approvePermit2Calldata,
                    to: tokenIn.address,
                    value: '0',
                    from: fromAddress,
                    simulation_type: TenderlySimulationType.QUICK,
                    save_if_fails: providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.saveTenderlySimulationIfFailed,
                };
                const approveUniversalRouter = {
                    network_id: chainId,
                    estimate_gas: true,
                    input: approveUniversalRouterCallData,
                    to: universal_router_sdk_1.PERMIT2_ADDRESS,
                    value: '0',
                    from: fromAddress,
                    simulation_type: TenderlySimulationType.QUICK,
                    save_if_fails: providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.saveTenderlySimulationIfFailed,
                };
                const swap = {
                    network_id: chainId,
                    input: calldata,
                    estimate_gas: true,
                    to: (0, universal_router_sdk_1.UNIVERSAL_ROUTER_ADDRESS)(this.chainId),
                    value: currencyIn.isNative ? swapRoute.methodParameters.value : '0',
                    from: fromAddress,
                    // TODO: This is a Temporary fix given by Tenderly team, remove once resolved on their end.
                    block_number: chainId == sdk_core_1.ChainId.ARBITRUM_ONE && blockNumber
                        ? blockNumber - 5
                        : undefined,
                    simulation_type: TenderlySimulationType.QUICK,
                    save_if_fails: providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.saveTenderlySimulationIfFailed,
                };
                const body = {
                    simulations: [approvePermit2, approveUniversalRouter, swap],
                    estimate_gas: true,
                };
                const opts = {
                    headers: {
                        'X-Access-Key': this.tenderlyAccessKey,
                    },
                    timeout: this.tenderlyRequestTimeout,
                };
                const url = TENDERLY_BATCH_SIMULATE_API(this.tenderlyBaseUrl, this.tenderlyUser, this.tenderlyProject);
                const before = Date.now();
                const resp = (yield axios_1.default.post(url, body, opts)).data;
                const latencies = Date.now() - before;
                util_1.log.info(`Tenderly simulation universal router request body: ${body}, having latencies ${latencies} in milliseconds.`);
                routers_1.metric.putMetric('TenderlySimulationUniversalRouterLatencies', Date.now() - before, routers_1.MetricLoggerUnit.Milliseconds);
                // Validate tenderly response body
                if (!resp ||
                    resp.simulation_results.length < 3 ||
                    !resp.simulation_results[2].transaction ||
                    resp.simulation_results[2].transaction.error_message) {
                    this.logTenderlyErrorResponse(resp);
                    return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
                }
                // Parse the gas used in the simulation response object, and then pad it so that we overestimate.
                estimatedGasUsed = ethers_1.BigNumber.from((resp.simulation_results[2].transaction.gas * estimateMultiplier).toFixed(0));
                util_1.log.info({
                    body,
                    approvePermit2GasUsed: resp.simulation_results[0].transaction.gas_used,
                    approveUniversalRouterGasUsed: resp.simulation_results[1].transaction.gas_used,
                    swapGasUsed: resp.simulation_results[2].transaction.gas_used,
                    approvePermit2Gas: resp.simulation_results[0].transaction.gas,
                    approveUniversalRouterGas: resp.simulation_results[1].transaction.gas,
                    swapGas: resp.simulation_results[2].transaction.gas,
                    swapWithMultiplier: estimatedGasUsed.toString(),
                }, 'Successfully Simulated Approvals + Swap via Tenderly for Universal Router. Gas used.');
                util_1.log.info({
                    body,
                    swapSimulation: resp.simulation_results[2].simulation,
                    swapTransaction: resp.simulation_results[2].transaction,
                }, 'Successful Tenderly Swap Simulation for Universal Router');
            }
            else if (swapOptions.type == routers_1.SwapType.SWAP_ROUTER_02) {
                const approve = {
                    network_id: chainId,
                    input: callData_1.APPROVE_TOKEN_FOR_TRANSFER,
                    estimate_gas: true,
                    to: tokenIn.address,
                    value: '0',
                    from: fromAddress,
                    simulation_type: TenderlySimulationType.QUICK,
                };
                const swap = {
                    network_id: chainId,
                    input: calldata,
                    to: (0, util_1.SWAP_ROUTER_02_ADDRESSES)(chainId),
                    estimate_gas: true,
                    value: currencyIn.isNative ? swapRoute.methodParameters.value : '0',
                    from: fromAddress,
                    // TODO: This is a Temporary fix given by Tenderly team, remove once resolved on their end.
                    block_number: chainId == sdk_core_1.ChainId.ARBITRUM_ONE && blockNumber
                        ? blockNumber - 5
                        : undefined,
                    simulation_type: TenderlySimulationType.QUICK,
                };
                const body = { simulations: [approve, swap] };
                const opts = {
                    headers: {
                        'X-Access-Key': this.tenderlyAccessKey,
                    },
                    timeout: this.tenderlyRequestTimeout,
                };
                const url = TENDERLY_BATCH_SIMULATE_API(this.tenderlyBaseUrl, this.tenderlyUser, this.tenderlyProject);
                const before = Date.now();
                const resp = (yield axios_1.default.post(url, body, opts)).data;
                const latencies = Date.now() - before;
                util_1.log.info(`Tenderly simulation swap router02 request body: ${body}, having latencies ${latencies} in milliseconds.`);
                routers_1.metric.putMetric('TenderlySimulationSwapRouter02Latencies', latencies, routers_1.MetricLoggerUnit.Milliseconds);
                // Validate tenderly response body
                if (!resp ||
                    resp.simulation_results.length < 2 ||
                    !resp.simulation_results[1].transaction ||
                    resp.simulation_results[1].transaction.error_message) {
                    const msg = `Failed to Simulate Via Tenderly!: ${resp.simulation_results[1].transaction.error_message}`;
                    util_1.log.info({ err: resp.simulation_results[1].transaction.error_message }, msg);
                    return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
                }
                // Parse the gas used in the simulation response object, and then pad it so that we overestimate.
                estimatedGasUsed = ethers_1.BigNumber.from((resp.simulation_results[1].transaction.gas * estimateMultiplier).toFixed(0));
                util_1.log.info({
                    body,
                    approveGasUsed: resp.simulation_results[0].transaction.gas_used,
                    swapGasUsed: resp.simulation_results[1].transaction.gas_used,
                    approveGas: resp.simulation_results[0].transaction.gas,
                    swapGas: resp.simulation_results[1].transaction.gas,
                    swapWithMultiplier: estimatedGasUsed.toString(),
                }, 'Successfully Simulated Approval + Swap via Tenderly for SwapRouter02. Gas used.');
                util_1.log.info({
                    body,
                    swapTransaction: resp.simulation_results[1].transaction,
                    swapSimulation: resp.simulation_results[1].simulation,
                }, 'Successful Tenderly Swap Simulation for SwapRouter02');
            }
            else {
                throw new Error(`Unsupported swap type: ${swapOptions}`);
            }
            const { estimatedGasUsedUSD, estimatedGasUsedQuoteToken, quoteGasAdjusted, } = yield (0, gas_factory_helpers_1.calculateGasUsed)(chainId, swapRoute, estimatedGasUsed, this.v2PoolProvider, this.v3PoolProvider, l2GasData, providerConfig);
            return Object.assign(Object.assign({}, (0, gas_factory_helpers_1.initSwapRouteFromExisting)(swapRoute, this.v2PoolProvider, this.v3PoolProvider, this.portionProvider, quoteGasAdjusted, estimatedGasUsed, estimatedGasUsedQuoteToken, estimatedGasUsedUSD, swapOptions)), { simulationStatus: simulation_provider_1.SimulationStatus.Succeeded });
        });
    }
    logTenderlyErrorResponse(resp) {
        util_1.log.info({
            resp,
        }, 'Failed to Simulate on Tenderly');
        util_1.log.info({
            err: resp.simulation_results.length >= 1
                ? resp.simulation_results[0].transaction
                : {},
        }, 'Failed to Simulate on Tenderly #1 Transaction');
        util_1.log.info({
            err: resp.simulation_results.length >= 1
                ? resp.simulation_results[0].simulation
                : {},
        }, 'Failed to Simulate on Tenderly #1 Simulation');
        util_1.log.info({
            err: resp.simulation_results.length >= 2
                ? resp.simulation_results[1].transaction
                : {},
        }, 'Failed to Simulate on Tenderly #2 Transaction');
        util_1.log.info({
            err: resp.simulation_results.length >= 2
                ? resp.simulation_results[1].simulation
                : {},
        }, 'Failed to Simulate on Tenderly #2 Simulation');
        util_1.log.info({
            err: resp.simulation_results.length >= 3
                ? resp.simulation_results[2].transaction
                : {},
        }, 'Failed to Simulate on Tenderly #3 Transaction');
        util_1.log.info({
            err: resp.simulation_results.length >= 3
                ? resp.simulation_results[2].simulation
                : {},
        }, 'Failed to Simulate on Tenderly #3 Simulation');
    }
}
exports.TenderlySimulator = TenderlySimulator;
