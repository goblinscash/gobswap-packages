import { Protocol } from '@uniswap/router-sdk';
import { TradeType } from '@uniswap/sdk-core';
import _ from 'lodash';
import { TokenValidationResult, } from '../../../providers';
import { log, metric, MetricLoggerUnit, routeToString, } from '../../../util';
import { V2RouteWithValidQuote } from '../entities';
import { computeAllV2Routes } from '../functions/compute-all-routes';
import { BaseQuoter } from './base-quoter';
import { NATIVE_OVERHEAD } from '../gas-models/v3/gas-costs';
export class V2Quoter extends BaseQuoter {
    constructor(v2SubgraphProvider, v2PoolProvider, v2QuoteProvider, v2GasModelFactory, tokenProvider, chainId, blockedTokenListProvider, tokenValidatorProvider) {
        super(tokenProvider, chainId, Protocol.V2, blockedTokenListProvider, tokenValidatorProvider);
        this.v2SubgraphProvider = v2SubgraphProvider;
        this.v2PoolProvider = v2PoolProvider;
        this.v2QuoteProvider = v2QuoteProvider;
        this.v2GasModelFactory = v2GasModelFactory;
    }
    async getRoutes(tokenIn, tokenOut, v2CandidatePools, _tradeType, routingConfig) {
        const beforeGetRoutes = Date.now();
        // Fetch all the pools that we will consider routing via. There are thousands
        // of pools, so we filter them to a set of candidate pools that we expect will
        // result in good prices.
        const { poolAccessor, candidatePools } = v2CandidatePools;
        const poolsRaw = poolAccessor.getAllPools();
        // Drop any pools that contain tokens that can not be transferred according to the token validator.
        const pools = await this.applyTokenValidatorToPools(poolsRaw, (token, tokenValidation) => {
            // If there is no available validation result we assume the token is fine.
            if (!tokenValidation) {
                return false;
            }
            // Only filters out *intermediate* pools that involve tokens that we detect
            // cant be transferred. This prevents us trying to route through tokens that may
            // not be transferrable, but allows users to still swap those tokens if they
            // specify.
            if (tokenValidation == TokenValidationResult.STF &&
                (token.equals(tokenIn) || token.equals(tokenOut))) {
                return false;
            }
            return tokenValidation == TokenValidationResult.STF;
        });
        // Given all our candidate pools, compute all the possible ways to route from tokenIn to tokenOut.
        const { maxSwapsPerPath } = routingConfig;
        const routes = computeAllV2Routes(tokenIn, tokenOut, pools, maxSwapsPerPath);
        metric.putMetric('V2GetRoutesLoad', Date.now() - beforeGetRoutes, MetricLoggerUnit.Milliseconds);
        return {
            routes,
            candidatePools,
        };
    }
    async getQuotes(routes, amounts, percents, quoteToken, tradeType, _routingConfig, candidatePools, _gasModel, gasPriceWei) {
        const beforeGetQuotes = Date.now();
        log.info('Starting to get V2 quotes');
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
        const quoteFn = tradeType == TradeType.EXACT_INPUT
            ? this.v2QuoteProvider.getQuotesManyExactIn.bind(this.v2QuoteProvider)
            : this.v2QuoteProvider.getQuotesManyExactOut.bind(this.v2QuoteProvider);
        const beforeQuotes = Date.now();
        log.info(`Getting quotes for V2 for ${routes.length} routes with ${amounts.length} amounts per route.`);
        const { routesWithQuotes } = await quoteFn(amounts, routes, _routingConfig);
        const v2GasModel = await this.v2GasModelFactory.buildGasModel({
            chainId: this.chainId,
            gasPriceWei,
            poolProvider: this.v2PoolProvider,
            token: quoteToken,
            providerConfig: {
                ..._routingConfig,
                additionalGasOverhead: NATIVE_OVERHEAD(this.chainId, amountToken, quoteToken)
            },
        });
        metric.putMetric('V2QuotesLoad', Date.now() - beforeQuotes, MetricLoggerUnit.Milliseconds);
        metric.putMetric('V2QuotesFetched', _(routesWithQuotes)
            .map(([, quotes]) => quotes.length)
            .sum(), MetricLoggerUnit.Count);
        const routesWithValidQuotes = [];
        for (const routeWithQuote of routesWithQuotes) {
            const [route, quotes] = routeWithQuote;
            for (let i = 0; i < quotes.length; i++) {
                const percent = percents[i];
                const amountQuote = quotes[i];
                const { quote, amount } = amountQuote;
                if (!quote) {
                    log.debug({
                        route: routeToString(route),
                        amountQuote,
                    }, 'Dropping a null V2 quote for route.');
                    continue;
                }
                const routeWithValidQuote = new V2RouteWithValidQuote({
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
        metric.putMetric('V2GetQuotesLoad', Date.now() - beforeGetQuotes, MetricLoggerUnit.Milliseconds);
        return {
            routesWithValidQuotes,
            candidatePools,
        };
    }
    async refreshRoutesThenGetQuotes(tokenIn, tokenOut, routes, amounts, percents, quoteToken, tradeType, routingConfig, gasPriceWei) {
        const tokenPairs = [];
        routes.forEach((route) => route.pairs.forEach((pair) => tokenPairs.push([pair.token0, pair.token1])));
        return this.v2PoolProvider
            .getPools(tokenPairs, routingConfig)
            .then((poolAccesor) => {
            const routes = computeAllV2Routes(tokenIn, tokenOut, poolAccesor.getAllPools(), routingConfig.maxSwapsPerPath);
            return this.getQuotes(routes, amounts, percents, quoteToken, tradeType, routingConfig, undefined, undefined, gasPriceWei);
        });
    }
}
