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
exports.CachingGasStationProvider = void 0;
const log_1 = require("../util/log");
/**
 * Provider for getting gas price, with functionality for caching the results.
 *
 * @export
 * @class CachingV3SubgraphProvider
 */
class CachingGasStationProvider {
    /**
     * Creates an instance of CachingGasStationProvider.
     * @param chainId The chain id to use.
     * @param gasPriceProvider The provider to use to get the gas price when not in the cache.
     * @param cache Cache instance to hold cached pools.
     */
    constructor(chainId, gasPriceProvider, cache) {
        this.chainId = chainId;
        this.gasPriceProvider = gasPriceProvider;
        this.cache = cache;
        this.GAS_KEY = (chainId) => `gasPrice-${chainId}`;
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedGasPrice = yield this.cache.get(this.GAS_KEY(this.chainId));
            if (cachedGasPrice) {
                log_1.log.info({ cachedGasPrice }, `Got gas station price from local cache: ${cachedGasPrice.gasPriceWei}.`);
                return cachedGasPrice;
            }
            log_1.log.info('Gas station price local cache miss.');
            const gasPrice = yield this.gasPriceProvider.getGasPrice();
            yield this.cache.set(this.GAS_KEY(this.chainId), gasPrice);
            return gasPrice;
        });
    }
}
exports.CachingGasStationProvider = CachingGasStationProvider;
