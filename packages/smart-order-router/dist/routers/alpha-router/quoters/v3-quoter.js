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
exports.V3Quoter = void 0;
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const lodash_1 = __importDefault(require("lodash"));
const providers_1 = require("../../../providers");
const util_1 = require("../../../util");
const entities_1 = require("../entities");
const compute_all_routes_1 = require("../functions/compute-all-routes");
const base_quoter_1 = require("./base-quoter");
class V3Quoter extends base_quoter_1.BaseQuoter {
    constructor(v3SubgraphProvider, v3PoolProvider, onChainQuoteProvider, tokenProvider, chainId, blockedTokenListProvider, tokenValidatorProvider) {
        super(tokenProvider, chainId, router_sdk_1.Protocol.V3, blockedTokenListProvider, tokenValidatorProvider);
        this.v3SubgraphProvider = v3SubgraphProvider;
        this.v3PoolProvider = v3PoolProvider;
        this.onChainQuoteProvider = onChainQuoteProvider;
    }
    getRoutes(tokenIn, tokenOut, v3CandidatePools, _tradeType, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGetRoutes = Date.now();
            // Fetch all the pools that we will consider routing via. There are thousands
            // of pools, so we filter them to a set of candidate pools that we expect will
            // result in good prices.
            const { poolAccessor, candidatePools } = v3CandidatePools;
            const poolsRaw = poolAccessor.getAllPools();
            // Drop any pools that contain fee on transfer tokens (not supported by v3) or have issues with being transferred.
            const pools = yield this.applyTokenValidatorToPools(poolsRaw, (token, tokenValidation) => {
                // If there is no available validation result we assume the token is fine.
                if (!tokenValidation) {
                    return false;
                }
                // Only filters out *intermediate* pools that involve tokens that we detect
                // cant be transferred. This prevents us trying to route through tokens that may
                // not be transferrable, but allows users to still swap those tokens if they
                // specify.
                //
                if (tokenValidation == providers_1.TokenValidationResult.STF &&
                    (token.equals(tokenIn) || token.equals(tokenOut))) {
                    return false;
                }
                return (tokenValidation == providers_1.TokenValidationResult.FOT ||
                    tokenValidation == providers_1.TokenValidationResult.STF);
            });
            // Given all our candidate pools, compute all the possible ways to route from tokenIn to tokenOut.
            const { maxSwapsPerPath } = routingConfig;
            const routes = (0, compute_all_routes_1.computeAllV3Routes)(tokenIn, tokenOut, pools, maxSwapsPerPath);
            util_1.metric.putMetric('V3GetRoutesLoad', Date.now() - beforeGetRoutes, util_1.MetricLoggerUnit.Milliseconds);
            return {
                routes,
                candidatePools,
            };
        });
    }
    getQuotes(routes, amounts, percents, quoteToken, tradeType, routingConfig, candidatePools, gasModel) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGetQuotes = Date.now();
            util_1.log.info('Starting to get V3 quotes');
            if (gasModel === undefined) {
                throw new Error('GasModel for V3RouteWithValidQuote is required to getQuotes');
            }
            if (routes.length == 0) {
                return { routesWithValidQuotes: [], candidatePools };
            }
            // For all our routes, and all the fractional amounts, fetch quotes on-chain.
            const quoteFn = tradeType == sdk_core_1.TradeType.EXACT_INPUT
                ? this.onChainQuoteProvider.getQuotesManyExactIn.bind(this.onChainQuoteProvider)
                : this.onChainQuoteProvider.getQuotesManyExactOut.bind(this.onChainQuoteProvider);
            const beforeQuotes = Date.now();
            util_1.log.info(`Getting quotes for V3 for ${routes.length} routes with ${amounts.length} amounts per route.`);
            const { routesWithQuotes } = yield quoteFn(amounts, routes, {
                blockNumber: routingConfig.blockNumber,
            });
            util_1.metric.putMetric('V3QuotesLoad', Date.now() - beforeQuotes, util_1.MetricLoggerUnit.Milliseconds);
            util_1.metric.putMetric('V3QuotesFetched', (0, lodash_1.default)(routesWithQuotes)
                .map(([, quotes]) => quotes.length)
                .sum(), util_1.MetricLoggerUnit.Count);
            const routesWithValidQuotes = [];
            for (const routeWithQuote of routesWithQuotes) {
                const [route, quotes] = routeWithQuote;
                for (let i = 0; i < quotes.length; i++) {
                    const percent = percents[i];
                    const amountQuote = quotes[i];
                    const { quote, amount, sqrtPriceX96AfterList, initializedTicksCrossedList, gasEstimate, } = amountQuote;
                    if (!quote ||
                        !sqrtPriceX96AfterList ||
                        !initializedTicksCrossedList ||
                        !gasEstimate) {
                        util_1.log.debug({
                            route: (0, util_1.routeToString)(route),
                            amountQuote,
                        }, 'Dropping a null V3 quote for route.');
                        continue;
                    }
                    const routeWithValidQuote = new entities_1.V3RouteWithValidQuote({
                        route,
                        rawQuote: quote,
                        amount,
                        percent,
                        sqrtPriceX96AfterList,
                        initializedTicksCrossedList,
                        quoterGasEstimate: gasEstimate,
                        gasModel,
                        quoteToken,
                        tradeType,
                        v3PoolProvider: this.v3PoolProvider,
                    });
                    routesWithValidQuotes.push(routeWithValidQuote);
                }
            }
            util_1.metric.putMetric('V3GetQuotesLoad', Date.now() - beforeGetQuotes, util_1.MetricLoggerUnit.Milliseconds);
            return {
                routesWithValidQuotes,
                candidatePools
            };
        });
    }
}
exports.V3Quoter = V3Quoter;
