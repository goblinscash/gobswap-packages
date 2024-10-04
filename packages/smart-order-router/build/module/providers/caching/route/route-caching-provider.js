import { TradeType } from '@uniswap/sdk-core';
import { CacheMode } from './model';
/**
 * Abstract class for a RouteCachingProvider.
 * Defines the base methods of how to interact with this interface, but not the implementation of how to cache.
 */
export class IRouteCachingProvider {
    constructor() {
        /**
         * Final implementation of the public `getCachedRoute` method, this is how code will interact with the implementation
         *
         * @public
         * @readonly
         * @param chainId
         * @param amount
         * @param quoteToken
         * @param tradeType
         * @param protocols
         * @param blockNumber
         */
        this.getCachedRoute = async (// Defined as a readonly member instead of a regular function to make it final.
        chainId, amount, quoteToken, tradeType, protocols, blockNumber, optimistic = false) => {
            if (await this.getCacheMode(chainId, amount, quoteToken, tradeType, protocols) == CacheMode.Darkmode) {
                return undefined;
            }
            const cachedRoute = await this._getCachedRoute(chainId, amount, quoteToken, tradeType, protocols, blockNumber, optimistic);
            return this.filterExpiredCachedRoutes(cachedRoute, blockNumber, optimistic);
        };
        /**
         * Final implementation of the public `setCachedRoute` method.
         * This method will set the blockToLive in the CachedRoutes object before calling the internal method to insert in cache.
         *
         * @public
         * @readonly
         * @param cachedRoutes The route to cache.
         * @returns Promise<boolean> Indicates if the route was inserted into cache.
         */
        this.setCachedRoute = async (// Defined as a readonly member instead of a regular function to make it final.
        cachedRoutes, amount) => {
            if (await this.getCacheModeFromCachedRoutes(cachedRoutes, amount) == CacheMode.Darkmode) {
                return false;
            }
            cachedRoutes.blocksToLive = await this._getBlocksToLive(cachedRoutes, amount);
            return this._setCachedRoute(cachedRoutes, amount);
        };
    }
    /**
     * Returns the CacheMode for the given cachedRoutes and amount
     *
     * @param cachedRoutes
     * @param amount
     */
    getCacheModeFromCachedRoutes(cachedRoutes, amount) {
        const quoteToken = cachedRoutes.tradeType == TradeType.EXACT_INPUT ? cachedRoutes.tokenOut : cachedRoutes.tokenIn;
        return this.getCacheMode(cachedRoutes.chainId, amount, quoteToken, cachedRoutes.tradeType, cachedRoutes.protocolsCovered);
    }
    filterExpiredCachedRoutes(cachedRoutes, blockNumber, optimistic) {
        return (cachedRoutes === null || cachedRoutes === void 0 ? void 0 : cachedRoutes.notExpired(blockNumber, optimistic)) ? cachedRoutes : undefined;
    }
}
