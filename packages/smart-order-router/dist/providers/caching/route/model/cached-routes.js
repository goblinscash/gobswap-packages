"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedRoutes = void 0;
const lodash_1 = __importDefault(require("lodash"));
const cached_route_1 = require("./cached-route");
/**
 * Class defining the route to cache
 *
 * @export
 * @class CachedRoute
 */
class CachedRoutes {
    /**
     * @param routes
     * @param chainId
     * @param tokenIn
     * @param tokenOut
     * @param protocolsCovered
     * @param blockNumber
     * @param tradeType
     * @param originalAmount
     * @param blocksToLive
     */
    constructor({ routes, chainId, tokenIn, tokenOut, protocolsCovered, blockNumber, tradeType, originalAmount, blocksToLive = 0 }) {
        this.routes = routes;
        this.chainId = chainId;
        this.tokenIn = tokenIn;
        this.tokenOut = tokenOut;
        this.protocolsCovered = protocolsCovered;
        this.blockNumber = blockNumber;
        this.tradeType = tradeType;
        this.originalAmount = originalAmount;
        this.blocksToLive = blocksToLive;
    }
    /**
     * Factory method that creates a `CachedRoutes` object from an array of RouteWithValidQuote.
     *
     * @public
     * @static
     * @param routes
     * @param chainId
     * @param tokenIn
     * @param tokenOut
     * @param protocolsCovered
     * @param blockNumber
     * @param tradeType
     * @param originalAmount
     */
    static fromRoutesWithValidQuotes(routes, chainId, tokenIn, tokenOut, protocolsCovered, blockNumber, tradeType, originalAmount) {
        if (routes.length == 0)
            return undefined;
        const cachedRoutes = lodash_1.default.map(routes, (route) => new cached_route_1.CachedRoute({ route: route.route, percent: route.percent }));
        return new CachedRoutes({
            routes: cachedRoutes,
            chainId,
            tokenIn,
            tokenOut,
            protocolsCovered,
            blockNumber,
            tradeType,
            originalAmount
        });
    }
    /**
     * Function to determine if, given a block number, the CachedRoute is expired or not.
     *
     * @param currentBlockNumber
     * @param optimistic
     */
    notExpired(currentBlockNumber, optimistic = false) {
        // When it's not optimistic, we only allow the route of the existing block.
        const blocksToLive = optimistic ? this.blocksToLive : 0;
        const blocksDifference = currentBlockNumber - this.blockNumber;
        return blocksDifference <= blocksToLive;
    }
}
exports.CachedRoutes = CachedRoutes;
