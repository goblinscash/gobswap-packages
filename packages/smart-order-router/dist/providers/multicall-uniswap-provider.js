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
exports.UniswapMulticallProvider = void 0;
const lodash_1 = __importDefault(require("lodash"));
const stats_lite_1 = __importDefault(require("stats-lite"));
const UniswapInterfaceMulticall__factory_1 = require("../types/v3/factories/UniswapInterfaceMulticall__factory");
const addresses_1 = require("../util/addresses");
const log_1 = require("../util/log");
const multicall_provider_1 = require("./multicall-provider");
/**
 * The UniswapMulticall contract has added functionality for limiting the amount of gas
 * that each call within the multicall can consume. This is useful for operations where
 * a call could consume such a large amount of gas that it causes the node to error out
 * with an out of gas error.
 *
 * @export
 * @class UniswapMulticallProvider
 */
class UniswapMulticallProvider extends multicall_provider_1.IMulticallProvider {
    constructor(chainId, provider, gasLimitPerCall = 1000000) {
        super();
        this.chainId = chainId;
        this.provider = provider;
        this.gasLimitPerCall = gasLimitPerCall;
        const multicallAddress = addresses_1.UNISWAP_MULTICALL_ADDRESSES[this.chainId];
        if (!multicallAddress) {
            throw new Error(`No address for Uniswap Multicall Contract on chain id: ${chainId}`);
        }
        this.multicallContract = UniswapInterfaceMulticall__factory_1.UniswapInterfaceMulticall__factory.connect(multicallAddress, this.provider);
    }
    callSameFunctionOnMultipleContracts(params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { addresses, contractInterface, functionName, functionParams, providerConfig, } = params;
            const blockNumberOverride = (_a = providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber) !== null && _a !== void 0 ? _a : undefined;
            const fragment = contractInterface.getFunction(functionName);
            const callData = contractInterface.encodeFunctionData(fragment, functionParams);
            const calls = lodash_1.default.map(addresses, (address) => {
                return {
                    target: address,
                    callData,
                    gasLimit: this.gasLimitPerCall,
                };
            });
            log_1.log.debug({ calls }, `About to multicall for ${functionName} across ${addresses.length} addresses`);
            const { blockNumber, returnData: aggregateResults } = yield this.multicallContract.callStatic.multicall(calls, {
                blockTag: blockNumberOverride,
            });
            const results = [];
            for (let i = 0; i < aggregateResults.length; i++) {
                const { success, returnData } = aggregateResults[i];
                // Return data "0x" is sometimes returned for invalid calls.
                if (!success || returnData.length <= 2) {
                    log_1.log.debug({ result: aggregateResults[i] }, `Invalid result calling ${functionName} on address ${addresses[i]}`);
                    results.push({
                        success: false,
                        returnData,
                    });
                    continue;
                }
                results.push({
                    success: true,
                    result: contractInterface.decodeFunctionResult(fragment, returnData),
                });
            }
            log_1.log.debug({ results }, `Results for multicall on ${functionName} across ${addresses.length} addresses as of block ${blockNumber}`);
            return { blockNumber, results };
        });
    }
    callSameFunctionOnContractWithMultipleParams(params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { address, contractInterface, functionName, functionParams, additionalConfig, providerConfig, } = params;
            const fragment = contractInterface.getFunction(functionName);
            const gasLimitPerCall = (_a = additionalConfig === null || additionalConfig === void 0 ? void 0 : additionalConfig.gasLimitPerCallOverride) !== null && _a !== void 0 ? _a : this.gasLimitPerCall;
            const blockNumberOverride = (_b = providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber) !== null && _b !== void 0 ? _b : undefined;
            const calls = lodash_1.default.map(functionParams, (functionParam) => {
                const callData = contractInterface.encodeFunctionData(fragment, functionParam);
                return {
                    target: address,
                    callData,
                    gasLimit: gasLimitPerCall,
                };
            });
            log_1.log.debug({ calls }, `About to multicall for ${functionName} at address ${address} with ${functionParams.length} different sets of params`);
            const { blockNumber, returnData: aggregateResults } = yield this.multicallContract.callStatic.multicall(calls, {
                blockTag: blockNumberOverride,
            });
            const results = [];
            const gasUsedForSuccess = [];
            for (let i = 0; i < aggregateResults.length; i++) {
                const { success, returnData, gasUsed } = aggregateResults[i];
                // Return data "0x" is sometimes returned for invalid pools.
                if (!success || returnData.length <= 2) {
                    log_1.log.debug({ result: aggregateResults[i] }, `Invalid result calling ${functionName} with params ${functionParams[i]}`);
                    results.push({
                        success: false,
                        returnData,
                    });
                    continue;
                }
                gasUsedForSuccess.push(gasUsed.toNumber());
                results.push({
                    success: true,
                    result: contractInterface.decodeFunctionResult(fragment, returnData),
                });
            }
            log_1.log.debug({ results, functionName, address }, `Results for multicall for ${functionName} at address ${address} with ${functionParams.length} different sets of params. Results as of block ${blockNumber}`);
            return {
                blockNumber,
                results,
                approxGasUsedPerSuccessCall: stats_lite_1.default.percentile(gasUsedForSuccess, 99),
            };
        });
    }
    callMultipleFunctionsOnSameContract(params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { address, contractInterface, functionNames, functionParams, additionalConfig, providerConfig, } = params;
            const gasLimitPerCall = (_a = additionalConfig === null || additionalConfig === void 0 ? void 0 : additionalConfig.gasLimitPerCallOverride) !== null && _a !== void 0 ? _a : this.gasLimitPerCall;
            const blockNumberOverride = (_b = providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber) !== null && _b !== void 0 ? _b : undefined;
            const calls = lodash_1.default.map(functionNames, (functionName, i) => {
                const fragment = contractInterface.getFunction(functionName);
                const param = functionParams ? functionParams[i] : [];
                const callData = contractInterface.encodeFunctionData(fragment, param);
                return {
                    target: address,
                    callData,
                    gasLimit: gasLimitPerCall,
                };
            });
            log_1.log.debug({ calls }, `About to multicall for ${functionNames.length} functions at address ${address} with ${functionParams === null || functionParams === void 0 ? void 0 : functionParams.length} different sets of params`);
            const { blockNumber, returnData: aggregateResults } = yield this.multicallContract.callStatic.multicall(calls, {
                blockTag: blockNumberOverride,
            });
            const results = [];
            const gasUsedForSuccess = [];
            for (let i = 0; i < aggregateResults.length; i++) {
                const fragment = contractInterface.getFunction(functionNames[i]);
                const { success, returnData, gasUsed } = aggregateResults[i];
                // Return data "0x" is sometimes returned for invalid pools.
                if (!success || returnData.length <= 2) {
                    log_1.log.debug({ result: aggregateResults[i] }, `Invalid result calling ${functionNames[i]} with ${functionParams ? functionParams[i] : '0'} params`);
                    results.push({
                        success: false,
                        returnData,
                    });
                    continue;
                }
                gasUsedForSuccess.push(gasUsed.toNumber());
                results.push({
                    success: true,
                    result: contractInterface.decodeFunctionResult(fragment, returnData),
                });
            }
            log_1.log.debug({ results, functionNames, address }, `Results for multicall for ${functionNames.length} functions at address ${address} with ${functionParams ? functionParams.length : ' 0'} different sets of params. Results as of block ${blockNumber}`);
            return {
                blockNumber,
                results,
                approxGasUsedPerSuccessCall: stats_lite_1.default.percentile(gasUsedForSuccess, 99),
            };
        });
    }
}
exports.UniswapMulticallProvider = UniswapMulticallProvider;
