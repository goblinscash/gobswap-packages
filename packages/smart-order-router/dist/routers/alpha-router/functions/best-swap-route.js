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
exports.getBestSwapRouteBy = exports.getBestSwapRoute = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_1 = __importDefault(require("lodash"));
const fixed_reverse_heap_1 = __importDefault(require("mnemonist/fixed-reverse-heap"));
const queue_1 = __importDefault(require("mnemonist/queue"));
const util_1 = require("../../../util");
const amounts_1 = require("../../../util/amounts");
const log_1 = require("../../../util/log");
const metric_1 = require("../../../util/metric");
const routes_1 = require("../../../util/routes");
const gas_models_1 = require("../gas-models");
function getBestSwapRoute(amount, percents, routesWithValidQuotes, routeType, chainId, routingConfig, portionProvider, gasModel, swapConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        const { forceMixedRoutes } = routingConfig;
        /// Like with forceCrossProtocol, we apply that logic here when determining the bestSwapRoute
        if (forceMixedRoutes) {
            log_1.log.info({
                forceMixedRoutes: forceMixedRoutes,
            }, 'Forcing mixed routes by filtering out other route types');
            routesWithValidQuotes = lodash_1.default.filter(routesWithValidQuotes, (quotes) => {
                return quotes.protocol === router_sdk_1.Protocol.MIXED;
            });
            if (!routesWithValidQuotes) {
                return null;
            }
        }
        // Build a map of percentage of the input to list of valid quotes.
        // Quotes can be null for a variety of reasons (not enough liquidity etc), so we drop them here too.
        const percentToQuotes = {};
        for (const routeWithValidQuote of routesWithValidQuotes) {
            if (!percentToQuotes[routeWithValidQuote.percent]) {
                percentToQuotes[routeWithValidQuote.percent] = [];
            }
            percentToQuotes[routeWithValidQuote.percent].push(routeWithValidQuote);
        }
        metric_1.metric.putMetric('BuildRouteWithValidQuoteObjects', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
        // Given all the valid quotes for each percentage find the optimal route.
        const swapRoute = yield getBestSwapRouteBy(routeType, percentToQuotes, percents, chainId, (rq) => rq.quoteAdjustedForGas, routingConfig, portionProvider, gasModel, swapConfig);
        // It is possible we were unable to find any valid route given the quotes.
        if (!swapRoute) {
            return null;
        }
        // Due to potential loss of precision when taking percentages of the input it is possible that the sum of the amounts of each
        // route of our optimal quote may not add up exactly to exactIn or exactOut.
        //
        // We check this here, and if there is a mismatch
        // add the missing amount to a random route. The missing amount size should be neglible so the quote should still be highly accurate.
        const { routes: routeAmounts } = swapRoute;
        const totalAmount = lodash_1.default.reduce(routeAmounts, (total, routeAmount) => total.add(routeAmount.amount), amounts_1.CurrencyAmount.fromRawAmount(routeAmounts[0].amount.currency, 0));
        const missingAmount = amount.subtract(totalAmount);
        if (missingAmount.greaterThan(0)) {
            log_1.log.info({
                missingAmount: missingAmount.quotient.toString(),
            }, `Optimal route's amounts did not equal exactIn/exactOut total. Adding missing amount to last route in array.`);
            routeAmounts[routeAmounts.length - 1].amount =
                routeAmounts[routeAmounts.length - 1].amount.add(missingAmount);
        }
        log_1.log.info({
            routes: (0, routes_1.routeAmountsToString)(routeAmounts),
            numSplits: routeAmounts.length,
            amount: amount.toExact(),
            quote: swapRoute.quote.toExact(),
            quoteGasAdjusted: swapRoute.quoteGasAdjusted.toFixed(Math.min(swapRoute.quoteGasAdjusted.currency.decimals, 2)),
            estimatedGasUSD: swapRoute.estimatedGasUsedUSD.toFixed(Math.min(swapRoute.estimatedGasUsedUSD.currency.decimals, 2)),
            estimatedGasToken: swapRoute.estimatedGasUsedQuoteToken.toFixed(Math.min(swapRoute.estimatedGasUsedQuoteToken.currency.decimals, 2)),
        }, `Found best swap route. ${routeAmounts.length} split.`);
        return swapRoute;
    });
}
exports.getBestSwapRoute = getBestSwapRoute;
function getBestSwapRouteBy(routeType, percentToQuotes, percents, chainId, by, routingConfig, portionProvider, gasModel, swapConfig) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Build a map of percentage to sorted list of quotes, with the biggest quote being first in the list.
        const percentToSortedQuotes = lodash_1.default.mapValues(percentToQuotes, (routeQuotes) => {
            return routeQuotes.sort((routeQuoteA, routeQuoteB) => {
                if (routeType == sdk_core_1.TradeType.EXACT_INPUT) {
                    return by(routeQuoteA).greaterThan(by(routeQuoteB)) ? -1 : 1;
                }
                else {
                    return by(routeQuoteA).lessThan(by(routeQuoteB)) ? -1 : 1;
                }
            });
        });
        const quoteCompFn = routeType == sdk_core_1.TradeType.EXACT_INPUT
            ? (a, b) => a.greaterThan(b)
            : (a, b) => a.lessThan(b);
        const sumFn = (currencyAmounts) => {
            let sum = currencyAmounts[0];
            for (let i = 1; i < currencyAmounts.length; i++) {
                sum = sum.add(currencyAmounts[i]);
            }
            return sum;
        };
        let bestQuote;
        let bestSwap;
        // Min-heap for tracking the 5 best swaps given some number of splits.
        const bestSwapsPerSplit = new fixed_reverse_heap_1.default(Array, (a, b) => {
            return quoteCompFn(a.quote, b.quote) ? -1 : 1;
        }, 3);
        const { minSplits, maxSplits, forceCrossProtocol } = routingConfig;
        if (!percentToSortedQuotes[100] || minSplits > 1 || forceCrossProtocol) {
            log_1.log.info({
                percentToSortedQuotes: lodash_1.default.mapValues(percentToSortedQuotes, (p) => p.length),
            }, 'Did not find a valid route without any splits. Continuing search anyway.');
        }
        else {
            bestQuote = by(percentToSortedQuotes[100][0]);
            bestSwap = [percentToSortedQuotes[100][0]];
            for (const routeWithQuote of percentToSortedQuotes[100].slice(0, 5)) {
                bestSwapsPerSplit.push({
                    quote: by(routeWithQuote),
                    routes: [routeWithQuote],
                });
            }
        }
        // We do a BFS. Each additional node in a path represents us adding an additional split to the route.
        const queue = new queue_1.default();
        // First we seed BFS queue with the best quotes for each percentage.
        // i.e. [best quote when sending 10% of amount, best quote when sending 20% of amount, ...]
        // We will explore the various combinations from each node.
        for (let i = percents.length; i >= 0; i--) {
            const percent = percents[i];
            if (!percentToSortedQuotes[percent]) {
                continue;
            }
            queue.enqueue({
                curRoutes: [percentToSortedQuotes[percent][0]],
                percentIndex: i,
                remainingPercent: 100 - percent,
                special: false,
            });
            if (!percentToSortedQuotes[percent] ||
                !percentToSortedQuotes[percent][1]) {
                continue;
            }
            queue.enqueue({
                curRoutes: [percentToSortedQuotes[percent][1]],
                percentIndex: i,
                remainingPercent: 100 - percent,
                special: true,
            });
        }
        let splits = 1;
        let startedSplit = Date.now();
        while (queue.size > 0) {
            metric_1.metric.putMetric(`Split${splits}Done`, Date.now() - startedSplit, metric_1.MetricLoggerUnit.Milliseconds);
            startedSplit = Date.now();
            log_1.log.info({
                top5: lodash_1.default.map(Array.from(bestSwapsPerSplit.consume()), (q) => `${q.quote.toExact()} (${(0, lodash_1.default)(q.routes)
                    .map((r) => r.toString())
                    .join(', ')})`),
                onQueue: queue.size,
            }, `Top 3 with ${splits} splits`);
            bestSwapsPerSplit.clear();
            // Size of the queue at this point is the number of potential routes we are investigating for the given number of splits.
            let layer = queue.size;
            splits++;
            // If we didn't improve our quote by adding another split, very unlikely to improve it by splitting more after that.
            if (splits >= 3 && bestSwap && bestSwap.length < splits - 1) {
                break;
            }
            if (splits > maxSplits) {
                log_1.log.info('Max splits reached. Stopping search.');
                metric_1.metric.putMetric(`MaxSplitsHitReached`, 1, metric_1.MetricLoggerUnit.Count);
                break;
            }
            while (layer > 0) {
                layer--;
                const { remainingPercent, curRoutes, percentIndex, special } = queue.dequeue();
                // For all other percentages, add a new potential route.
                // E.g. if our current aggregated route if missing 50%, we will create new nodes and add to the queue for:
                // 50% + new 10% route, 50% + new 20% route, etc.
                for (let i = percentIndex; i >= 0; i--) {
                    const percentA = percents[i];
                    if (percentA > remainingPercent) {
                        continue;
                    }
                    // At some point the amount * percentage is so small that the quoter is unable to get
                    // a quote. In this case there could be no quotes for that percentage.
                    if (!percentToSortedQuotes[percentA]) {
                        continue;
                    }
                    const candidateRoutesA = percentToSortedQuotes[percentA];
                    // Find the best route in the complimentary percentage that doesn't re-use a pool already
                    // used in the current route. Re-using pools is not allowed as each swap through a pool changes its liquidity,
                    // so it would make the quotes inaccurate.
                    const routeWithQuoteA = findFirstRouteNotUsingUsedPools(curRoutes, candidateRoutesA, forceCrossProtocol);
                    if (!routeWithQuoteA) {
                        continue;
                    }
                    const remainingPercentNew = remainingPercent - percentA;
                    const curRoutesNew = [...curRoutes, routeWithQuoteA];
                    // If we've found a route combination that uses all 100%, and it has at least minSplits, update our best route.
                    if (remainingPercentNew == 0 && splits >= minSplits) {
                        const quotesNew = lodash_1.default.map(curRoutesNew, (r) => by(r));
                        const quoteNew = sumFn(quotesNew);
                        let gasCostL1QuoteToken = amounts_1.CurrencyAmount.fromRawAmount(quoteNew.currency, 0);
                        if (util_1.HAS_L1_FEE.includes(chainId)) {
                            const onlyV3Routes = curRoutesNew.every((route) => route.protocol == router_sdk_1.Protocol.V3);
                            if (gasModel == undefined || !onlyV3Routes) {
                                throw new Error('Can\'t compute L1 gas fees.');
                            }
                            else {
                                const gasCostL1 = yield gasModel.calculateL1GasFees(curRoutesNew);
                                gasCostL1QuoteToken = gasCostL1.gasCostL1QuoteToken;
                            }
                        }
                        const quoteAfterL1Adjust = routeType == sdk_core_1.TradeType.EXACT_INPUT
                            ? quoteNew.subtract(gasCostL1QuoteToken)
                            : quoteNew.add(gasCostL1QuoteToken);
                        bestSwapsPerSplit.push({
                            quote: quoteAfterL1Adjust,
                            routes: curRoutesNew,
                        });
                        if (!bestQuote || quoteCompFn(quoteAfterL1Adjust, bestQuote)) {
                            bestQuote = quoteAfterL1Adjust;
                            bestSwap = curRoutesNew;
                            // Temporary experiment.
                            if (special) {
                                metric_1.metric.putMetric(`BestSwapNotPickingBestForPercent`, 1, metric_1.MetricLoggerUnit.Count);
                            }
                        }
                    }
                    else {
                        queue.enqueue({
                            curRoutes: curRoutesNew,
                            remainingPercent: remainingPercentNew,
                            percentIndex: i,
                            special,
                        });
                    }
                }
            }
        }
        if (!bestSwap) {
            log_1.log.info(`Could not find a valid swap`);
            return undefined;
        }
        const postSplitNow = Date.now();
        let quoteGasAdjusted = sumFn(lodash_1.default.map(bestSwap, (routeWithValidQuote) => routeWithValidQuote.quoteAdjustedForGas));
        // this calculates the base gas used
        // if on L1, its the estimated gas used based on hops and ticks across all the routes
        // if on L2, its the gas used on the L2 based on hops and ticks across all the routes
        const estimatedGasUsed = (0, lodash_1.default)(bestSwap)
            .map((routeWithValidQuote) => routeWithValidQuote.gasEstimate)
            .reduce((sum, routeWithValidQuote) => sum.add(routeWithValidQuote), bignumber_1.BigNumber.from(0));
        if (!gas_models_1.usdGasTokensByChain[chainId] || !gas_models_1.usdGasTokensByChain[chainId][0]) {
            // Each route can use a different stablecoin to account its gas costs.
            // They should all be pegged, and this is just an estimate, so we do a merge
            // to an arbitrary stable.
            throw new Error(`Could not find a USD token for computing gas costs on ${chainId}`);
        }
        const usdToken = gas_models_1.usdGasTokensByChain[chainId][0];
        const usdTokenDecimals = usdToken.decimals;
        // if on L2, calculate the L1 security fee
        let gasCostsL1ToL2 = {
            gasUsedL1: bignumber_1.BigNumber.from(0),
            gasCostL1USD: amounts_1.CurrencyAmount.fromRawAmount(usdToken, 0),
            gasCostL1QuoteToken: amounts_1.CurrencyAmount.fromRawAmount(
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            (_a = bestSwap[0]) === null || _a === void 0 ? void 0 : _a.quoteToken, 0),
        };
        // If swapping on an L2 that includes a L1 security fee, calculate the fee and include it in the gas adjusted quotes
        if (util_1.HAS_L1_FEE.includes(chainId)) {
            // ensure the gasModel exists and that the swap route is a v3 only route
            const onlyV3Routes = bestSwap.every((route) => route.protocol == router_sdk_1.Protocol.V3);
            if (gasModel == undefined || !onlyV3Routes) {
                throw new Error('Can\'t compute L1 gas fees.');
            }
            else {
                gasCostsL1ToL2 = yield gasModel.calculateL1GasFees(bestSwap);
            }
        }
        const { gasCostL1USD, gasCostL1QuoteToken } = gasCostsL1ToL2;
        // For each gas estimate, normalize decimals to that of the chosen usd token.
        const estimatedGasUsedUSDs = (0, lodash_1.default)(bestSwap)
            .map((routeWithValidQuote) => {
            // TODO: will error if gasToken has decimals greater than usdToken
            const decimalsDiff = usdTokenDecimals - routeWithValidQuote.gasCostInUSD.currency.decimals;
            if (decimalsDiff == 0) {
                return amounts_1.CurrencyAmount.fromRawAmount(usdToken, routeWithValidQuote.gasCostInUSD.quotient);
            }
            return amounts_1.CurrencyAmount.fromRawAmount(usdToken, jsbi_1.default.multiply(routeWithValidQuote.gasCostInUSD.quotient, jsbi_1.default.exponentiate(jsbi_1.default.BigInt(10), jsbi_1.default.BigInt(decimalsDiff))));
        })
            .value();
        let estimatedGasUsedUSD = sumFn(estimatedGasUsedUSDs);
        // if they are different usd pools, convert to the usdToken
        if (estimatedGasUsedUSD.currency != gasCostL1USD.currency) {
            const decimalsDiff = usdTokenDecimals - gasCostL1USD.currency.decimals;
            estimatedGasUsedUSD = estimatedGasUsedUSD.add(amounts_1.CurrencyAmount.fromRawAmount(usdToken, jsbi_1.default.multiply(gasCostL1USD.quotient, jsbi_1.default.exponentiate(jsbi_1.default.BigInt(10), jsbi_1.default.BigInt(decimalsDiff)))));
        }
        else {
            estimatedGasUsedUSD = estimatedGasUsedUSD.add(gasCostL1USD);
        }
        log_1.log.info({
            estimatedGasUsedUSD: estimatedGasUsedUSD.toExact(),
            normalizedUsdToken: usdToken,
            routeUSDGasEstimates: lodash_1.default.map(bestSwap, (b) => `${b.percent}% ${(0, routes_1.routeToString)(b.route)} ${b.gasCostInUSD.toExact()}`),
            flatL1GasCostUSD: gasCostL1USD.toExact(),
        }, 'USD gas estimates of best route');
        const estimatedGasUsedQuoteToken = sumFn(lodash_1.default.map(bestSwap, (routeWithValidQuote) => routeWithValidQuote.gasCostInToken)).add(gasCostL1QuoteToken);
        const quote = sumFn(lodash_1.default.map(bestSwap, (routeWithValidQuote) => routeWithValidQuote.quote));
        // Adjust the quoteGasAdjusted for the l1 fee
        if (routeType == sdk_core_1.TradeType.EXACT_INPUT) {
            const quoteGasAdjustedForL1 = quoteGasAdjusted.subtract(gasCostL1QuoteToken);
            quoteGasAdjusted = quoteGasAdjustedForL1;
        }
        else {
            const quoteGasAdjustedForL1 = quoteGasAdjusted.add(gasCostL1QuoteToken);
            quoteGasAdjusted = quoteGasAdjustedForL1;
        }
        const routeWithQuotes = bestSwap.sort((routeAmountA, routeAmountB) => routeAmountB.amount.greaterThan(routeAmountA.amount) ? 1 : -1);
        metric_1.metric.putMetric('PostSplitDone', Date.now() - postSplitNow, metric_1.MetricLoggerUnit.Milliseconds);
        return {
            quote,
            quoteGasAdjusted,
            estimatedGasUsed,
            estimatedGasUsedUSD,
            estimatedGasUsedQuoteToken,
            routes: portionProvider.getRouteWithQuotePortionAdjusted(routeType, routeWithQuotes, swapConfig),
        };
    });
}
exports.getBestSwapRouteBy = getBestSwapRouteBy;
// We do not allow pools to be re-used across split routes, as swapping through a pool changes the pools state.
// Given a list of used routes, this function finds the first route in the list of candidate routes that does not re-use an already used pool.
const findFirstRouteNotUsingUsedPools = (usedRoutes, candidateRouteQuotes, forceCrossProtocol) => {
    const poolAddressSet = new Set();
    const usedPoolAddresses = (0, lodash_1.default)(usedRoutes)
        .flatMap((r) => r.poolAddresses)
        .value();
    for (const poolAddress of usedPoolAddresses) {
        poolAddressSet.add(poolAddress);
    }
    const protocolsSet = new Set();
    const usedProtocols = (0, lodash_1.default)(usedRoutes)
        .flatMap((r) => r.protocol)
        .uniq()
        .value();
    for (const protocol of usedProtocols) {
        protocolsSet.add(protocol);
    }
    for (const routeQuote of candidateRouteQuotes) {
        const { poolAddresses, protocol } = routeQuote;
        if (poolAddresses.some((poolAddress) => poolAddressSet.has(poolAddress))) {
            continue;
        }
        // This code is just for debugging. Allows us to force a cross-protocol split route by skipping
        // consideration of routes that come from the same protocol as a used route.
        const needToForce = forceCrossProtocol && protocolsSet.size == 1;
        if (needToForce && protocolsSet.has(protocol)) {
            continue;
        }
        return routeQuote;
    }
    return null;
};
