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
exports.V2Quoter = void 0;
const router_sdk_1 = require("@uniswap/router-sdk");
const sdk_core_1 = require("@uniswap/sdk-core");
const lodash_1 = __importDefault(require("lodash"));
const providers_1 = require("../../../providers");
const util_1 = require("../../../util");
const entities_1 = require("../entities");
const compute_all_routes_1 = require("../functions/compute-all-routes");
const base_quoter_1 = require("./base-quoter");
const gas_costs_1 = require("../gas-models/v3/gas-costs");
class V2Quoter extends base_quoter_1.BaseQuoter {
    constructor(v2SubgraphProvider, v2PoolProvider, v2QuoteProvider, v2GasModelFactory, tokenProvider, chainId, blockedTokenListProvider, tokenValidatorProvider) {
        super(tokenProvider, chainId, router_sdk_1.Protocol.V2, blockedTokenListProvider, tokenValidatorProvider);
        this.v2SubgraphProvider = v2SubgraphProvider;
        this.v2PoolProvider = v2PoolProvider;
        this.v2QuoteProvider = v2QuoteProvider;
        this.v2GasModelFactory = v2GasModelFactory;
    }
    getRoutes(tokenIn, tokenOut, v2CandidatePools, _tradeType, routingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGetRoutes = Date.now();
            // Fetch all the pools that we will consider routing via. There are thousands
            // of pools, so we filter them to a set of candidate pools that we expect will
            // result in good prices.
            const { poolAccessor, candidatePools } = v2CandidatePools;
            const poolsRaw = poolAccessor.getAllPools();
            // Drop any pools that contain tokens that can not be transferred according to the token validator.
            const pools = yield this.applyTokenValidatorToPools(poolsRaw, (token, tokenValidation) => {
                // If there is no available validation result we assume the token is fine.
                if (!tokenValidation) {
                    return false;
                }
                // Only filters out *intermediate* pools that involve tokens that we detect
                // cant be transferred. This prevents us trying to route through tokens that may
                // not be transferrable, but allows users to still swap those tokens if they
                // specify.
                if (tokenValidation == providers_1.TokenValidationResult.STF &&
                    (token.equals(tokenIn) || token.equals(tokenOut))) {
                    return false;
                }
                return tokenValidation == providers_1.TokenValidationResult.STF;
            });
            // Given all our candidate pools, compute all the possible ways to route from tokenIn to tokenOut.
            const { maxSwapsPerPath } = routingConfig;
            const routes = (0, compute_all_routes_1.computeAllV2Routes)(tokenIn, tokenOut, pools, maxSwapsPerPath);
            util_1.metric.putMetric('V2GetRoutesLoad', Date.now() - beforeGetRoutes, util_1.MetricLoggerUnit.Milliseconds);
            return {
                routes,
                candidatePools,
            };
        });
    }
    getQuotes(routes, amounts, percents, quoteToken, tradeType, _routingConfig, candidatePools, _gasModel, gasPriceWei) {
        return __awaiter(this, void 0, void 0, function* () {
            const beforeGetQuotes = Date.now();
            util_1.log.info('Starting to get V2 quotes');
            if (gasPriceWei === undefined) {
                throw new Error('GasPriceWei for V2Routes is required to getQuotes');
            }
            // throw if we have no amounts or if there are different tokens in the amounts
            if (amounts.length == 0 || !amounts.every((amount) => amount.currency.equals(amounts[0].currency))) {
                throw new Error('Amounts must have at least one amount and must be same token');
            }
            // safe to force unwrap here because we throw if there are no amounts
            const amountToken = amounts[0].currency;
            if (routes.length == 0) {
                return { routesWithValidQuotes: [], candidatePools };
            }
            // For all our routes, and all the fractional amounts, fetch quotes on-chain.
            const quoteFn = tradeType == sdk_core_1.TradeType.EXACT_INPUT
                ? this.v2QuoteProvider.getQuotesManyExactIn.bind(this.v2QuoteProvider)
                : this.v2QuoteProvider.getQuotesManyExactOut.bind(this.v2QuoteProvider);
            const beforeQuotes = Date.now();
            util_1.log.info(`Getting quotes for V2 for ${routes.length} routes with ${amounts.length} amounts per route.`);
            const { routesWithQuotes } = yield quoteFn(amounts, routes, _routingConfig);
            const v2GasModel = yield this.v2GasModelFactory.buildGasModel({
                chainId: this.chainId,
                gasPriceWei,
                poolProvider: this.v2PoolProvider,
                token: quoteToken,
                providerConfig: Object.assign(Object.assign({}, _routingConfig), { additionalGasOverhead: (0, gas_costs_1.NATIVE_OVERHEAD)(this.chainId, amountToken, quoteToken) }),
            });
            util_1.metric.putMetric('V2QuotesLoad', Date.now() - beforeQuotes, util_1.MetricLoggerUnit.Milliseconds);
            util_1.metric.putMetric('V2QuotesFetched', (0, lodash_1.default)(routesWithQuotes)
                .map(([, quotes]) => quotes.length)
                .sum(), util_1.MetricLoggerUnit.Count);
            const routesWithValidQuotes = [];
            for (const routeWithQuote of routesWithQuotes) {
                const [route, quotes] = routeWithQuote;
                for (let i = 0; i < quotes.length; i++) {
                    const percent = percents[i];
                    const amountQuote = quotes[i];
                    const { quote, amount } = amountQuote;
                    if (!quote) {
                        util_1.log.debug({
                            route: (0, util_1.routeToString)(route),
                            amountQuote,
                        }, 'Dropping a null V2 quote for route.');
                        continue;
                    }
                    const routeWithValidQuote = new entities_1.V2RouteWithValidQuote({
                        route,
                        rawQuote: quote,
                        amount,
                        percent,
                        gasModel: v2GasModel,
                        quoteToken,
                        tradeType,
                        v2PoolProvider: this.v2PoolProvider,
                    });
                    routesWithValidQuotes.push(routeWithValidQuote);
                }
            }
            util_1.metric.putMetric('V2GetQuotesLoad', Date.now() - beforeGetQuotes, util_1.MetricLoggerUnit.Milliseconds);
            return {
                routesWithValidQuotes,
                candidatePools,
            };
        });
    }
    refreshRoutesThenGetQuotes(tokenIn, tokenOut, routes, amounts, percents, quoteToken, tradeType, routingConfig, gasPriceWei) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenPairs = [];
            routes.forEach((route) => route.pairs.forEach((pair) => tokenPairs.push([pair.token0, pair.token1])));
            return this.v2PoolProvider
                .getPools(tokenPairs, routingConfig)
                .then((poolAccesor) => {
                const routes = (0, compute_all_routes_1.computeAllV2Routes)(tokenIn, tokenOut, poolAccesor.getAllPools(), routingConfig.maxSwapsPerPath);
                return this.getQuotes(routes, amounts, percents, quoteToken, tradeType, routingConfig, undefined, undefined, gasPriceWei);
            });
        });
    }
}
exports.V2Quoter = V2Quoter;
