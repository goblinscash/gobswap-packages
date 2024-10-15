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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingV2SubgraphProvider = void 0;
/**
 * Provider for getting V2 pools, with functionality for caching the results.
 *
 * @export
 * @class CachingV2SubgraphProvider
 */
class CachingV2SubgraphProvider {
    /**
     * Creates an instance of CachingV2SubgraphProvider.
     * @param chainId The chain id to use.
     * @param subgraphProvider The provider to use to get the subgraph pools when not in the cache.
     * @param cache Cache instance to hold cached pools.
     */
    constructor(chainId, subgraphProvider, cache) {
        this.chainId = chainId;
        this.subgraphProvider = subgraphProvider;
        this.cache = cache;
        this.SUBGRAPH_KEY = (chainId) => `subgraph-pools-v2-${chainId}`;
    }
    getPools() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedPools = yield this.cache.get(this.SUBGRAPH_KEY(this.chainId));
            if (cachedPools) {
                return cachedPools;
            }
            const pools = yield this.subgraphProvider.getPools();
            yield this.cache.set(this.SUBGRAPH_KEY(this.chainId), pools);
            return pools;
        });
    }
}
exports.CachingV2SubgraphProvider = CachingV2SubgraphProvider;
