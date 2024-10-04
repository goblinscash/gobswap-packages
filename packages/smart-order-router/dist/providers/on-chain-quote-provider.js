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
exports.OnChainQuoteProvider = exports.ProviderGasError = exports.ProviderTimeoutError = exports.ProviderBlockHeaderError = exports.SuccessRateError = exports.BlockConflictError = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const async_retry_1 = __importDefault(require("async-retry"));
const lodash_1 = __importDefault(require("lodash"));
const stats_lite_1 = __importDefault(require("stats-lite"));
const router_1 = require("../routers/router");
const IMixedRouteQuoterV1__factory_1 = require("../types/other/factories/IMixedRouteQuoterV1__factory");
const IQuoterV2__factory_1 = require("../types/v3/factories/IQuoterV2__factory");
const util_1 = require("../util");
const addresses_1 = require("../util/addresses");
const log_1 = require("../util/log");
const routes_1 = require("../util/routes");
class BlockConflictError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'BlockConflictError';
    }
}
exports.BlockConflictError = BlockConflictError;
class SuccessRateError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'SuccessRateError';
    }
}
exports.SuccessRateError = SuccessRateError;
class ProviderBlockHeaderError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'ProviderBlockHeaderError';
    }
}
exports.ProviderBlockHeaderError = ProviderBlockHeaderError;
class ProviderTimeoutError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'ProviderTimeoutError';
    }
}
exports.ProviderTimeoutError = ProviderTimeoutError;
/**
 * This error typically means that the gas used by the multicall has
 * exceeded the total call gas limit set by the node provider.
 *
 * This can be resolved by modifying BatchParams to request fewer
 * quotes per call, or to set a lower gas limit per quote.
 *
 * @export
 * @class ProviderGasError
 */
class ProviderGasError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'ProviderGasError';
    }
}
exports.ProviderGasError = ProviderGasError;
const DEFAULT_BATCH_RETRIES = 2;
/**
 * Computes on chain quotes for swaps. For pure V3 routes, quotes are computed on-chain using
 * the 'QuoterV2' smart contract. For exactIn mixed and V2 routes, quotes are computed using the 'MixedRouteQuoterV1' contract
 * This is because computing quotes off-chain would require fetching all the tick data for each pool, which is a lot of data.
 *
 * To minimize the number of requests for quotes we use a Multicall contract. Generally
 * the number of quotes to fetch exceeds the maximum we can fit in a single multicall
 * while staying under gas limits, so we also batch these quotes across multiple multicalls.
 *
 * The biggest challenge with the quote provider is dealing with various gas limits.
 * Each provider sets a limit on the amount of gas a call can consume (on Infura this
 * is approximately 10x the block max size), so we must ensure each multicall does not
 * exceed this limit. Additionally, each quote on V3 can consume a large number of gas if
 * the pool lacks liquidity and the swap would cause all the ticks to be traversed.
 *
 * To ensure we don't exceed the node's call limit, we limit the gas used by each quote to
 * a specific value, and we limit the number of quotes in each multicall request. Users of this
 * class should set BatchParams such that multicallChunk * gasLimitPerCall is less than their node
 * providers total gas limit per call.
 *
 * @export
 * @class OnChainQuoteProvider
 */
class OnChainQuoteProvider {
    /**
     * Creates an instance of OnChainQuoteProvider.
     *
     * @param chainId The chain to get quotes for.
     * @param provider The web 3 provider.
     * @param multicall2Provider The multicall provider to use to get the quotes on-chain.
     * Only supports the Uniswap Multicall contract as it needs the gas limitting functionality.
     * @param retryOptions The retry options for each call to the multicall.
     * @param batchParams The parameters for each batched call to the multicall.
     * @param gasErrorFailureOverride The gas and chunk parameters to use when retrying a batch that failed due to out of gas.
     * @param successRateFailureOverrides The parameters for retries when we fail to get quotes.
     * @param blockNumberConfig Parameters for adjusting which block we get quotes from, and how to handle block header not found errors.
     * @param [quoterAddressOverride] Overrides the address of the quoter contract to use.
     */
    constructor(chainId, provider, 
    // Only supports Uniswap Multicall as it needs the gas limitting functionality.
    multicall2Provider, retryOptions = {
        retries: DEFAULT_BATCH_RETRIES,
        minTimeout: 25,
        maxTimeout: 250,
    }, batchParams = {
        multicallChunk: 150,
        gasLimitPerCall: 1000000,
        quoteMinSuccessRate: 0.2,
    }, gasErrorFailureOverride = {
        gasLimitOverride: 1500000,
        multicallChunk: 100,
    }, successRateFailureOverrides = {
        gasLimitOverride: 1300000,
        multicallChunk: 110,
    }, blockNumberConfig = {
        baseBlockOffset: 0,
        rollback: { enabled: false },
    }, quoterAddressOverride) {
        this.chainId = chainId;
        this.provider = provider;
        this.multicall2Provider = multicall2Provider;
        this.retryOptions = retryOptions;
        this.batchParams = batchParams;
        this.gasErrorFailureOverride = gasErrorFailureOverride;
        this.successRateFailureOverrides = successRateFailureOverrides;
        this.blockNumberConfig = blockNumberConfig;
        this.quoterAddressOverride = quoterAddressOverride;
    }
    getQuoterAddress(useMixedRouteQuoter) {
        if (this.quoterAddressOverride) {
            return this.quoterAddressOverride;
        }
        const quoterAddress = useMixedRouteQuoter
            ? addresses_1.MIXED_ROUTE_QUOTER_V1_ADDRESSES[this.chainId]
            : addresses_1.QUOTER_V2_ADDRESSES[this.chainId];
        if (!quoterAddress) {
            throw new Error(`No address for the quoter contract on chain id: ${this.chainId}`);
        }
        return quoterAddress;
    }
    getQuotesManyExactIn(amountIns, routes, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getQuotesManyData(amountIns, routes, 'quoteExactInput', providerConfig);
        });
    }
    getQuotesManyExactOut(amountOuts, routes, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getQuotesManyData(amountOuts, routes, 'quoteExactOutput', providerConfig);
        });
    }
    getQuotesManyData(amounts, routes, functionName, _providerConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const useMixedRouteQuoter = routes.some((route) => route.protocol === router_sdk_1.Protocol.V2) ||
                routes.some((route) => route.protocol === router_sdk_1.Protocol.MIXED);
            /// Validate that there are no incorrect routes / function combinations
            this.validateRoutes(routes, functionName, useMixedRouteQuoter);
            let multicallChunk = this.batchParams.multicallChunk;
            let gasLimitOverride = this.batchParams.gasLimitPerCall;
            const { baseBlockOffset, rollback } = this.blockNumberConfig;
            // Apply the base block offset if provided
            const originalBlockNumber = yield this.provider.getBlockNumber();
            const providerConfig = Object.assign(Object.assign({}, _providerConfig), { blockNumber: (_a = _providerConfig === null || _providerConfig === void 0 ? void 0 : _providerConfig.blockNumber) !== null && _a !== void 0 ? _a : originalBlockNumber + baseBlockOffset });
            const inputs = (0, lodash_1.default)(routes)
                .flatMap((route) => {
                const encodedRoute = route.protocol === router_sdk_1.Protocol.V3
                    ? (0, v3_sdk_1.encodeRouteToPath)(route, functionName == 'quoteExactOutput' // For exactOut must be true to ensure the routes are reversed.
                    )
                    : (0, router_sdk_1.encodeMixedRouteToPath)(route instanceof router_1.V2Route
                        ? new router_sdk_1.MixedRouteSDK(route.pairs, route.input, route.output)
                        : route);
                const routeInputs = amounts.map((amount) => [
                    encodedRoute,
                    `0x${amount.quotient.toString(16)}`,
                ]);
                return routeInputs;
            })
                .value();
            const normalizedChunk = Math.ceil(inputs.length / Math.ceil(inputs.length / multicallChunk));
            const inputsChunked = lodash_1.default.chunk(inputs, normalizedChunk);
            let quoteStates = lodash_1.default.map(inputsChunked, (inputChunk) => {
                return {
                    status: 'pending',
                    inputs: inputChunk,
                };
            });
            log_1.log.info(`About to get ${inputs.length} quotes in chunks of ${normalizedChunk} [${lodash_1.default.map(inputsChunked, (i) => i.length).join(',')}] ${gasLimitOverride
                ? `with a gas limit override of ${gasLimitOverride}`
                : ''} and block number: ${yield providerConfig.blockNumber} [Original before offset: ${originalBlockNumber}].`);
            util_1.metric.putMetric('QuoteBatchSize', inputs.length, util_1.MetricLoggerUnit.Count);
            util_1.metric.putMetric(`QuoteBatchSize_${(0, util_1.ID_TO_NETWORK_NAME)(this.chainId)}`, inputs.length, util_1.MetricLoggerUnit.Count);
            let haveRetriedForSuccessRate = false;
            let haveRetriedForBlockHeader = false;
            let blockHeaderRetryAttemptNumber = 0;
            let haveIncrementedBlockHeaderFailureCounter = false;
            let blockHeaderRolledBack = false;
            let haveRetriedForBlockConflictError = false;
            let haveRetriedForOutOfGas = false;
            let haveRetriedForTimeout = false;
            let haveRetriedForUnknownReason = false;
            let finalAttemptNumber = 1;
            const expectedCallsMade = quoteStates.length;
            let totalCallsMade = 0;
            const { results: quoteResults, blockNumber, approxGasUsedPerSuccessCall, } = yield (0, async_retry_1.default)((_bail, attemptNumber) => __awaiter(this, void 0, void 0, function* () {
                haveIncrementedBlockHeaderFailureCounter = false;
                finalAttemptNumber = attemptNumber;
                const [success, failed, pending] = this.partitionQuotes(quoteStates);
                log_1.log.info(`Starting attempt: ${attemptNumber}.
          Currently ${success.length} success, ${failed.length} failed, ${pending.length} pending.
          Gas limit override: ${gasLimitOverride} Block number override: ${providerConfig.blockNumber}.`);
                quoteStates = yield Promise.all(lodash_1.default.map(quoteStates, (quoteState, idx) => __awaiter(this, void 0, void 0, function* () {
                    if (quoteState.status == 'success') {
                        return quoteState;
                    }
                    // QuoteChunk is pending or failed, so we try again
                    const { inputs } = quoteState;
                    try {
                        totalCallsMade = totalCallsMade + 1;
                        const results = yield this.multicall2Provider.callSameFunctionOnContractWithMultipleParams({
                            address: this.getQuoterAddress(useMixedRouteQuoter),
                            contractInterface: useMixedRouteQuoter
                                ? IMixedRouteQuoterV1__factory_1.IMixedRouteQuoterV1__factory.createInterface()
                                : IQuoterV2__factory_1.IQuoterV2__factory.createInterface(),
                            functionName,
                            functionParams: inputs,
                            providerConfig,
                            additionalConfig: {
                                gasLimitPerCallOverride: gasLimitOverride,
                            },
                        });
                        const successRateError = this.validateSuccessRate(results.results, haveRetriedForSuccessRate);
                        if (successRateError) {
                            return {
                                status: 'failed',
                                inputs,
                                reason: successRateError,
                                results,
                            };
                        }
                        return {
                            status: 'success',
                            inputs,
                            results,
                        };
                    }
                    catch (err) {
                        // Error from providers have huge messages that include all the calldata and fill the logs.
                        // Catch them and rethrow with shorter message.
                        if (err.message.includes('header not found')) {
                            return {
                                status: 'failed',
                                inputs,
                                reason: new ProviderBlockHeaderError(err.message.slice(0, 500)),
                            };
                        }
                        if (err.message.includes('timeout')) {
                            return {
                                status: 'failed',
                                inputs,
                                reason: new ProviderTimeoutError(`Req ${idx}/${quoteStates.length}. Request had ${inputs.length} inputs. ${err.message.slice(0, 500)}`),
                            };
                        }
                        if (err.message.includes('out of gas')) {
                            return {
                                status: 'failed',
                                inputs,
                                reason: new ProviderGasError(err.message.slice(0, 500)),
                            };
                        }
                        return {
                            status: 'failed',
                            inputs,
                            reason: new Error(`Unknown error from provider: ${err.message.slice(0, 500)}`),
                        };
                    }
                })));
                const [successfulQuoteStates, failedQuoteStates, pendingQuoteStates] = this.partitionQuotes(quoteStates);
                if (pendingQuoteStates.length > 0) {
                    throw new Error('Pending quote after waiting for all promises.');
                }
                let retryAll = false;
                const blockNumberError = this.validateBlockNumbers(successfulQuoteStates, inputsChunked.length, gasLimitOverride);
                // If there is a block number conflict we retry all the quotes.
                if (blockNumberError) {
                    retryAll = true;
                }
                const reasonForFailureStr = lodash_1.default.map(failedQuoteStates, (failedQuoteState) => failedQuoteState.reason.name).join(', ');
                if (failedQuoteStates.length > 0) {
                    log_1.log.info(`On attempt ${attemptNumber}: ${failedQuoteStates.length}/${quoteStates.length} quotes failed. Reasons: ${reasonForFailureStr}`);
                    for (const failedQuoteState of failedQuoteStates) {
                        const { reason: error } = failedQuoteState;
                        log_1.log.info({ error }, `[QuoteFetchError] Attempt ${attemptNumber}. ${error.message}`);
                        if (error instanceof BlockConflictError) {
                            if (!haveRetriedForBlockConflictError) {
                                util_1.metric.putMetric('QuoteBlockConflictErrorRetry', 1, util_1.MetricLoggerUnit.Count);
                                haveRetriedForBlockConflictError = true;
                            }
                            retryAll = true;
                        }
                        else if (error instanceof ProviderBlockHeaderError) {
                            if (!haveRetriedForBlockHeader) {
                                util_1.metric.putMetric('QuoteBlockHeaderNotFoundRetry', 1, util_1.MetricLoggerUnit.Count);
                                haveRetriedForBlockHeader = true;
                            }
                            // Ensure that if multiple calls fail due to block header in the current pending batch,
                            // we only count once.
                            if (!haveIncrementedBlockHeaderFailureCounter) {
                                blockHeaderRetryAttemptNumber =
                                    blockHeaderRetryAttemptNumber + 1;
                                haveIncrementedBlockHeaderFailureCounter = true;
                            }
                            if (rollback.enabled) {
                                const { rollbackBlockOffset, attemptsBeforeRollback } = rollback;
                                if (blockHeaderRetryAttemptNumber >= attemptsBeforeRollback &&
                                    !blockHeaderRolledBack) {
                                    log_1.log.info(`Attempt ${attemptNumber}. Have failed due to block header ${blockHeaderRetryAttemptNumber - 1} times. Rolling back block number by ${rollbackBlockOffset} for next retry`);
                                    providerConfig.blockNumber = providerConfig.blockNumber
                                        ? (yield providerConfig.blockNumber) + rollbackBlockOffset
                                        : (yield this.provider.getBlockNumber()) +
                                            rollbackBlockOffset;
                                    retryAll = true;
                                    blockHeaderRolledBack = true;
                                }
                            }
                        }
                        else if (error instanceof ProviderTimeoutError) {
                            if (!haveRetriedForTimeout) {
                                util_1.metric.putMetric('QuoteTimeoutRetry', 1, util_1.MetricLoggerUnit.Count);
                                haveRetriedForTimeout = true;
                            }
                        }
                        else if (error instanceof ProviderGasError) {
                            if (!haveRetriedForOutOfGas) {
                                util_1.metric.putMetric('QuoteOutOfGasExceptionRetry', 1, util_1.MetricLoggerUnit.Count);
                                haveRetriedForOutOfGas = true;
                            }
                            gasLimitOverride = this.gasErrorFailureOverride.gasLimitOverride;
                            multicallChunk = this.gasErrorFailureOverride.multicallChunk;
                            retryAll = true;
                        }
                        else if (error instanceof SuccessRateError) {
                            if (!haveRetriedForSuccessRate) {
                                util_1.metric.putMetric('QuoteSuccessRateRetry', 1, util_1.MetricLoggerUnit.Count);
                                haveRetriedForSuccessRate = true;
                                // Low success rate can indicate too little gas given to each call.
                                gasLimitOverride =
                                    this.successRateFailureOverrides.gasLimitOverride;
                                multicallChunk =
                                    this.successRateFailureOverrides.multicallChunk;
                                retryAll = true;
                            }
                        }
                        else {
                            if (!haveRetriedForUnknownReason) {
                                util_1.metric.putMetric('QuoteUnknownReasonRetry', 1, util_1.MetricLoggerUnit.Count);
                                haveRetriedForUnknownReason = true;
                            }
                        }
                    }
                }
                if (retryAll) {
                    log_1.log.info(`Attempt ${attemptNumber}. Resetting all requests to pending for next attempt.`);
                    const normalizedChunk = Math.ceil(inputs.length / Math.ceil(inputs.length / multicallChunk));
                    const inputsChunked = lodash_1.default.chunk(inputs, normalizedChunk);
                    quoteStates = lodash_1.default.map(inputsChunked, (inputChunk) => {
                        return {
                            status: 'pending',
                            inputs: inputChunk,
                        };
                    });
                }
                if (failedQuoteStates.length > 0) {
                    // TODO: Work with Arbitrum to find a solution for making large multicalls with gas limits that always
                    // successfully.
                    //
                    // On Arbitrum we can not set a gas limit for every call in the multicall and guarantee that
                    // we will not run out of gas on the node. This is because they have a different way of accounting
                    // for gas, that seperates storage and compute gas costs, and we can not cover both in a single limit.
                    //
                    // To work around this and avoid throwing errors when really we just couldn't get a quote, we catch this
                    // case and return 0 quotes found.
                    if ((this.chainId == sdk_core_1.ChainId.ARBITRUM_ONE ||
                        this.chainId == sdk_core_1.ChainId.ARBITRUM_GOERLI) &&
                        lodash_1.default.every(failedQuoteStates, (failedQuoteState) => failedQuoteState.reason instanceof ProviderGasError) &&
                        attemptNumber == this.retryOptions.retries) {
                        log_1.log.error(`Failed to get quotes on Arbitrum due to provider gas error issue. Overriding error to return 0 quotes.`);
                        return {
                            results: [],
                            blockNumber: bignumber_1.BigNumber.from(0),
                            approxGasUsedPerSuccessCall: 0,
                        };
                    }
                    throw new Error(`Failed to get ${failedQuoteStates.length} quotes. Reasons: ${reasonForFailureStr}`);
                }
                const callResults = lodash_1.default.map(successfulQuoteStates, (quoteState) => quoteState.results);
                return {
                    results: lodash_1.default.flatMap(callResults, (result) => result.results),
                    blockNumber: bignumber_1.BigNumber.from(callResults[0].blockNumber),
                    approxGasUsedPerSuccessCall: stats_lite_1.default.percentile(lodash_1.default.map(callResults, (result) => result.approxGasUsedPerSuccessCall), 100),
                };
            }), Object.assign({ retries: DEFAULT_BATCH_RETRIES }, this.retryOptions));
            const routesQuotes = this.processQuoteResults(quoteResults, routes, amounts);
            util_1.metric.putMetric('QuoteApproxGasUsedPerSuccessfulCall', approxGasUsedPerSuccessCall, util_1.MetricLoggerUnit.Count);
            util_1.metric.putMetric('QuoteNumRetryLoops', finalAttemptNumber - 1, util_1.MetricLoggerUnit.Count);
            util_1.metric.putMetric('QuoteTotalCallsToProvider', totalCallsMade, util_1.MetricLoggerUnit.Count);
            util_1.metric.putMetric('QuoteExpectedCallsToProvider', expectedCallsMade, util_1.MetricLoggerUnit.Count);
            util_1.metric.putMetric('QuoteNumRetriedCalls', totalCallsMade - expectedCallsMade, util_1.MetricLoggerUnit.Count);
            const [successfulQuotes, failedQuotes] = (0, lodash_1.default)(routesQuotes)
                .flatMap((routeWithQuotes) => routeWithQuotes[1])
                .partition((quote) => quote.quote != null)
                .value();
            log_1.log.info(`Got ${successfulQuotes.length} successful quotes, ${failedQuotes.length} failed quotes. Took ${finalAttemptNumber - 1} attempt loops. Total calls made to provider: ${totalCallsMade}. Have retried for timeout: ${haveRetriedForTimeout}`);
            return { routesWithQuotes: routesQuotes, blockNumber };
        });
    }
    partitionQuotes(quoteStates) {
        const successfulQuoteStates = lodash_1.default.filter(quoteStates, (quoteState) => quoteState.status == 'success');
        const failedQuoteStates = lodash_1.default.filter(quoteStates, (quoteState) => quoteState.status == 'failed');
        const pendingQuoteStates = lodash_1.default.filter(quoteStates, (quoteState) => quoteState.status == 'pending');
        return [successfulQuoteStates, failedQuoteStates, pendingQuoteStates];
    }
    processQuoteResults(quoteResults, routes, amounts) {
        const routesQuotes = [];
        const quotesResultsByRoute = lodash_1.default.chunk(quoteResults, amounts.length);
        const debugFailedQuotes = [];
        for (let i = 0; i < quotesResultsByRoute.length; i++) {
            const route = routes[i];
            const quoteResults = quotesResultsByRoute[i];
            const quotes = lodash_1.default.map(quoteResults, (quoteResult, index) => {
                const amount = amounts[index];
                if (!quoteResult.success) {
                    const percent = (100 / amounts.length) * (index + 1);
                    const amountStr = amount.toFixed(Math.min(amount.currency.decimals, 2));
                    const routeStr = (0, routes_1.routeToString)(route);
                    debugFailedQuotes.push({
                        route: routeStr,
                        percent,
                        amount: amountStr,
                    });
                    return {
                        amount,
                        quote: null,
                        sqrtPriceX96AfterList: null,
                        gasEstimate: null,
                        initializedTicksCrossedList: null,
                    };
                }
                return {
                    amount,
                    quote: quoteResult.result[0],
                    sqrtPriceX96AfterList: quoteResult.result[1],
                    initializedTicksCrossedList: quoteResult.result[2],
                    gasEstimate: quoteResult.result[3],
                };
            });
            routesQuotes.push([route, quotes]);
        }
        // For routes and amounts that we failed to get a quote for, group them by route
        // and batch them together before logging to minimize number of logs.
        const debugChunk = 80;
        lodash_1.default.forEach(lodash_1.default.chunk(debugFailedQuotes, debugChunk), (quotes, idx) => {
            const failedQuotesByRoute = lodash_1.default.groupBy(quotes, (q) => q.route);
            const failedFlat = lodash_1.default.mapValues(failedQuotesByRoute, (f) => (0, lodash_1.default)(f)
                .map((f) => `${f.percent}%[${f.amount}]`)
                .join(','));
            log_1.log.info({
                failedQuotes: lodash_1.default.map(failedFlat, (amounts, routeStr) => `${routeStr} : ${amounts}`),
            }, `Failed on chain quotes for routes Part ${idx}/${Math.ceil(debugFailedQuotes.length / debugChunk)}`);
        });
        return routesQuotes;
    }
    validateBlockNumbers(successfulQuoteStates, totalCalls, gasLimitOverride) {
        if (successfulQuoteStates.length <= 1) {
            return null;
        }
        const results = lodash_1.default.map(successfulQuoteStates, (quoteState) => quoteState.results);
        const blockNumbers = lodash_1.default.map(results, (result) => result.blockNumber);
        const uniqBlocks = (0, lodash_1.default)(blockNumbers)
            .map((blockNumber) => blockNumber.toNumber())
            .uniq()
            .value();
        if (uniqBlocks.length == 1) {
            return null;
        }
        /* if (
          uniqBlocks.length == 2 &&
          Math.abs(uniqBlocks[0]! - uniqBlocks[1]!) <= 1
        ) {
          return null;
        } */
        return new BlockConflictError(`Quotes returned from different blocks. ${uniqBlocks}. ${totalCalls} calls were made with gas limit ${gasLimitOverride}`);
    }
    validateSuccessRate(allResults, haveRetriedForSuccessRate) {
        const numResults = allResults.length;
        const numSuccessResults = allResults.filter((result) => result.success).length;
        const successRate = (1.0 * numSuccessResults) / numResults;
        const { quoteMinSuccessRate } = this.batchParams;
        if (successRate < quoteMinSuccessRate) {
            if (haveRetriedForSuccessRate) {
                log_1.log.info(`Quote success rate still below threshold despite retry. Continuing. ${quoteMinSuccessRate}: ${successRate}`);
                return;
            }
            return new SuccessRateError(`Quote success rate below threshold of ${quoteMinSuccessRate}: ${successRate}`);
        }
    }
    /**
     * Throw an error for incorrect routes / function combinations
     * @param routes Any combination of V3, V2, and Mixed routes.
     * @param functionName
     * @param useMixedRouteQuoter true if there are ANY V2Routes or MixedRoutes in the routes parameter
     */
    validateRoutes(routes, functionName, useMixedRouteQuoter) {
        /// We do not send any V3Routes to new qutoer becuase it is not deployed on chains besides mainnet
        if (routes.some((route) => route.protocol === router_sdk_1.Protocol.V3) &&
            useMixedRouteQuoter) {
            throw new Error(`Cannot use mixed route quoter with V3 routes`);
        }
        /// We cannot call quoteExactOutput with V2 or Mixed routes
        if (functionName === 'quoteExactOutput' && useMixedRouteQuoter) {
            throw new Error('Cannot call quoteExactOutput with V2 or Mixed routes');
        }
    }
}
exports.OnChainQuoteProvider = OnChainQuoteProvider;
