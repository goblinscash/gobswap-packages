import { log } from '../util/log';
/**
 * Provider for getting gas price, with functionality for caching the results.
 *
 * @export
 * @class CachingV3SubgraphProvider
 */
export class CachingGasStationProvider {
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
    async getGasPrice() {
        const cachedGasPrice = await this.cache.get(this.GAS_KEY(this.chainId));
        if (cachedGasPrice) {
            log.info({ cachedGasPrice }, `Got gas station price from local cache: ${cachedGasPrice.gasPriceWei}.`);
            return cachedGasPrice;
        }
        log.info('Gas station price local cache miss.');
        const gasPrice = await this.gasPriceProvider.getGasPrice();
        await this.cache.set(this.GAS_KEY(this.chainId), gasPrice);
        return gasPrice;
    }
}
