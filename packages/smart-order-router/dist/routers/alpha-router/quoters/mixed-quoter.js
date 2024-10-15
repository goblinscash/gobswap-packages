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
exports.MixedQuoter = void 0;
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const lodash_1 = __importDefault(require("lodash"));
const providers_1 = require("../../../providers");
const util_1 = require("../../../util");
const entities_1 = require("../entities");
const compute_all_routes_1 = require("../functions/compute-all-routes");
const get_candidate_pools_1 = require("../functions/get-candidate-pools");
const base_quoter_1 = require("./base-quoter");
class MixedQuoter extends base_quoter_1.BaseQuoter {
    constructor(v3SubgraphProvider, v3PoolProvider, v2SubgraphProvider, v2PoolProvider, onChainQuoteProvider, tokenProvider, chainId, blockedTokenListProvider, tokenValidatorProvider) {
        super(tokenProvider, chainId, router_sdk_1.Protocol.MIXED, blockedTokenListProvider, tokenValidatorProvider);
        this.v3SubgraphProvider = v3SubgraphProvider;
        this.v3PoolProvider = v3PoolProvider;
        this.v2SubgraphProvider = v2SubgraphProvider;
        this.v2PoolProvider = v2PoolProvider;
        this.onChainQuoteProvider = onChainQuoteProvider;
    }
    getRoutes(tokenIn, tokenOut, v3v2candidatePools, tradeType, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGetRoutes = Date.now();
            if (tradeType != sdk_core_1.TradeType.EXACT_INPUT) {
                throw new Error('Mixed route quotes are not supported for EXACT_OUTPUT');
            }
            const [v3CandidatePools, v2CandidatePools] = v3v2candidatePools;
            const { V2poolAccessor, V3poolAccessor, candidatePools: mixedRouteCandidatePools, } = yield (0, get_candidate_pools_1.getMixedRouteCandidatePools)({
                v3CandidatePools,
                v2CandidatePools,
                tokenProvider: this.tokenProvider,
                v3poolProvider: this.v3PoolProvider,
                v2poolProvider: this.v2PoolProvider,
                routingConfig,
                chainId: this.chainId
            });
            const V3poolsRaw = V3poolAccessor.getAllPools();
            const V2poolsRaw = V2poolAccessor.getAllPools();
            const poolsRaw = [...V3poolsRaw, ...V2poolsRaw];
            const candidatePools = mixedRouteCandidatePools;
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
            const { maxSwapsPerPath } = routingConfig;
            const routes = (0, compute_all_routes_1.computeAllMixedRoutes)(tokenIn, tokenOut, pools, maxSwapsPerPath);
            util_1.metric.putMetric('MixedGetRoutesLoad', Date.now() - beforeGetRoutes, util_1.MetricLoggerUnit.Milliseconds);
            return {
                routes,
                candidatePools
            };
        });
    }
    getQuotes(routes, amounts, percents, quoteToken, tradeType, routingConfig, candidatePools, gasModel) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGetQuotes = Date.now();
            util_1.log.info('Starting to get mixed quotes');
            if (gasModel === undefined) {
                throw new Error('GasModel for MixedRouteWithValidQuote is required to getQuotes');
            }
            if (routes.length == 0) {
                return { routesWithValidQuotes: [], candidatePools };
            }
            // For all our routes, and all the fractional amounts, fetch quotes on-chain.
            const quoteFn = this.onChainQuoteProvider.getQuotesManyExactIn.bind(this.onChainQuoteProvider);
            const beforeQuotes = Date.now();
            util_1.log.info(`Getting quotes for mixed for ${routes.length} routes with ${amounts.length} amounts per route.`);
            const { routesWithQuotes } = yield quoteFn(amounts, routes, {
                blockNumber: routingConfig.blockNumber,
            });
            util_1.metric.putMetric('MixedQuotesLoad', Date.now() - beforeQuotes, util_1.MetricLoggerUnit.Milliseconds);
            util_1.metric.putMetric('MixedQuotesFetched', (0, lodash_1.default)(routesWithQuotes)
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
                        }, 'Dropping a null mixed quote for route.');
                        continue;
                    }
                    const routeWithValidQuote = new entities_1.MixedRouteWithValidQuote({
                        route,
                        rawQuote: quote,
                        amount,
                        percent,
                        sqrtPriceX96AfterList,
                        initializedTicksCrossedList,
                        quoterGasEstimate: gasEstimate,
                        mixedRouteGasModel: gasModel,
                        quoteToken,
                        tradeType,
                        v3PoolProvider: this.v3PoolProvider,
                        v2PoolProvider: this.v2PoolProvider,
                    });
                    routesWithValidQuotes.push(routeWithValidQuote);
                }
            }
            util_1.metric.putMetric('MixedGetQuotesLoad', Date.now() - beforeGetQuotes, util_1.MetricLoggerUnit.Milliseconds);
            return {
                routesWithValidQuotes,
                candidatePools
            };
        });
    }
}
exports.MixedQuoter = MixedQuoter;
