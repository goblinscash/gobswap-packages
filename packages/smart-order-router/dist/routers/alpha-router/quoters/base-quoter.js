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
exports.BaseQuoter = void 0;
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("../../../util");
/**
 * Interface for a Quoter.
 * Defines the base dependencies, helper methods and interface for how to fetch quotes.
 *
 * @abstract
 * @template CandidatePools
 * @template Route
 */
class BaseQuoter {
    constructor(tokenProvider, chainId, protocol, blockedTokenListProvider, tokenValidatorProvider) {
        this.tokenProvider = tokenProvider;
        this.chainId = chainId;
        this.protocol = protocol;
        this.blockedTokenListProvider = blockedTokenListProvider;
        this.tokenValidatorProvider = tokenValidatorProvider;
    }
    /**
     * Public method which would first get the routes and then get the quotes.
     *
     * @param tokenIn The token that the user wants to provide
     * @param tokenOut The token that the usaw wants to receive
     * @param amounts the list of amounts to query for EACH route.
     * @param percents the percentage of each amount.
     * @param quoteToken
     * @param candidatePools
     * @param tradeType
     * @param routingConfig
     * @param gasModel the gasModel to be used for estimating gas cost
     * @param gasPriceWei instead of passing gasModel, gasPriceWei is used to generate a gasModel
     */
    getRoutesThenQuotes(tokenIn, tokenOut, amount, amounts, percents, quoteToken, candidatePools, tradeType, routingConfig, gasModel, gasPriceWei) {
        return this.getRoutes(tokenIn, tokenOut, candidatePools, tradeType, routingConfig)
            .then((routesResult) => {
            if (routesResult.routes.length == 1) {
                util_1.metric.putMetric(`${this.protocol}QuoterSingleRoute`, 1, util_1.MetricLoggerUnit.Count);
                percents = [100];
                amounts = [amount];
            }
            if (routesResult.routes.length > 0) {
                util_1.metric.putMetric(`${this.protocol}QuoterRoutesFound`, routesResult.routes.length, util_1.MetricLoggerUnit.Count);
            }
            else {
                util_1.metric.putMetric(`${this.protocol}QuoterNoRoutesFound`, routesResult.routes.length, util_1.MetricLoggerUnit.Count);
            }
            return this.getQuotes(routesResult.routes, amounts, percents, quoteToken, tradeType, routingConfig, routesResult.candidatePools, gasModel, gasPriceWei);
        });
    }
    applyTokenValidatorToPools(pools, isInvalidFn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.tokenValidatorProvider) {
                return pools;
            }
            util_1.log.info(`Running token validator on ${pools.length} pools`);
            const tokens = lodash_1.default.flatMap(pools, (pool) => [pool.token0, pool.token1]);
            const tokenValidationResults = yield this.tokenValidatorProvider.validateTokens(tokens);
            const poolsFiltered = lodash_1.default.filter(pools, (pool) => {
                const token0Validation = tokenValidationResults.getValidationByToken(pool.token0);
                const token1Validation = tokenValidationResults.getValidationByToken(pool.token1);
                const token0Invalid = isInvalidFn(pool.token0, token0Validation);
                const token1Invalid = isInvalidFn(pool.token1, token1Validation);
                if (token0Invalid || token1Invalid) {
                    util_1.log.info(`Dropping pool ${(0, util_1.poolToString)(pool)} because token is invalid. ${pool.token0.symbol}: ${token0Validation}, ${pool.token1.symbol}: ${token1Validation}`);
                }
                return !token0Invalid && !token1Invalid;
            });
            return poolsFiltered;
        });
    }
}
exports.BaseQuoter = BaseQuoter;
