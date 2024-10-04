import { log } from '../util';
import { IGasPriceProvider } from './gas-price-provider';
export class LegacyGasPriceProvider extends IGasPriceProvider {
    constructor(provider) {
        super();
        this.provider = provider;
    }
    async getGasPrice() {
        const gasPriceWei = await this.provider.getGasPrice();
        log.info({ gasPriceWei }, `Got gas price ${gasPriceWei} using eth_gasPrice RPC`);
        return {
            gasPriceWei,
        };
    }
}
